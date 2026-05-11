// Edge Function: ar-cancel-invoice
// AFIP no permite "anular" un comprobante autorizado (con CAE).
// La forma legal de anular es emitir una Nota de Crédito por el total.
// Esta función registra la solicitud de anulación en metadata y, si las
// credenciales AFIP no están configuradas, deja el comprobante listo
// para que el usuario emita la NC correspondiente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CancelPayload {
  invoice_id: string;
  reason: string;
  // Si true, marca el comprobante como cancelled localmente sin esperar NC.
  force?: boolean;
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

    const { invoice_id, reason, force } = (await req.json()) as CancelPayload;
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

    if (invoice.country !== "AR") {
      return new Response(
        JSON.stringify({ error: "Comprobante no pertenece a Argentina" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const nowIso = new Date().toISOString();
    const baseMeta = (invoice.metadata as Record<string, unknown>) || {};

    const AFIP_CERT = Deno.env.get("AFIP_CERT");
    const AFIP_KEY = Deno.env.get("AFIP_KEY");
    const AFIP_CUIT = Deno.env.get("AFIP_CUIT");

    const credsReady = !!(AFIP_CERT && AFIP_KEY && AFIP_CUIT);

    // En AR la anulación se materializa con una NC. Aquí registramos la
    // intención. Si force=true (autorizado por usuario), marcamos como
    // cancelled localmente para reflejar el estado contable.
    const updates: Record<string, unknown> = {
      cancellation_reason: reason,
      metadata: {
        ...baseMeta,
        cancellation_pending: !force,
        cancellation_requested_at: nowIso,
        cancellation_requested_by: user.id,
        cancellation_method: "credit_note_required",
        afip_credentials_ready: credsReady,
      },
    };

    if (force) {
      updates.status = "cancelled";
      updates.cancelled_at = nowIso;
    }

    await supabase
      .from("electronic_invoices")
      .update(updates)
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        ok: true,
        status: force ? "cancelled" : invoice.status,
        pending: !force,
        message: force
          ? "Comprobante marcado como anulado. Recuerda emitir la Nota de Crédito correspondiente para AFIP."
          : "Solicitud registrada. En AFIP la anulación se realiza emitiendo una Nota de Crédito por el total del comprobante.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("ar-cancel-invoice error", err);
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
