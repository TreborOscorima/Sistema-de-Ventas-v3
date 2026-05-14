import type { ElectronicInvoice, FiscalDocumentType, IdentityDocType } from "./fiscal";

// =====================================================================
// Catálogos SUNAT
// =====================================================================

// Catálogo 10 - Tipo de comprobante de pago
const PE_DOC_CODE: Partial<Record<FiscalDocumentType, string>> = {
  pe_factura: "01",
  pe_boleta: "03",
  pe_nota_credito: "07",
  pe_nota_debito: "08",
  pe_guia_remision: "09",
};

// Catálogo 6 - Tipo de documento de identidad
const PE_IDENT_CODE: Partial<Record<IdentityDocType, string>> = {
  pe_sin_doc: "0",
  pe_dni: "1",
  pe_ce: "4",
  pe_ruc: "6",
  pe_pasaporte: "7",
};

// =====================================================================
// Utilidades
// =====================================================================

function pad(value: string | number, len: number, char = "0"): string {
  return String(value).padStart(len, char);
}

function fmtDatePeriod(period: string): string {
  // period = 'YYYY-MM' -> 'YYYYMM00'
  return period.replace("-", "") + "00";
}

function fmtDateDDMMYYYY(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function num(value: number | null | undefined, decimals = 2): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
}

function sanitize(value: string | null | undefined): string {
  if (!value) return "";
  // Eliminar pipes, retornos y comas problemáticas
  return value.replace(/[|\r\n]/g, " ").trim();
}

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// =====================================================================
// SUNAT - Libro de Ventas e Ingresos (PLE 14.1)
// =====================================================================

export interface SunatLedgerOptions {
  /** Periodo en formato YYYY-MM */
  period: string;
  /** RUC de la empresa (11 dígitos) */
  ruc: string;
}

/**
 * Genera línea de Libro de Ventas según formato SUNAT PLE 14.1.
 * Devuelve string con líneas separadas por CRLF.
 */
export function generateSunatLedgerTxt(
  invoices: ElectronicInvoice[],
  opts: SunatLedgerOptions,
): string {
  const periodo = fmtDatePeriod(opts.period);
  const lines: string[] = [];

  invoices.forEach((inv, idx) => {
    const docCode = PE_DOC_CODE[inv.document_type];
    if (!docCode) return; // Solo PE

    const correlativo = pad(idx + 1, 8);
    const cuo = `M${pad(idx + 1, 9)}`;
    const fechaEmision = fmtDateDDMMYYYY(inv.issue_date);
    const docIdentCode = PE_IDENT_CODE[inv.customer_doc_type as IdentityDocType] ?? "0";
    const docIdentNum = sanitize(inv.customer_doc_number) || "00000000";
    const razonSocial = sanitize(inv.customer_legal_name) || "VARIOS - VENTAS MENORES";

    const baseGravada = num(inv.subtotal);
    const igv = num(inv.tax_amount);
    const total = num(inv.total);
    const moneda = inv.currency || "PEN";

    // Estado: 1 = válido, 2 = anulado
    const estado = inv.status === "cancelled" ? "2" : "1";

    const fields = [
      periodo,            // 1  Periodo
      cuo,                // 2  CUO
      correlativo,        // 3  Correlativo
      fechaEmision,       // 4  Fecha emisión
      "",                 // 5  Fecha vencimiento
      docCode,            // 6  Tipo comprobante
      sanitize(inv.series),     // 7  Serie
      String(inv.number),       // 8  Número
      "",                 // 9  Tipo comprobante en cobranza (no aplica)
      docIdentCode,       // 10 Tipo doc identidad
      docIdentNum,        // 11 Número doc identidad
      razonSocial,        // 12 Razón social
      "0.00",             // 13 Valor exportación
      baseGravada,        // 14 Base imponible gravada
      "0.00",             // 15 Descuento BI
      igv,                // 16 IGV
      "0.00",             // 17 Descuento IGV
      "0.00",             // 18 Op. gravada IVAP
      "0.00",             // 19 IVAP
      "0.00",             // 20 Op. exonerada
      "0.00",             // 21 Op. inafecta
      "0.00",             // 22 ISC
      "0.00",             // 23 Base ICBPER
      "0.00",             // 24 ICBPER
      "0.00",             // 25 Otros tributos
      total,              // 26 Total comprobante
      moneda,             // 27 Moneda
      "1.000",            // 28 Tipo cambio
      "",                 // 29 Fecha doc ref
      "",                 // 30 Tipo doc ref
      "",                 // 31 Serie doc ref
      "",                 // 32 Número doc ref
      estado,             // 33 Estado
      "",                 // 34 Campo libre
    ];

    lines.push(fields.join("|") + "|");
  });

  return lines.join("\r\n") + (lines.length ? "\r\n" : "");
}

