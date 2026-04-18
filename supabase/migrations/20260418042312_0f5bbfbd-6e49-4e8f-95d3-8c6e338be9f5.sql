-- Triggers updated_at
DROP TRIGGER IF EXISTS update_electronic_invoices_updated_at ON public.electronic_invoices;
CREATE TRIGGER update_electronic_invoices_updated_at
  BEFORE UPDATE ON public.electronic_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fiscal_settings_updated_at ON public.fiscal_settings;
CREATE TRIGGER update_fiscal_settings_updated_at
  BEFORE UPDATE ON public.fiscal_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_series_updated_at ON public.document_series;
CREATE TRIGGER update_document_series_updated_at
  BEFORE UPDATE ON public.document_series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_electronic_invoices_company_status
  ON public.electronic_invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_electronic_invoices_issue_date
  ON public.electronic_invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_electronic_invoices_sale_id
  ON public.electronic_invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
  ON public.invoice_items(invoice_id);

-- Seeder de series por defecto
CREATE OR REPLACE FUNCTION public.seed_default_document_series(_company_id uuid, _country fiscal_country)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT user_belongs_to_company(auth.uid(), _company_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _country = 'PE' THEN
    INSERT INTO public.document_series (company_id, document_type, series, current_number, is_active, is_default)
    VALUES
      (_company_id, 'pe_boleta',        'B001', 0, true, true),
      (_company_id, 'pe_factura',       'F001', 0, true, true),
      (_company_id, 'pe_nota_credito',  'FC01', 0, true, true),
      (_company_id, 'pe_nota_debito',   'FD01', 0, true, true),
      (_company_id, 'pe_guia_remision', 'T001', 0, true, true)
    ON CONFLICT DO NOTHING;
  ELSIF _country = 'AR' THEN
    INSERT INTO public.document_series (company_id, document_type, series, current_number, is_active, is_default)
    VALUES
      (_company_id, 'ar_factura_a',       '00001', 0, true, true),
      (_company_id, 'ar_factura_b',       '00001', 0, true, true),
      (_company_id, 'ar_factura_c',       '00001', 0, true, true),
      (_company_id, 'ar_factura_e',       '00001', 0, true, true),
      (_company_id, 'ar_nota_credito_a',  '00001', 0, true, true),
      (_company_id, 'ar_nota_credito_b',  '00001', 0, true, true),
      (_company_id, 'ar_nota_credito_c',  '00001', 0, true, true),
      (_company_id, 'ar_nota_debito_a',   '00001', 0, true, true),
      (_company_id, 'ar_nota_debito_b',   '00001', 0, true, true),
      (_company_id, 'ar_nota_debito_c',   '00001', 0, true, true)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;