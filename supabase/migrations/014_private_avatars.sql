-- Keep student portrait images private and serve them through /api/media.

UPDATE storage.buckets
SET public = false
WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatar Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Auth Upload Access" ON storage.objects;
CREATE POLICY "Avatar Auth Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Auth Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Delete Access" ON storage.objects;
