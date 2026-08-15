
CREATE POLICY "Signed in guests can upload wedding photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'weddings'
    AND EXISTS (
      SELECT 1 FROM public.wedding_halls h
      WHERE h.id = public.storage_path_hall_id(name)
    )
  );
