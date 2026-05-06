// Edge Function: ar-emit-invoice
// Emite un comprobante electrónico en Argentina (AFIP / WSFE).
// Esta es la estructura base SIN credenciales reales.
// Si los secrets AFIP_CERT, AFIP_KEY o AFIP_CUIT no están configurados,
// la factura se guarda en estado "pending" con un mensaje claro.
// Cuando se agreguen las credenciales se completará el handshake WSAA + WSFE.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ArDocType =
  | "ar_factura_a"
  | "ar_factura_b"
  | "ar_factura_c"
  | "ar_factura_e"
  | "ar_nota_credito_a"
  | "ar_nota_credito_b"
  | "ar_nota_credito_c"
  | "ar_nota_credito_e"
  | "ar_nota_debito_a"
  | "ar_nota_debito_b"
  | "ar_nota_debito_c"
  | "ar_nota_debito_e";

type ArCustomerDoc =
  | "ar_dni"
  | "ar_cuit"
  | "ar_cuil"
  | "ar_pasaporte"
  | "ar_cf";

type ArIvaCondition =
  | "responsable_inscripto"
  | "monotributo"
  | "exento"
  | "consumidor_final"
  | "no_responsable"
  | "no_categorizado";

interface InvoiceItemPayload {
  product_id?: string | null;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number; // 21, 10.5, 0 (IVA AR)
  unit_code?: string;
  discount?: number;
}

interface EmitPayload {
  company_id: string;
  branch_id?: string | null;
  sale_id?: string | null;
  document_type: ArDocType;
  series: string; // punto de venta (ej. "00001")
  customer: {
    id?: string | null;
    doc_type: ArCustomerDoc;
    doc_number: string;
    legal_name: string;
    address?: string;
    email?: string;
    iva_condition?: ArIvaCondition;
  };
  currency?: string;
  items: InvoiceItemPayload[];
  observations?: string;
  metadata?: Record<string, unknown>;
  reference_invoice_id?: string | null;
  note_reason?: string;
}

// AFIP CbteTipo (códigos oficiales WSFE)
const AFIP_CBTE_TIPO: Record<ArDocType, number> = {
  ar_factura_a: 1,
  ar_factura_b: 6,
  ar_factura_c: 11,
  ar_factura_e: 19,
  ar_nota_credito_a: 3,
  ar_nota_credito_b: 8,
  ar_nota_credito_c: 13,
  ar_nota_credito_e: 21,
  ar_nota_debito_a: 2,
  ar_nota_debito_b: 7,
  ar_nota_debito_c: 12,
  ar_nota_debito_e: 20,
};

// AFIP DocTipo
const AFIP_DOC_TIPO: Record<ArCustomerDoc, number> = {
  ar_cuit: 80,
  ar_cuil: 86,
  ar_dni: 96,
  ar_pasaporte: 94,
  ar_cf: 99, // Consumidor Final sin identificar
};

