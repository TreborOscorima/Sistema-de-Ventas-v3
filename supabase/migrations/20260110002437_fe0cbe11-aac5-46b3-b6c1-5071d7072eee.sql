-- Add night pricing columns to courts table
ALTER TABLE public.courts
ADD COLUMN night_price_per_hour NUMERIC DEFAULT NULL,
ADD COLUMN night_start_time TIME DEFAULT '20:00:00';

-- Comment for clarity
COMMENT ON COLUMN public.courts.night_price_per_hour IS 'Optional higher price for night hours. If null, regular price applies.';
COMMENT ON COLUMN public.courts.night_start_time IS 'Time when night pricing starts (default 20:00)';