// Edge Function: retry-invoice
// Re-intenta el envío a SUNAT (PE/Nubefact) o AFIP (AR) para comprobantes
// en estado pending/rejected/error, o re-intenta una anulación pendiente
// (metadata.cancellation_pending = true). No genera nuevo correlativo:
// actualiza el mismo registro electronic_invoices.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NUBEFACT_DOC_TYPE_MAP: Record<string, number> = {
  pe_factura: 1,
  pe_boleta: 2,
  pe_nota_credito: 3,
  pe_nota_debito: 4,
  pe_guia_remision: 7,
};

const NUBEFACT_CLIENT_DOC_MAP: Record<string, number> = {
  pe_ruc: 6,
  pe_dni: 1,
  pe_ce: 4,
  pe_pasaporte: 7,
  pe_sin_doc: 0,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const body = await req.json().catch(() => ({}));
    const invoiceIds: string[] = Array.isArray(body.invoice_ids)
      ? body.invoice_ids
      : body.invoice_id
        ? [body.invoice_id]
        : [];

    if (!invoiceIds.length) {
      return jsonResponse({ error: "invoice_id o invoice_ids requerido" }, 400);
    }

    const results: Array<Record<string, unknown>> = [];

    for (const id of invoiceIds) {
      const result = await retryOne(supabase, id);
      results.push({ invoice_id: id, ...result });
    }

    return jsonResponse({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error("retry-invoice error", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      500,
    );
  }
});

async function retryOne(supabase: any, id: string) {
  const { data: inv, error } = await supabase
    .from("electronic_invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !inv) {
    return { ok: false, error: "Comprobante no encontrado" };
  }

  const meta = (inv.metadata || {}) as Record<string, unknown>;
  const isCancellationPending = meta.cancellation_pending === true;

  // Caso 1: anulación pendiente
  if (isCancellationPending) {
    if (inv.country === "PE") {
      return await retryPeCancel(supabase, inv);
    }
    return await retryArCancel(supabase, inv);
  }

  // Caso 2: emisión pendiente / rechazada / error
  if (!["pending", "rejected", "error"].includes(inv.status)) {
    return {
      ok: false,
      skipped: true,
      message: `No re-intentado (estado actual: ${inv.status})`,
    };
  }

  if (inv.country === "PE") {
    return await retryPeEmit(supabase, inv);
  }
  return await retryArEmit(supabase, inv);
}

