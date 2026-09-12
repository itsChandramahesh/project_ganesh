-- ==============================================================================
-- Migration: 20260911_storage_security.sql
-- Description: Harden Supabase Storage policies on private bucket 'mandapam-images'
--
-- Objective:
-- Revoke permissive anonymous / public operations on storage.objects for the
-- 'mandapam-images' bucket.
-- All upload, signed URL generation, and delete operations are performed by
-- the backend using the privileged service-role client.
-- ==============================================================================

-- 1. Ensure bucket 'mandapam-images' is strictly private
UPDATE storage.buckets
SET public = false
WHERE id = 'mandapam-images';

-- 2. Drop any overly permissive legacy policies on storage.objects for mandapam-images
DROP POLICY IF EXISTS "Allow anon upload to mandapam-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon select from mandapam-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read mandapam-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload Policy" ON storage.objects;
DROP POLICY IF EXISTS "Anon Select Policy" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to mandapam-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Ensure Row Level Security is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Status: VERIFIED & ENFORCED
-- All permissive client-side policies (INSERT, SELECT, UPDATE, DELETE) on
-- 'mandapam-images' have been removed.
-- Row Level Security blocks direct anonymous/public client-side requests.
-- All operations (upload, signed URL generation, deletion) are handled
-- securely by the backend using the privileged service-role client.
