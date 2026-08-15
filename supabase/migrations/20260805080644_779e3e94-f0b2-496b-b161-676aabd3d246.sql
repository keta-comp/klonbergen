CREATE POLICY "Anyone can upload free invitation photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'invitations'
    AND coalesce(array_length(storage.foldername(name), 1), 0) = 2
  );