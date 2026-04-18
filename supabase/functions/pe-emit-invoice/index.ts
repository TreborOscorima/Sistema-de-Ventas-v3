// Edge Function: pe-emit-invoice
// Emite un comprobante electrónico en Perú vía Nubefact.
// Si los secrets NUBEFACT_TOKEN / NUBEFACT_URL no están configurados,
// la factura se guarda en estado "pending" con un mensaje claro.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItemPayload {
  product_id?: string | null;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number; // 18 for IGV PE
  unit_code?: string;
  discount?: number;
}

interface EmitPayload {
  company_id: string;
  branch_id?: string | null;
  sale_id?: string | null;
  document_type:
    | "pe_boleta"
    | "pe_factura"
    | "pe_nota_credito"
    | "pe_nota_debito"
    | "pe_guia_remision";
  series: string;
  customer: {
    id?: string | null;
    doc_type:
      | "pe_dni"
      | "pe_ruc"
      | "pe_ce"
      | "pe_pasaporte"
      | "pe_sin_doc";
    doc_number: string;
    legal_name: string;
    address?: string;
    email?: string;
  };
  currency?: string;
  items: InvoiceItemPayload[];
  observations?: string;
  metadata?: Record<string, unknown>;
}

function totals(items: InvoiceItemPayload[]) {
  let subtotal = 0;
  let taxAmount = 0;
  for (const it of items) {
    const lineSubtotal =
      (it.quantity * it.unit_price) - (it.discount || 0);
    const lineNet = lineSubtotal / (1 + it.tax_rate / 100);
    const lineTax = lineSubtotal - lineNet;
    subtotal += lineNet;
    taxAmount += lineTax;
  }
  const total = subtotal + taxAmount;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

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

async function callNubefact(
  url: string,
  token: string,
  payload: Record<string, unknown>,
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token token="${token}"`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
        Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as EmitPayload;

    // Validaciones mínimas
    if (
      !payload.company_id || !payload.document_type || !payload.series ||
      !payload.customer || !payload.items?.length
    ) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (
      payload.document_type === "pe_factura" &&
      payload.customer.doc_type !== "pe_ruc"
    ) {
      return new Response(
        JSON.stringify({
          error: "Las Facturas requieren cliente con RUC",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const t = totals(payload.items);
    const taxRate = payload.items[0]?.tax_rate ?? 18;
    const currency = payload.currency || "PEN";

    // Reservar correlativo (RPC seguro)
    const { data: nextNumber, error: numErr } = await supabase.rpc(
      "get_next_invoice_number",
      {
        _company_id: payload.company_id,
        _document_type: payload.document_type,
        _series: payload.series,
      },
    );
    if (numErr || nextNumber == null) {
      return new Response(
        JSON.stringify({
          error: numErr?.message || "No se pudo generar correlativo",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const fullNumber = `${payload.series}-${nextNumber}`;

    // Crear registro pendiente
    const { data: invoice, error: insErr } = await supabase
      .from("electronic_invoices")
      .insert({
        company_id: payload.company_id,
        branch_id: payload.branch_id ?? null,
        user_id: user.id,
        sale_id: payload.sale_id ?? null,
        country: "PE",
        document_type: payload.document_type,
        series: payload.series,
        number: nextNumber,
        full_number: fullNumber,
        customer_id: payload.customer.id ?? null,
        customer_doc_type: payload.customer.doc_type,
        customer_doc_number: payload.customer.doc_number,
        customer_legal_name: payload.customer.legal_name,
        customer_address: payload.customer.address ?? null,
        customer_email: payload.customer.email ?? null,
        currency,
        subtotal: t.subtotal,
        tax_amount: t.taxAmount,
        tax_rate: taxRate,
        total: t.total,
        status: "processing",
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        metadata: payload.metadata ?? {},
      })
      .select()
      .single();

    if (insErr || !invoice) {
      return new Response(
        JSON.stringify({ error: insErr?.message || "Error al crear factura" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insertar items
    await supabase.from("invoice_items").insert(
      payload.items.map((it) => {
        const lineSubtotal =
          (it.quantity * it.unit_price) - (it.discount || 0);
        const lineNet = lineSubtotal / (1 + it.tax_rate / 100);
        const lineTax = lineSubtotal - lineNet;
        return {
          invoice_id: invoice.id,
          product_id: it.product_id ?? null,
          product_name: it.product_name,
          description: it.description ?? null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
          discount: it.discount || 0,
          unit_code: it.unit_code || "NIU",
          subtotal: Number(lineNet.toFixed(2)),
          tax_amount: Number(lineTax.toFixed(2)),
          total: Number(lineSubtotal.toFixed(2)),
        };
      }),
    );

    const NUBEFACT_TOKEN = Deno.env.get("NUBEFACT_TOKEN");
    const NUBEFACT_URL = Deno.env.get("NUBEFACT_URL");

    // Si faltan credenciales -> deja la factura pendiente con mensaje
    if (!NUBEFACT_TOKEN || !NUBEFACT_URL) {
      await supabase
        .from("electronic_invoices")
        .update({
          status: "pending",
          error_code: "MISSING_CREDENTIALS",
          error_message:
            "Credenciales de Nubefact no configuradas. La factura se reservó con correlativo pero no se envió a SUNAT.",
        })
        .eq("id", invoice.id);

      return new Response(
        JSON.stringify({
          ok: true,
          invoice_id: invoice.id,
          full_number: fullNumber,
          status: "pending",
          message: "Factura reservada. Configura NUBEFACT_TOKEN y NUBEFACT_URL para enviar a SUNAT.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Construir payload Nubefact
    const nubefactPayload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: NUBEFACT_DOC_TYPE_MAP[payload.document_type],
      serie: payload.series,
      numero: nextNumber,
      sunat_transaction: 1,
      cliente_tipo_de_documento: NUBEFACT_CLIENT_DOC_MAP[payload.customer.doc_type],
      cliente_numero_de_documento: payload.customer.doc_number,
      cliente_denominacion: payload.customer.legal_name,
      cliente_direccion: payload.customer.address || "-",
      cliente_email: payload.customer.email || "",
      fecha_de_emision: new Date().toISOString().split("T")[0],
      moneda: currency === "USD" ? 2 : 1,
      porcentaje_de_igv: taxRate,
      total_gravada: t.subtotal,
      total_igv: t.taxAmount,
      total: t.total,
      observaciones: payload.observations || "",
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: !!payload.customer.email,
      formato_de_pdf: "TICKET",
      items: payload.items.map((it) => {
        const lineSubtotal =
          (it.quantity * it.unit_price) - (it.discount || 0);
        const lineNet = lineSubtotal / (1 + it.tax_rate / 100);
        const lineTax = lineSubtotal - lineNet;
        return {
          unidad_de_medida: it.unit_code || "NIU",
          codigo: it.product_id || "",
          descripcion: it.product_name,
          cantidad: it.quantity,
          valor_unitario: Number((it.unit_price / (1 + it.tax_rate / 100)).toFixed(4)),
          precio_unitario: it.unit_price,
          descuento: it.discount || 0,
          subtotal: Number(lineNet.toFixed(2)),
          tipo_de_igv: 1,
          igv: Number(lineTax.toFixed(2)),
          total: Number(lineSubtotal.toFixed(2)),
          anticipo_regularizacion: false,
        };
      }),
    };

    const result = await callNubefact(
      NUBEFACT_URL,
      NUBEFACT_TOKEN,
      nubefactPayload,
    );

    if (!result.ok || result.data?.errors) {
      await supabase
        .from("electronic_invoices")
        .update({
          status: "rejected",
          error_code: String(result.status),
          error_message: JSON.stringify(result.data?.errors || result.data),
          cdr_response: result.data,
        })
        .eq("id", invoice.id);

      return new Response(
        JSON.stringify({
          ok: false,
          invoice_id: invoice.id,
          error: result.data?.errors || "Error en Nubefact",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await supabase
      .from("electronic_invoices")
      .update({
        status: "accepted",
        pdf_url: result.data?.enlace_del_pdf || null,
        xml_content: result.data?.enlace_del_xml || null,
        qr_data: result.data?.codigo_qr || null,
        hash: result.data?.codigo_hash || null,
        cdr_response: result.data,
      })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        ok: true,
        invoice_id: invoice.id,
        full_number: fullNumber,
        status: "accepted",
        pdf_url: result.data?.enlace_del_pdf,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("pe-emit-invoice error", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
