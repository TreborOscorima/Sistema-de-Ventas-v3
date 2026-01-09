-- Add opening and closing time columns to courts table
ALTER TABLE public.courts 
ADD COLUMN opening_time TIME NOT NULL DEFAULT '00:00:00',
ADD COLUMN closing_time TIME NOT NULL DEFAULT '23:59:00';

-- Add comment for documentation
COMMENT ON COLUMN public.courts.opening_time IS 'Court opening time';
COMMENT ON COLUMN public.courts.closing_time IS 'Court closing time';