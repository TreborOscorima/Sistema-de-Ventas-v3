import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import type { ElectronicInvoice } from "@/lib/fiscal";
import { DOCUMENT_TYPE_LABELS, IDENTITY_DOC_LABELS } from "@/lib/fiscal";
import { formatCurrency } from "@/lib/currency";
import {
  getThermalPrintStyles,
  generateReceiptHeader,
  generateReceiptFooter,
  type ThermalPaperSize,
} from "@/lib/thermal-print";
import type { BusinessSettings } from "@/lib/settings";

interface InvoiceItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  tax_rate: number;
}

// SUNAT (PE) tipo de comprobante codes for QR
const PE_DOC_CODE: Record<string, string> = {
  pe_factura: "01",
  pe_boleta: "03",
  pe_nota_credito: "07",
  pe_nota_debito: "08",
  pe_guia_remision: "09",
};

// AFIP (AR) tipo de comprobante codes
const AR_DOC_CODE: Record<string, number> = {
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

const AR_DOC_TYPE_REC: Record<string, number> = {
  ar_dni: 96,
  ar_cuit: 80,
  ar_cuil: 86,
  ar_pasaporte: 94,
  ar_cf: 99,
};

/**
 * Build the QR data string for a fiscal invoice.
 * - PE (SUNAT): pipe-separated string with RUC|tipo|serie|nro|IGV|total|fecha|tipoDocAdq|nroDocAdq|hash
 * - AR (AFIP): URL https://www.afip.gob.ar/fe/qr/?p=<base64(json)>
 */
export function buildFiscalQrData(
  invoice: ElectronicInvoice,
  issuerTaxId: string | null,
): string {
  if (invoice.qr_data) return invoice.qr_data;

  if (invoice.country === "PE") {
    const tipo = PE_DOC_CODE[invoice.document_type] || "00";
    const docTypeAdq = invoice.customer_doc_type === "pe_ruc" ? "6"
      : invoice.customer_doc_type === "pe_dni" ? "1"
      : invoice.customer_doc_type === "pe_ce" ? "4"
      : invoice.customer_doc_type === "pe_pasaporte" ? "7"
      : "0";
    return [
      issuerTaxId || "",
      tipo,
      invoice.series,
      invoice.number,
      invoice.tax_amount.toFixed(2),
      invoice.total.toFixed(2),
      invoice.issue_date,
      docTypeAdq,
      invoice.customer_doc_number || "-",
      invoice.hash || "",
    ].join("|");
  }

  // AR
  const cbteTipo = AR_DOC_CODE[invoice.document_type] || 0;
  const tipoDocRec = invoice.customer_doc_type
    ? AR_DOC_TYPE_REC[invoice.customer_doc_type] || 99
    : 99;
  const payload = {
    ver: 1,
    fecha: invoice.issue_date,
    cuit: Number((issuerTaxId || "0").replace(/\D/g, "")) || 0,
    ptoVta: Number(invoice.series) || 0,
    tipoCmp: cbteTipo,
    nroCmp: invoice.number,
    importe: Number(invoice.total.toFixed(2)),
    moneda: invoice.currency === "ARS" ? "PES" : invoice.currency,
    ctz: 1,
    tipoDocRec,
    nroDocRec: Number((invoice.customer_doc_number || "0").replace(/\D/g, "")) || 0,
    tipoCodAut: "E",
    codAut: Number(invoice.cae) || 0,
  };
  const b64 = btoa(JSON.stringify(payload));
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`;
}

async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { data, error } = await supabase
    .from("invoice_items")
    .select("id,product_name,quantity,unit_price,total,tax_rate")
    .eq("invoice_id", invoiceId);
  if (error) throw error;
  return (data || []) as InvoiceItem[];
}

function buildReceiptHtml(
  invoice: ElectronicInvoice,
  items: InvoiceItem[],
  qrDataUrl: string,
  qrRaw: string,
  settings: BusinessSettings | null,
): string {
  const docLabel = DOCUMENT_TYPE_LABELS[invoice.document_type];
  const docTypeLabel = invoice.customer_doc_type
    ? IDENTITY_DOC_LABELS[invoice.customer_doc_type]
    : "—";

  const itemsRows = items
    .map(
      (it) => `
        <tr>
          <td>${it.product_name}</td>
          <td class="center">${it.quantity}</td>
          <td class="right">${formatCurrency(it.unit_price, invoice.currency)}</td>
          <td class="right">${formatCurrency(it.total, invoice.currency)}</td>
        </tr>`,
    )
    .join("");

  const headerHtml = generateReceiptHeader(settings);
  const dateStr = new Date(invoice.issue_date).toLocaleDateString();
  const footerHtml = generateReceiptFooter(settings, dateStr);

  const fiscalLegend =
    invoice.country === "PE"
      ? "Representación impresa del comprobante electrónico - SUNAT"
      : "Comprobante autorizado AFIP";

  const authBlock =
    invoice.country === "AR" && invoice.cae
      ? `
        <div class="info-row"><span class="label">CAE:</span><span class="value">${invoice.cae}</span></div>
        ${invoice.cae_due_date ? `<div class="info-row"><span class="label">Vto. CAE:</span><span class="value">${new Date(invoice.cae_due_date).toLocaleDateString()}</span></div>` : ""}`
      : invoice.country === "PE" && invoice.hash
        ? `<div class="info-row"><span class="label">Hash:</span><span class="value" style="font-size:9px">${invoice.hash.slice(0, 24)}...</span></div>`
        : "";

  return `
    ${headerHtml}
    <hr class="separator-double" />
    <div class="section-title">${docLabel}</div>
    <div class="info-row"><span class="label">N°:</span><span class="value">${invoice.full_number}</span></div>
    <div class="info-row"><span class="label">Fecha:</span><span class="value">${dateStr}</span></div>
    <hr class="separator" />
    <div class="info-row"><span class="label">Cliente:</span><span class="value">${invoice.customer_legal_name || "—"}</span></div>
    <div class="info-row"><span class="label">${docTypeLabel}:</span><span class="value">${invoice.customer_doc_number || "—"}</span></div>
    ${invoice.customer_address ? `<div class="info-row"><span class="label">Dir.:</span><span class="value">${invoice.customer_address}</span></div>` : ""}
    <hr class="separator" />
    <table class="items-table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="center">Cant.</th>
          <th class="right">P.U.</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <hr class="separator" />
    <div class="totals-section">
      <div class="total-row subtotal"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
      <div class="total-row subtotal"><span>Impuesto (${invoice.tax_rate}%):</span><span>${formatCurrency(invoice.tax_amount, invoice.currency)}</span></div>
      <div class="total-row grand-total"><span>TOTAL:</span><span>${formatCurrency(invoice.total, invoice.currency)}</span></div>
    </div>
    <hr class="separator" />
    ${authBlock}
    <div class="qr-placeholder">
      <img src="${qrDataUrl}" alt="QR" style="width:140px;height:140px" />
      <div style="font-size:9px;color:#333;margin-top:4px;word-break:break-all">${invoice.country === "AR" ? qrRaw : ""}</div>
    </div>
    <div class="receipt-footer">
      <div class="message">${fiscalLegend}</div>
    </div>
    ${footerHtml}
  `;
}

export interface PrintFiscalOptions {
  invoice: ElectronicInvoice;
  issuerTaxId: string | null;
  settings: BusinessSettings | null;
  paperSize?: ThermalPaperSize;
}

export async function printFiscalReceipt(
  opts: PrintFiscalOptions,
): Promise<void> {
  const { invoice, issuerTaxId, settings } = opts;
  const paperSize: ThermalPaperSize =
    opts.paperSize ||
    ((settings as any)?.thermal_paper_size as ThermalPaperSize) ||
    "80mm";

  const items = await fetchInvoiceItems(invoice.id);
  const qrRaw = buildFiscalQrData(invoice, issuerTaxId);
  const qrDataUrl = await QRCode.toDataURL(qrRaw, {
    margin: 1,
    width: 280,
  });

  const bodyHtml = buildReceiptHtml(invoice, items, qrDataUrl, qrRaw, settings);
  const windowWidth = paperSize === "58mm" ? 280 : 320;
  const w = window.open("", "_blank", `width=${windowWidth},height=700`);
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${invoice.full_number}</title><style>${getThermalPrintStyles(paperSize)}</style></head><body><div class="thermal-receipt">${bodyHtml}</div></body></html>`);
  w.document.close();
  w.onload = () => {
    setTimeout(() => w.print(), 250);
  };
}
