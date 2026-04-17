-- ============================================
-- FASE 1: Facturación Electrónica - Estructura BD
-- ============================================

-- Enum para país fiscal
CREATE TYPE public.fiscal_country AS ENUM ('PE', 'AR');

-- Enum para modo (pruebas/producción)
CREATE TYPE public.fiscal_mode AS ENUM ('testing', 'production');

-- Enum para tipos de documento (PE + AR)
CREATE TYPE public.fiscal_document_type AS ENUM (
  -- Perú
  'pe_boleta',           -- Boleta de venta
  'pe_factura',          -- Factura
  'pe_nota_credito',     -- Nota de crédito
  'pe_nota_debito',      -- Nota de débito
  'pe_guia_remision',    -- Guía de remisión
  -- Argentina
  'ar_factura_a',        -- Factura A
  'ar_factura_b',        -- Factura B
  'ar_factura_c',        -- Factura C
  'ar_factura_e',        -- Factura E (exportación)
  'ar_nota_credito_a',
  'ar_nota_credito_b',
  'ar_nota_credito_c',
  'ar_nota_credito_e',
  'ar_nota_debito_a',
  'ar_nota_debito_b',
  'ar_nota_debito_c',
  'ar_nota_debito_e'
);

-- Enum estado del comprobante
CREATE TYPE public.invoice_status AS ENUM (
  'pending',     -- pendiente de envío al PSE/AFIP
  'processing',  -- en proceso
  'accepted',    -- aceptado (CAE/CDR recibido)
  'rejected',    -- rechazado por PSE/AFIP
  'cancelled',   -- anulado/baja comunicada
  'error'        -- error técnico (reintentable)
);

-- Enum tipo de documento de identidad receptor
CREATE TYPE public.identity_doc_type AS ENUM (
  -- Perú
  'pe_dni',      -- DNI
  'pe_ruc',      -- RUC
  'pe_ce',       -- Carnet de extranjería
  'pe_pasaporte',
  'pe_sin_doc',
  -- Argentina
  'ar_dni',
  'ar_cuit',
  'ar_cuil',
  'ar_pasaporte',
  'ar_cf'        -- Consumidor Final sin doc
);

-- Enum condición IVA (Argentina)
CREATE TYPE public.ar_iva_condition AS ENUM (
  'responsable_inscripto',
  'monotributo',
  'exento',
  'consumidor_final',
  'no_responsable',
  'no_categorizado'
);

-- ============================================
-- TABLA: fiscal_settings (configuración por empresa)
-- ============================================
CREATE TABLE public.fiscal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  country public.fiscal_country NOT NULL DEFAULT 'PE',
  mode public.fiscal_mode NOT NULL DEFAULT 'testing',
  enabled boolean NOT NULL DEFAULT false,
  -- Datos del emisor
  legal_name text,                    -- Razón social
  trade_name text,                    -- Nombre comercial
  tax_id text,                        -- RUC (PE) o CUIT (AR)
  fiscal_address text,
  ubigeo text,                        -- Ubigeo PE
  -- Argentina específico
  ar_iva_condition public.ar_iva_condition,
  ar_gross_income text,               -- Ingresos brutos
  ar_activity_start date,             -- Inicio de actividades
  ar_point_of_sale integer,           -- Punto de venta AFIP (ej: 1, 2, 3...)
  -- Perú específico
  pe_company_code text,               -- Código de establecimiento anexo SUNAT
  -- Configuración general
  default_currency text NOT NULL DEFAULT 'PEN',
  auto_send boolean NOT NULL DEFAULT true,    -- Envío automático al cerrar venta
  send_email_to_customer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fiscal_settings_company ON public.fiscal_settings(company_id);

ALTER TABLE public.fiscal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company fiscal settings"
ON public.fiscal_settings FOR SELECT TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Owners can insert fiscal settings"
ON public.fiscal_settings FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

CREATE POLICY "Owners can update fiscal settings"
ON public.fiscal_settings FOR UPDATE TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

CREATE POLICY "Owners can delete fiscal settings"
ON public.fiscal_settings FOR DELETE TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

-- ============================================
-- TABLA: document_series (series y correlativos)
-- ============================================
CREATE TABLE public.document_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  document_type public.fiscal_document_type NOT NULL,
  series text NOT NULL,                -- F001, B001, 0001, etc.
  current_number integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,  -- serie por defecto para este tipo
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document_type, series)
);

CREATE INDEX idx_document_series_company ON public.document_series(company_id);
CREATE INDEX idx_document_series_type ON public.document_series(company_id, document_type);

ALTER TABLE public.document_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company document series"
ON public.document_series FOR SELECT TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Owners can insert document series"
ON public.document_series FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

CREATE POLICY "Owners can update document series"
ON public.document_series FOR UPDATE TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

