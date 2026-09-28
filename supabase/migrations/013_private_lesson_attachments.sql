-- Make lesson and technique media private. Apply after migration 011.
-- Existing public object URLs continue to work through /api/media, which issues
-- a short-lived signed URL only to authenticated users.

UPDATE storage.buckets
SET public = false
WHERE id = 'lesson-attachments';

DROP POLICY IF EXISTS "Anyone can view lesson attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view lesson attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view lesson attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-attachments');

DROP POLICY IF EXISTS "Authenticated users can upload lesson attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload lesson attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lesson-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can delete lesson attachments" ON storage.objects;
CREATE POLICY "Authenticated users can delete lesson attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'lesson-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
