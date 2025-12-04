-- ============================================
-- Freshie Photo Storage Setup
-- ============================================
-- This script sets up the Supabase Storage bucket
-- and security policies for Freshie photos
-- ============================================

-- 1. Create the freshies storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('freshies', 'freshies', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add freshie_photo_url column to routine_steps table (if not exists)
ALTER TABLE routine_steps
ADD COLUMN IF NOT EXISTS freshie_photo_url TEXT;

-- 3. Set up storage policies for freshies bucket

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Users can upload their own freshies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own freshies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own freshies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own freshies" ON storage.objects;

-- Allow authenticated users to upload their own freshies
CREATE POLICY "Users can upload their own freshies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'freshies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own freshies
CREATE POLICY "Users can view their own freshies"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'freshies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own freshies
CREATE POLICY "Users can delete their own freshies"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'freshies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own freshies
CREATE POLICY "Users can update their own freshies"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'freshies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Verify setup
-- Check bucket exists
SELECT 
  id, 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE id = 'freshies';

-- Check policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%freshies%'
ORDER BY policyname;

-- ============================================
-- Setup Complete!
-- ============================================
-- File structure: freshies/{user_id}/{step_id}_{timestamp}.jpg
-- Example: freshies/550e8400-e29b-41d4-a716-446655440000/abc123_1700000000000.jpg
-- ============================================
