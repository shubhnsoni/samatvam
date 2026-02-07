-- ============================================
-- SAMATVAM LIVING — Storage Bucket for Media
-- Run this AFTER 003_page_content_and_logo.sql
-- ============================================

-- Create a public storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to VIEW files (public bucket)
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Allow authenticated admins to UPLOAD files
CREATE POLICY "Admin upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow authenticated admins to UPDATE files
CREATE POLICY "Admin update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow authenticated admins to DELETE files
CREATE POLICY "Admin delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
