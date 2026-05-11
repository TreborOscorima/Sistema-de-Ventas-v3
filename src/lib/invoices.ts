import { supabase } from "@/integrations/supabase/client";
import type {
  ElectronicInvoice,
  FiscalDocumentType,
  IdentityDocType,
  InvoiceStatus,
} from "@/lib/fiscal";

export interface EmitInvoiceInput {
  company_id: string;
  branch_id?: string | null;
  sale_id?: string | null;
  document_type: FiscalDocumentType;
  series: string;
  customer: {
    id?: string | null;
    doc_type: IdentityDocType;
    doc_number: string;
    legal_name: string;
    address?: string;
    email?: string;
  };
  currency?: string;
  items: Array<{
    product_id?: string | null;
    product_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    unit_code?: string;
    discount?: number;
  }>;
  observations?: string;
  metadata?: Record<string, unknown>;
  reference_invoice_id?: string | null;
  note_type_code?: number;
  note_reason?: string;
}

export interface EmitInvoiceResult {
  ok: boolean;
  invoice_id: string;
  full_number?: string;
  status?: InvoiceStatus;
  pdf_url?: string;
  message?: string;
  error?: unknown;
}

export async function emitInvoice(
  input: EmitInvoiceInput,
): Promise<EmitInvoiceResult> {
  const isPE = input.document_type.startsWith("pe_");
  const fnName = isPE ? "pe-emit-invoice" : "ar-emit-invoice";

  const { data, error } = await supabase.functions.invoke(fnName, {
    body: input,
  });
  if (error) {
    throw new Error(error.message || "Error invocando función fiscal");
  }
  return data as EmitInvoiceResult;
}

export interface InvoiceListFilters {
  status?: InvoiceStatus;
  document_type?: FiscalDocumentType;
  from?: string; // ISO date
  to?: string;
  search?: string;
}

export async function listInvoices(
  companyId: string,
  filters: InvoiceListFilters = {},
  limit = 100,
): Promise<ElectronicInvoice[]> {
  let q = supabase
    .from("electronic_invoices")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status) q = q.eq("status", filters.status);
  if (filters.document_type) q = q.eq("document_type", filters.document_type);
  if (filters.from) q = q.gte("issue_date", filters.from);
  if (filters.to) q = q.lte("issue_date", filters.to);
  if (filters.search) {
    q = q.or(
      `full_number.ilike.%${filters.search}%,customer_legal_name.ilike.%${filters.search}%,customer_doc_number.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as ElectronicInvoice[];
}

export async function getInvoiceById(
  id: string,
): Promise<ElectronicInvoice | null> {
  const { data, error } = await supabase
    .from("electronic_invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ElectronicInvoice | null;
}

export interface CancelInvoiceResult {
  ok: boolean;
  status?: string;
  pending?: boolean;
  message?: string;
  ticket?: string | null;
  error?: unknown;
}

export async function cancelInvoice(
  id: string,
  reason: string,
  opts: { force?: boolean } = {},
): Promise<CancelInvoiceResult> {
  // Detectar país a partir del comprobante
  const inv = await getInvoiceById(id);
  if (!inv) throw new Error("Comprobante no encontrado");

  const fnName = inv.country === "PE" ? "pe-cancel-invoice" : "ar-cancel-invoice";
  const { data, error } = await supabase.functions.invoke(fnName, {
    body: { invoice_id: id, reason, force: opts.force ?? false },
  });
  if (error) throw new Error(error.message || "Error al anular comprobante");
  return data as CancelInvoiceResult;
}

export async function seedDefaultSeries(
  companyId: string,
  country: "PE" | "AR",
): Promise<void> {
  const { error } = await supabase.rpc("seed_default_document_series", {
    _company_id: companyId,
    _country: country,
  });
  if (error) throw error;
}
