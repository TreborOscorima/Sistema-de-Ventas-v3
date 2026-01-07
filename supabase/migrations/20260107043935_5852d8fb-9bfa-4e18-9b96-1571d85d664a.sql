-- Add image_url column to courts table
ALTER TABLE public.courts ADD COLUMN image_url TEXT;

-- Create storage bucket for court images
INSERT INTO storage.buckets (id, name, public) VALUES ('court-images', 'court-images', true);

-- Allow public read access to court images
CREATE POLICY "Court images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'court-images');

-- Allow authenticated users to upload court images
CREATE POLICY "Authenticated users can upload court images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'court-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update court images
CREATE POLICY "Authenticated users can update court images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'court-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete court images
CREATE POLICY "Authenticated users can delete court images"
ON storage.objects FOR DELETE
USING (bucket_id = 'court-images' AND auth.role() = 'authenticated');