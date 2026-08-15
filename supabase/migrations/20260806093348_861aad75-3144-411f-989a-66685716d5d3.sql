DROP POLICY IF EXISTS "Anyone can upload invitation photos" ON storage.objects;
CREATE POLICY "Anyone can upload invitation photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'hall-assets'
  AND (storage.foldername(name))[1] = 'invitations'
  AND lower(right(name, 5)) IN ('.jpeg')
     OR (bucket_id = 'hall-assets'
         AND (storage.foldername(name))[1] = 'invitations'
         AND lower(right(name, 4)) IN ('.jpg','.png','.web','webp'))
);