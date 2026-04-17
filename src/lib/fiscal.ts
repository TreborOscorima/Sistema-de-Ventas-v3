import { supabase } from "@/integrations/supabase/client";

// ============================================
// Tipos
// ============================================

export type FiscalCountry = "PE" | "AR";
export type FiscalMode = "testing" | "production";

export type FiscalDocumentType =
  // Perú
  | "pe_boleta"
  | "pe_factura"
  | "pe_nota_credito"
  | "pe_nota_debito"
  | "pe_guia_remision"
  // Argentina
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

export type InvoiceStatus =
  | "pending"
  | "processing"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "error";

export type IdentityDocType =
  | "pe_dni"
  | "pe_ruc"
  | "pe_ce"
  | "pe_pasaporte"
  | "pe_sin_doc"
  | "ar_dni"
  | "ar_cuit"
  | "ar_cuil"
  | "ar_pasaporte"
  | "ar_cf";

export type ArIvaCondition =
  | "responsable_inscripto"
  | "monotributo"
  | "exento"
  | "consumidor_final"
  | "no_responsable"
  | "no_categorizado";

export interface FiscalSettings {
  id: string;
  company_id: string;
  country: FiscalCountry;
  mode: FiscalMode;
  enabled: boolean;
  legal_name: string | null;
  trade_name: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  ubigeo: string | null;
  ar_iva_condition: ArIvaCondition | null;
  ar_gross_income: string | null;
  ar_activity_start: string | null;
  ar_point_of_sale: number | null;
  pe_company_code: string | null;
  default_currency: string;
  auto_send: boolean;
  send_email_to_customer: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentSeries {
  id: string;
  company_id: string;
  branch_id: string | null;
  document_type: FiscalDocumentType;
  series: string;
  current_number: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ElectronicInvoice {
  id: string;
  company_id: string;
  branch_id: string | null;
  user_id: string;
  sale_id: string | null;
  country: FiscalCountry;
  document_type: FiscalDocumentType;
  series: string;
  number: number;
  full_number: string;
  issue_date: string;
  customer_id: string | null;
  customer_doc_type: IdentityDocType | null;
  customer_doc_number: string | null;
  customer_legal_name: string | null;
  customer_address: string | null;
  customer_email: string | null;
  ar_customer_iva_condition: ArIvaCondition | null;
  currency: string;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  total: number;
  status: InvoiceStatus;
  cae: string | null;
  cae_due_date: string | null;
  cdr_response: any;
  qr_data: string | null;
  pdf_url: string | null;
  xml_content: string | null;
  hash: string | null;
  error_message: string | null;
  error_code: string | null;
  attempts: number;
  last_attempt_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  reference_invoice_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// Catálogos / labels
// ============================================

export const DOCUMENT_TYPE_LABELS: Record<FiscalDocumentType, string> = {
  pe_boleta: "Boleta de Venta",
  pe_factura: "Factura",
  pe_nota_credito: "Nota de Crédito",
  pe_nota_debito: "Nota de Débito",
  pe_guia_remision: "Guía de Remisión",
  ar_factura_a: "Factura A",
  ar_factura_b: "Factura B",
  ar_factura_c: "Factura C",
  ar_factura_e: "Factura E (Exportación)",
  ar_nota_credito_a: "Nota de Crédito A",
  ar_nota_credito_b: "Nota de Crédito B",
  ar_nota_credito_c: "Nota de Crédito C",
  ar_nota_credito_e: "Nota de Crédito E",
  ar_nota_debito_a: "Nota de Débito A",
  ar_nota_debito_b: "Nota de Débito B",
  ar_nota_debito_c: "Nota de Débito C",
  ar_nota_debito_e: "Nota de Débito E",
};

export const PE_DOCUMENT_TYPES: FiscalDocumentType[] = [
  "pe_boleta",
  "pe_factura",
  "pe_nota_credito",
  "pe_nota_debito",
  "pe_guia_remision",
];

export const AR_DOCUMENT_TYPES: FiscalDocumentType[] = [
  "ar_factura_a",
  "ar_factura_b",
  "ar_factura_c",
  "ar_factura_e",
  "ar_nota_credito_a",
  "ar_nota_credito_b",
  "ar_nota_credito_c",
  "ar_nota_credito_e",
  "ar_nota_debito_a",
  "ar_nota_debito_b",
  "ar_nota_debito_c",
  "ar_nota_debito_e",
];

export const IDENTITY_DOC_LABELS: Record<IdentityDocType, string> = {
  pe_dni: "DNI",
  pe_ruc: "RUC",
  pe_ce: "Carnet de Extranjería",
  pe_pasaporte: "Pasaporte",
  pe_sin_doc: "Sin documento",
  ar_dni: "DNI",
  ar_cuit: "CUIT",
  ar_cuil: "CUIL",
  ar_pasaporte: "Pasaporte",
  ar_cf: "Consumidor Final",
};

export const AR_IVA_LABELS: Record<ArIvaCondition, string> = {
  responsable_inscripto: "Responsable Inscripto",
  monotributo: "Monotributo",
  exento: "Exento",
  consumidor_final: "Consumidor Final",
  no_responsable: "No Responsable",
  no_categorizado: "No Categorizado",
};

export const STATUS_LABELS: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  processing: { label: "Procesando", variant: "secondary" },
  accepted: { label: "Aceptado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
  cancelled: { label: "Anulado", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
};

// ============================================
// Validadores
// ============================================

/**
 * Valida RUC peruano (11 dígitos, inicia con 10, 15, 17, 20)
 */
export function validateRUC(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  const prefix = ruc.substring(0, 2);
  if (!["10", "15", "17", "20"].includes(prefix)) return false;
  // Dígito verificador
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(ruc[i]) * factors[i];
  }
  const check = 11 - (sum % 11);
  const digit = check === 10 ? 0 : check === 11 ? 1 : check;
  return digit === parseInt(ruc[10]);
}

/**
 * Valida DNI peruano (8 dígitos)
 */
export function validateDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

/**
 * Valida CUIT/CUIL argentino (11 dígitos con dígito verificador)
 */
export function validateCUIT(cuit: string): boolean {
  const clean = cuit.replace(/[-\s]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * factors[i];
  }
  const mod = sum % 11;
  const digit = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
  return digit === parseInt(clean[10]);
}

/**
 * Valida DNI argentino (7 u 8 dígitos)
 */
export function validateDNIAr(dni: string): boolean {
  return /^\d{7,8}$/.test(dni.replace(/[.\s]/g, ""));
}

export function validateIdentityDoc(type: IdentityDocType, value: string): boolean {
  if (!value) return false;
  switch (type) {
    case "pe_dni": return validateDNI(value);
    case "pe_ruc": return validateRUC(value);
    case "ar_cuit":
    case "ar_cuil": return validateCUIT(value);
    case "ar_dni": return validateDNIAr(value);
    case "pe_ce": return value.length >= 8 && value.length <= 12;
    case "pe_pasaporte":
    case "ar_pasaporte": return value.length >= 5;
    case "pe_sin_doc":
    case "ar_cf": return true;
    default: return false;
  }
}

// ============================================
// API
// ============================================

export async function getFiscalSettings(companyId: string): Promise<FiscalSettings | null> {
  const { data, error } = await supabase
    .from("fiscal_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  return data as FiscalSettings | null;
}

export async function upsertFiscalSettings(
  companyId: string,
  settings: Partial<Omit<FiscalSettings, "id" | "company_id" | "created_at" | "updated_at">>
): Promise<FiscalSettings> {
  const existing = await getFiscalSettings(companyId);
  if (existing) {
    const { data, error } = await supabase
      .from("fiscal_settings")
      .update(settings)
      .eq("company_id", companyId)
      .select()
      .single();
    if (error) throw error;
    return data as FiscalSettings;
  }
  const { data, error } = await supabase
    .from("fiscal_settings")
    .insert({ company_id: companyId, ...settings })
    .select()
    .single();
  if (error) throw error;
  return data as FiscalSettings;
}

export async function getDocumentSeries(companyId: string): Promise<DocumentSeries[]> {
  const { data, error } = await supabase
    .from("document_series")
    .select("*")
    .eq("company_id", companyId)
    .order("document_type")
    .order("series");
  if (error) throw error;
  return data as DocumentSeries[];
}

export async function createDocumentSeries(
  payload: Omit<DocumentSeries, "id" | "created_at" | "updated_at">
): Promise<DocumentSeries> {
  const { data, error } = await supabase
    .from("document_series")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentSeries;
}

export async function updateDocumentSeries(
  id: string,
  patch: Partial<Omit<DocumentSeries, "id" | "company_id" | "created_at" | "updated_at">>
): Promise<DocumentSeries> {
  const { data, error } = await supabase
    .from("document_series")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentSeries;
}

export async function deleteDocumentSeries(id: string): Promise<void> {
  const { error } = await supabase.from("document_series").delete().eq("id", id);
  if (error) throw error;
}