// ============== PE EMIT RETRY ==============
async function retryPeEmit(supabase: any, inv: any) {
  const NUBEFACT_TOKEN = Deno.env.get("NUBEFACT_TOKEN");
  const NUBEFACT_URL = Deno.env.get("NUBEFACT_URL");

  await supabase
    .from("electronic_invoices")
    .update({
      attempts: (inv.attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", inv.id);

  if (!NUBEFACT_TOKEN || !NUBEFACT_URL) {
    await supabase
      .from("electronic_invoices")
      .update({
        status: "pending",
        error_code: "MISSING_CREDENTIALS",
        error_message:
          "Credenciales de Nubefact no configuradas. El comprobante sigue pendiente.",
      })
      .eq("id", inv.id);
    return {
      ok: true,
      pending: true,
      message: "Sin credenciales Nubefact: comprobante sigue pendiente.",
    };
  }

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", inv.id);

  const taxRate = Number(inv.tax_rate || 18);
  const meta = (inv.metadata || {}) as Record<string, unknown>;
  const isNote =
    inv.document_type === "pe_nota_credito" ||
    inv.document_type === "pe_nota_debito";

  let referenceInvoice: any = null;
  if (isNote && inv.reference_invoice_id) {
    const { data: ref } = await supabase
      .from("electronic_invoices")
      .select("*")
      .eq("id", inv.reference_invoice_id)
      .maybeSingle();
    referenceInvoice = ref;
  }

  const nubefactPayload = {
    operacion: "generar_comprobante",
    tipo_de_comprobante: NUBEFACT_DOC_TYPE_MAP[inv.document_type],
    serie: inv.series,
    numero: inv.number,
    sunat_transaction: 1,
    cliente_tipo_de_documento:
      NUBEFACT_CLIENT_DOC_MAP[inv.customer_doc_type as string] ?? 0,
    cliente_numero_de_documento: inv.customer_doc_number,
    cliente_denominacion: inv.customer_legal_name,
    cliente_direccion: inv.customer_address || "-",
    cliente_email: inv.customer_email || "",
    fecha_de_emision: new Date(inv.issue_date).toISOString().split("T")[0],
    moneda: inv.currency === "USD" ? 2 : 1,
    porcentaje_de_igv: taxRate,
    total_gravada: Number(inv.subtotal),
    total_igv: Number(inv.tax_amount),
    total: Number(inv.total),
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: !!inv.customer_email,
    formato_de_pdf: "TICKET",
    ...(isNote && referenceInvoice
      ? {
          tipo_de_nota_de_credito:
            inv.document_type === "pe_nota_credito"
              ? (meta.note_type_code ?? 1)
              : undefined,
          tipo_de_nota_de_debito:
            inv.document_type === "pe_nota_debito"
              ? (meta.note_type_code ?? 1)
              : undefined,
          motivo: meta.note_reason || "",
          serie_del_documento_que_se_modifica: referenceInvoice.series,
          numero_del_documento_que_se_modifica: String(referenceInvoice.number),
          tipo_de_documento_que_se_modifica:
            NUBEFACT_DOC_TYPE_MAP[referenceInvoice.document_type],
        }
      : {}),
    items: (items || []).map((it: any) => ({
      unidad_de_medida: it.unit_code || "NIU",
      codigo: it.product_id || "",
      descripcion: it.product_name,
      cantidad: Number(it.quantity),
      valor_unitario: Number(
        (Number(it.unit_price) / (1 + Number(it.tax_rate) / 100)).toFixed(4),
      ),
      precio_unitario: Number(it.unit_price),
      descuento: Number(it.discount || 0),
      subtotal: Number(it.subtotal),
      tipo_de_igv: 1,
      igv: Number(it.tax_amount),
      total: Number(it.total),
      anticipo_regularizacion: false,
    })),
  };

  const res = await fetch(NUBEFACT_URL, {
    method: "POST",
    headers: {
      Authorization: `Token token="${NUBEFACT_TOKEN}"`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nubefactPayload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.errors) {
    await supabase
      .from("electronic_invoices")
      .update({
        status: "rejected",
        error_code: String(res.status),
        error_message: JSON.stringify(data?.errors || data),
        cdr_response: data,
      })
      .eq("id", inv.id);
    return { ok: false, status: "rejected", error: data?.errors || data };
  }

  await supabase
    .from("electronic_invoices")
    .update({
      status: "accepted",
      pdf_url: data?.enlace_del_pdf || null,
      xml_content: data?.enlace_del_xml || null,
      qr_data: data?.codigo_qr || null,
      hash: data?.codigo_hash || null,
      cdr_response: data,
      error_code: null,
      error_message: null,
    })
    .eq("id", inv.id);

  return { ok: true, status: "accepted", pdf_url: data?.enlace_del_pdf };
}

// ============== AR EMIT RETRY ==============
async function retryArEmit(supabase: any, inv: any) {
  const AFIP_CUIT = Deno.env.get("AFIP_CUIT");
  const AFIP_TOKEN = Deno.env.get("AFIP_TOKEN");

  await supabase
    .from("electronic_invoices")
    .update({
      attempts: (inv.attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", inv.id);

  if (!AFIP_CUIT || !AFIP_TOKEN) {
    await supabase
      .from("electronic_invoices")
      .update({
        status: "pending",
        error_code: "MISSING_CREDENTIALS",
        error_message:
          "Credenciales de AFIP no configuradas. El comprobante sigue pendiente.",
      })
      .eq("id", inv.id);
    return {
      ok: true,
      pending: true,
      message: "Sin credenciales AFIP: comprobante sigue pendiente.",
    };
  }

  // Placeholder: integración AFIP real se implementará al configurar credenciales.
  await supabase
    .from("electronic_invoices")
    .update({
      status: "pending",
      error_message:
        "Reintento AFIP aún no implementado. Configura el conector AFIP para habilitar el envío.",
    })
    .eq("id", inv.id);

  return {
    ok: true,
    pending: true,
    message: "Reintento AR pendiente de implementación con credenciales AFIP.",
  };
}

// ============== PE CANCEL RETRY ==============
async function retryPeCancel(supabase: any, inv: any) {
  const NUBEFACT_TOKEN = Deno.env.get("NUBEFACT_TOKEN");
  const NUBEFACT_URL = Deno.env.get("NUBEFACT_URL");

  await supabase
    .from("electronic_invoices")
    .update({
      attempts: (inv.attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", inv.id);

  if (!NUBEFACT_TOKEN || !NUBEFACT_URL) {
    return {
      ok: true,
      pending: true,
      message: "Sin credenciales Nubefact: anulación sigue pendiente.",
    };
  }

  const payload = {
    operacion: "generar_anulacion",
    tipo_de_comprobante: NUBEFACT_DOC_TYPE_MAP[inv.document_type],
    serie: inv.series,
    numero: inv.number,
    motivo: inv.cancellation_reason || "Anulación de comprobante",
    codigo_unico: inv.full_number,
  };

  const res = await fetch(NUBEFACT_URL, {
    method: "POST",
    headers: {
      Authorization: `Token token="${NUBEFACT_TOKEN}"`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.errors) {
    return { ok: false, error: data?.errors || data };
  }

  const meta = (inv.metadata || {}) as Record<string, unknown>;
  delete meta.cancellation_pending;

  await supabase
    .from("electronic_invoices")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      metadata: { ...meta, cancellation_ticket: data?.numero_de_ticket || null },
    })
    .eq("id", inv.id);

  return { ok: true, status: "cancelled", ticket: data?.numero_de_ticket };
}

// ============== AR CANCEL RETRY ==============
async function retryArCancel(supabase: any, inv: any) {
  // AR requiere Nota de Crédito; si está marcada como pendiente, sólo
  // recordamos al usuario que debe emitirla.
  return {
    ok: false,
    pending: true,
    message:
      "AFIP no permite anular: emite una Nota de Crédito por el total para regularizar.",
  };
}
