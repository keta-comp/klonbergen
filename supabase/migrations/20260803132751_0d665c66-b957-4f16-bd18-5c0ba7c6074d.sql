GRANT EXECUTE ON FUNCTION public.storage_path_hall_id(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Guests can upload wedding photos to real halls" ON storage.objects;
DROP POLICY IF EXISTS "Signed in guests can upload wedding photos" ON storage.objects;

CREATE POLICY "Guests can upload wedding photos to real halls"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'hall-assets'
  AND (storage.foldername(name))[1] = 'weddings'
  AND public.storage_path_hall_id(name) IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = public.storage_path_hall_id(storage.objects.name))
);

CREATE POLICY "Signed in guests can upload wedding photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hall-assets'
  AND (storage.foldername(name))[1] = 'weddings'
  AND public.storage_path_hall_id(name) IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = public.storage_path_hall_id(storage.objects.name))
);