CREATE POLICY "Owners can delete document series"
ON public.document_series FOR DELETE TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

-- ============================================
-- TABLA: electronic_invoices (comprobantes emitidos)
-- ============================================
CREATE TABLE public.electronic_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  -- Identificación documento
  country public.fiscal_country NOT NULL,
  document_type public.fiscal_document_type NOT NULL,
  series text NOT NULL,
  number integer NOT NULL,
  full_number text GENERATED ALWAYS AS (series || '-' || lpad(number::text, 8, '0')) STORED,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Receptor
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_doc_type public.identity_doc_type,
  customer_doc_number text,
  customer_legal_name text,
  customer_address text,
  customer_email text,
  ar_customer_iva_condition public.ar_iva_condition,
  -- Montos
  currency text NOT NULL DEFAULT 'PEN',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  -- Estado y respuesta del PSE/AFIP
  status public.invoice_status NOT NULL DEFAULT 'pending',
  cae text,                            -- CAE Argentina
  cae_due_date date,                   -- Vencimiento CAE
  cdr_response jsonb,                  -- CDR Perú (Nubefact)
  qr_data text,                        -- Datos del QR
  pdf_url text,                        -- URL PDF generado
  xml_content text,                    -- XML emitido
  hash text,                           -- Hash del comprobante
  -- Manejo de errores
  error_message text,
  error_code text,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  -- Anulación
  cancelled_at timestamptz,
  cancellation_reason text,
  -- Notas de crédito/débito - referencia
  reference_invoice_id uuid REFERENCES public.electronic_invoices(id) ON DELETE SET NULL,
  -- Metadata adicional (items snapshot, datos de transporte para guía, etc.)
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document_type, series, number)
);

CREATE INDEX idx_electronic_invoices_company ON public.electronic_invoices(company_id);
CREATE INDEX idx_electronic_invoices_branch ON public.electronic_invoices(branch_id);
CREATE INDEX idx_electronic_invoices_sale ON public.electronic_invoices(sale_id);
CREATE INDEX idx_electronic_invoices_customer ON public.electronic_invoices(customer_id);
CREATE INDEX idx_electronic_invoices_status ON public.electronic_invoices(status);
CREATE INDEX idx_electronic_invoices_issue_date ON public.electronic_invoices(issue_date DESC);
CREATE INDEX idx_electronic_invoices_full_number ON public.electronic_invoices(full_number);

ALTER TABLE public.electronic_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company invoices"
ON public.electronic_invoices FOR SELECT TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Users can insert company invoices"
ON public.electronic_invoices FOR INSERT TO authenticated
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_id = auth.uid());

CREATE POLICY "Users can update company invoices"
ON public.electronic_invoices FOR UPDATE TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id));

-- No DELETE policy: integridad fiscal (audit memory rule)

-- ============================================
-- TABLA: invoice_items (snapshot de items)
-- ============================================
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.electronic_invoices(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  description text,
  unit_code text DEFAULT 'NIU',         -- NIU=unidad (PE), 7=unidades (AR)
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  unit_price numeric(12,4) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items of their company"
ON public.invoice_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.electronic_invoices ei
  WHERE ei.id = invoice_items.invoice_id
    AND user_belongs_to_company(auth.uid(), ei.company_id)
));

CREATE POLICY "Users can insert invoice items for their company"
ON public.invoice_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.electronic_invoices ei
  WHERE ei.id = invoice_items.invoice_id
    AND user_belongs_to_company(auth.uid(), ei.company_id)
));

-- ============================================
-- Extender customers con datos fiscales
-- ============================================
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS doc_type public.identity_doc_type,
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS ar_iva_condition public.ar_iva_condition,
  ADD COLUMN IF NOT EXISTS fiscal_email text;

CREATE INDEX IF NOT EXISTS idx_customers_doc_number ON public.customers(doc_number);

-- ============================================
-- Triggers updated_at
-- ============================================
CREATE TRIGGER update_fiscal_settings_updated_at
BEFORE UPDATE ON public.fiscal_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_series_updated_at
BEFORE UPDATE ON public.document_series
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_electronic_invoices_updated_at
BEFORE UPDATE ON public.electronic_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RPC: get_next_invoice_number (atomic)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  _company_id uuid,
  _document_type public.fiscal_document_type,
  _series text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next integer;
BEGIN
  IF NOT user_belongs_to_company(auth.uid(), _company_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.document_series
  SET current_number = current_number + 1,
      updated_at = now()
  WHERE company_id = _company_id
    AND document_type = _document_type
    AND series = _series
    AND is_active = true
  RETURNING current_number INTO _next;

  IF _next IS NULL THEN
    RAISE EXCEPTION 'Series not found or inactive: % %', _document_type, _series;
  END IF;

  RETURN _next;
END;
$$;