-- Add thermal paper size setting to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN thermal_paper_size text NOT NULL DEFAULT '80mm';

-- Add comment for documentation
COMMENT ON COLUMN public.business_settings.thermal_paper_size IS 'Thermal printer paper size: 58mm or 80mm';