/**
 * Nombre estándar SUNAT: LE{RUC}{YYYYMM}{00}{14010000}{1}{1}{1}11.txt
 * 14 = código libro, 01 = formato, 0000 = oportunidad
 */
export function buildSunatFilename(ruc: string, period: string): string {
  const yyyymm = period.replace("-", "");
  return `LE${ruc}${yyyymm}00140100001111.txt`;
}

// =====================================================================
// AFIP - "Mis Comprobantes" CSV
// =====================================================================

export interface AfipExportOptions {
  /** CUIT del emisor (sólo para nombre del archivo) */
  cuit?: string;
  /** Periodo YYYY-MM */
  period: string;
}

const AR_DOC_LABEL: Partial<Record<FiscalDocumentType, string>> = {
  ar_factura_a: "Factura A",
  ar_factura_b: "Factura B",
  ar_factura_c: "Factura C",
  ar_factura_e: "Factura E",
  ar_nota_credito_a: "N. Crédito A",
  ar_nota_credito_b: "N. Crédito B",
  ar_nota_credito_c: "N. Crédito C",
  ar_nota_credito_e: "N. Crédito E",
  ar_nota_debito_a: "N. Débito A",
  ar_nota_debito_b: "N. Débito B",
  ar_nota_debito_c: "N. Débito C",
  ar_nota_debito_e: "N. Débito E",
};

const AR_IDENT_LABEL: Partial<Record<IdentityDocType, string>> = {
  ar_dni: "DNI",
  ar_cuit: "CUIT",
  ar_cuil: "CUIL",
  ar_pasaporte: "Pasaporte",
  ar_cf: "Otro",
};

/**
 * Exporta comprobantes argentinos al formato CSV similar a "Mis Comprobantes" de AFIP.
 */
export function generateAfipCsv(invoices: ElectronicInvoice[]): string {
  const headers = [
    "Fecha",
    "Tipo Comprobante",
    "Punto de Venta",
    "Número Desde",
    "Número Hasta",
    "Cód. Autorización",
    "Tipo Doc. Receptor",
    "Nro. Doc. Receptor",
    "Denominación Receptor",
    "Tipo Cambio",
    "Moneda",
    "Imp. Neto Gravado",
    "Imp. Neto No Gravado",
    "IVA",
    "Imp. Total",
    "Estado",
  ];

  const rows = invoices
    .filter((inv) => AR_DOC_LABEL[inv.document_type])
    .map((inv) => {
      const [pos = "", nro = ""] = (inv.full_number || "").split("-");
      return [
        fmtDateDDMMYYYY(inv.issue_date),
        AR_DOC_LABEL[inv.document_type] || inv.document_type,
        pos,
        nro,
        nro,
        inv.cae || "",
        AR_IDENT_LABEL[inv.customer_doc_type as IdentityDocType] || "",
        inv.customer_doc_number || "",
        inv.customer_legal_name || "Consumidor Final",
        "1.000",
        inv.currency || "ARS",
        num(inv.subtotal),
        "0.00",
        num(inv.tax_amount),
        num(inv.total),
        inv.status === "cancelled" ? "Anulado" : "Vigente",
      ].map(csvEscape).join(",");
    });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}

export function buildAfipFilename(period: string, cuit?: string): string {
  const base = cuit ? `MisComprobantes_${cuit}_${period}` : `MisComprobantes_${period}`;
  return `${base}.csv`;
}

// =====================================================================
// Resúmenes para UI
// =====================================================================

export interface FiscalSummary {
  count: number;
  accepted: number;
  cancelled: number;
  pending: number;
  rejected: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function summarize(invoices: ElectronicInvoice[]): FiscalSummary {
  const out: FiscalSummary = {
    count: invoices.length,
    accepted: 0,
    cancelled: 0,
    pending: 0,
    rejected: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
  };
  for (const inv of invoices) {
    if (inv.status === "accepted") out.accepted++;
    else if (inv.status === "cancelled") out.cancelled++;
    else if (inv.status === "rejected" || inv.status === "error") out.rejected++;
    else out.pending++;

    if (inv.status !== "cancelled") {
      out.subtotal += Number(inv.subtotal || 0);
      out.tax += Number(inv.tax_amount || 0);
      out.total += Number(inv.total || 0);
    }
  }
  return out;
}

// =====================================================================
// Descarga en navegador
// =====================================================================

export function downloadTextFile(content: string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