function totals(items: InvoiceItemPayload[]) {
  let subtotal = 0;
  let taxAmount = 0;
  for (const it of items) {
    const lineSubtotal = it.quantity * it.unit_price - (it.discount || 0);
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

function validateForDocType(payload: EmitPayload): string | null {
  const dt = payload.document_type;
  // Factura A requiere CUIT del receptor
  if (
    (dt === "ar_factura_a" ||
      dt === "ar_nota_credito_a" ||
      dt === "ar_nota_debito_a") &&
    payload.customer.doc_type !== "ar_cuit"
  ) {
    return "Factura/NC/ND tipo A requiere cliente con CUIT";
  }
  // Factura E requiere CUIT (exportación)
  if (
    (dt === "ar_factura_e" ||
      dt === "ar_nota_credito_e" ||
      dt === "ar_nota_debito_e") &&
    payload.customer.doc_type !== "ar_cuit"
  ) {
    return "Factura E (exportación) requiere CUIT";
  }
  return null;
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

    if (
      !payload.company_id ||
      !payload.document_type ||
      !payload.series ||
      !payload.customer ||
      !payload.items?.length
    ) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationErr = validateForDocType(payload);
    if (validationErr) {
      return new Response(JSON.stringify({ error: validationErr }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const t = totals(payload.items);
    const taxRate = payload.items[0]?.tax_rate ?? 21;
    const currency = payload.currency || "ARS";

    // Reservar correlativo
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

    const fullNumber = `${payload.series}-${String(nextNumber).padStart(8, "0")}`;

    // Resolver referencia para NC/ND
    const isNote = payload.document_type.startsWith("ar_nota_");
    let referenceInvoice: any = null;
    if (isNote) {
      if (!payload.reference_invoice_id) {
        return new Response(
          JSON.stringify({ error: "Las notas requieren reference_invoice_id" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const { data: ref } = await supabase
        .from("electronic_invoices")
        .select("*")
        .eq("id", payload.reference_invoice_id)
        .maybeSingle();
      if (!ref) {
        return new Response(
          JSON.stringify({ error: "Comprobante referenciado no encontrado" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      referenceInvoice = ref;
    }

    const { data: invoice, error: insErr } = await supabase
      .from("electronic_invoices")
      .insert({
        company_id: payload.company_id,
        branch_id: payload.branch_id ?? null,
        user_id: user.id,
        sale_id: payload.sale_id ?? null,
        country: "AR",
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
        ar_customer_iva_condition: payload.customer.iva_condition ?? null,
        currency,
        subtotal: t.subtotal,
        tax_amount: t.taxAmount,
        tax_rate: taxRate,
        total: t.total,
        status: "processing",
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        reference_invoice_id: payload.reference_invoice_id ?? null,
        metadata: {
          ...(payload.metadata ?? {}),
          afip_cbte_tipo: AFIP_CBTE_TIPO[payload.document_type],
          afip_doc_tipo: AFIP_DOC_TIPO[payload.customer.doc_type],
          ...(isNote
            ? {
                note_reason: payload.note_reason ?? "",
                ref_full_number: referenceInvoice?.full_number,
                ref_document_type: referenceInvoice?.document_type,
                ref_afip_cbte_tipo:
                  AFIP_CBTE_TIPO[
                    referenceInvoice?.document_type as ArDocType
                  ],
              }
            : {}),
        },
      })
      .select()
      .single();

    if (insErr || !invoice) {
      return new Response(
        JSON.stringify({
          error: insErr?.message || "Error al crear factura",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await supabase.from("invoice_items").insert(
      payload.items.map((it) => {
        const lineSubtotal =
          it.quantity * it.unit_price - (it.discount || 0);
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
          unit_code: it.unit_code || "07", // 07 = unidad (AFIP)
          subtotal: Number(lineNet.toFixed(2)),
          tax_amount: Number(lineTax.toFixed(2)),
          total: Number(lineSubtotal.toFixed(2)),
        };
      }),
    );

    const AFIP_CERT = Deno.env.get("AFIP_CERT");
    const AFIP_KEY = Deno.env.get("AFIP_KEY");
    const AFIP_CUIT = Deno.env.get("AFIP_CUIT");

    // Sin credenciales -> dejamos pending
    if (!AFIP_CERT || !AFIP_KEY || !AFIP_CUIT) {
      await supabase
        .from("electronic_invoices")
        .update({
          status: "pending",
          error_code: "MISSING_CREDENTIALS",
          error_message:
            "Credenciales AFIP no configuradas (AFIP_CERT, AFIP_KEY, AFIP_CUIT). El comprobante se reservó con correlativo pero no se envió a AFIP.",
        })
        .eq("id", invoice.id);

      return new Response(
        JSON.stringify({
          ok: true,
          invoice_id: invoice.id,
          full_number: fullNumber,
          status: "pending",
          message:
            "Comprobante reservado. Configura AFIP_CERT, AFIP_KEY y AFIP_CUIT para enviar a AFIP (WSFE).",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // TODO Fase 4: Implementar handshake WSAA (Token+Sign) y FECAESolicitar (WSFE)
    // 1) Solicitar TA en https://wsaahomo.afip.gov.ar/ws/services/LoginCms (testing)
    //    o https://wsaa.afip.gov.ar/ws/services/LoginCms (producción)
    //    firmando un TRA con AFIP_CERT + AFIP_KEY (CMS PKCS#7).
    // 2) Llamar FECAESolicitar de WSFE (homo: https://wswhomo.afip.gov.ar/wsfev1/service.asmx)
    //    con CbteTipo, PtoVta=series, Concepto, DocTipo, DocNro, totales e IVA.
    // 3) Persistir CAE, CAE_Vencimiento, observaciones; status -> accepted.
    await supabase
      .from("electronic_invoices")
      .update({
        status: "pending",
        error_code: "NOT_IMPLEMENTED",
        error_message:
          "Integración WSFE pendiente. Las credenciales están presentes pero el handshake aún no está implementado (Fase 4).",
      })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        ok: true,
        invoice_id: invoice.id,
        full_number: fullNumber,
        status: "pending",
        message:
          "Comprobante reservado. La integración con WSFE se completará en la próxima fase.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("ar-emit-invoice error", err);
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
