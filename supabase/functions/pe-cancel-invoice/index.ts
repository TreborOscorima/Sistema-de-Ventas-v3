// Edge Function: pe-cancel-invoice
// Comunica la anulación (baja) de un comprobante a Nubefact/SUNAT.
// Si NUBEFACT_TOKEN / NUBEFACT_URL no están configurados, registra la
// solicitud de anulación en metadata pero deja el estado como "accepted"
// con la marca cancellation_pending = true.

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

interface CancelPayload {
  invoice_id: string;
  reason: string;
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

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id, reason } = (await req.json()) as CancelPayload;
    if (!invoice_id || !reason?.trim()) {
      return new Response(
        JSON.stringify({ error: "invoice_id y reason son requeridos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: invoice, error: invErr } = await supabase
      .from("electronic_invoices")
      .select("*")
      .eq("id", invoice_id)
      .maybeSingle();

    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ error: "Comprobante no encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (invoice.country !== "PE") {
      return new Response(
        JSON.stringify({ error: "Comprobante no pertenece a Perú" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (invoice.status === "cancelled") {
      return new Response(
        JSON.stringify({ ok: true, status: "cancelled", message: "Ya estaba anulado" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const NUBEFACT_TOKEN = Deno.env.get("NUBEFACT_TOKEN");
    const NUBEFACT_URL = Deno.env.get("NUBEFACT_URL");

    const nowIso = new Date().toISOString();
    const baseMeta = (invoice.metadata as Record<string, unknown>) || {};

    if (!NUBEFACT_TOKEN || !NUBEFACT_URL) {
      await supabase
        .from("electronic_invoices")
        .update({
          cancellation_reason: reason,
          metadata: {
            ...baseMeta,
            cancellation_pending: true,
            cancellation_requested_at: nowIso,
            cancellation_requested_by: user.id,
          },
        })
        .eq("id", invoice.id);

      return new Response(
        JSON.stringify({
          ok: true,
          status: invoice.status,
          pending: true,
          message:
            "Solicitud de anulación registrada. Configura NUBEFACT_TOKEN y NUBEFACT_URL para comunicarla a SUNAT.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload = {
      operacion: "generar_anulacion",
      tipo_de_comprobante:
        NUBEFACT_DOC_TYPE_MAP[invoice.document_type] ?? 1,
      serie: invoice.series,
      numero: invoice.number,
      motivo: reason,
      codigo_unico: invoice.full_number || `${invoice.series}-${invoice.number}`,
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
      await supabase
        .from("electronic_invoices")
        .update({
          error_code: String(res.status),
          error_message: JSON.stringify(data?.errors || data),
          metadata: {
            ...baseMeta,
            cancellation_pending: true,
            cancellation_requested_at: nowIso,
            cancellation_last_response: data,
          },
        })
        .eq("id", invoice.id);

      return new Response(
        JSON.stringify({
          ok: false,
          error: data?.errors || "Error en Nubefact al anular",
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
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: reason,
        metadata: {
          ...baseMeta,
          cancellation_pending: false,
          cancellation_response: data,
          cancellation_ticket: data?.codigo_de_baja || data?.ticket || null,
        },
      })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        ok: true,
        status: "cancelled",
        ticket: data?.codigo_de_baja || data?.ticket || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("pe-cancel-invoice error", err);
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
