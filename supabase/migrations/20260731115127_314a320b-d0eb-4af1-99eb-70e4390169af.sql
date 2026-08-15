
-- 1. Revoke direct EXECUTE on SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_hall_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_hall_admin(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- 2. profiles: only owner or super admin may read
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 3. rsvps: validated inserts only
DROP POLICY IF EXISTS "Anyone can send rsvp" ON public.rsvps;
CREATE POLICY "Guests can send validated rsvp"
  ON public.rsvps FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = hall_id)
    AND char_length(guest_name) BETWEEN 1 AND 100
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND (message IS NULL OR char_length(message) <= 1000)
    AND (table_number IS NULL OR char_length(table_number) <= 20)
    AND guests_count BETWEEN 1 AND 20
  );

-- 4. wedding_moments: validated inserts, guests cannot self-approve
DROP POLICY IF EXISTS "Anyone can upload moments" ON public.wedding_moments;
CREATE POLICY "Guests can upload validated moments"
  ON public.wedding_moments FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = hall_id)
    AND approved = true
    AND char_length(image_url) <= 1000
    AND (caption IS NULL OR char_length(caption) <= 500)
    AND (guest_name IS NULL OR char_length(guest_name) <= 100)
    AND (table_number IS NULL OR char_length(table_number) <= 20)
  );

-- 5. Storage: scope writes to hall admins, remove broad listing
CREATE OR REPLACE FUNCTION public.storage_path_hall_id(_name text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN (storage.foldername(_name))[1] = 'weddings'
      AND (storage.foldername(_name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN ((storage.foldername(_name))[2])::uuid
    WHEN (storage.foldername(_name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN ((storage.foldername(_name))[1])::uuid
    ELSE NULL
  END
$$;
REVOKE EXECUTE ON FUNCTION public.storage_path_hall_id(text) FROM anon, authenticated, public;

DROP POLICY IF EXISTS "Anyone can view hall assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hall assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update hall assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete hall assets" ON storage.objects;
DROP POLICY IF EXISTS "Guests can upload wedding photos" ON storage.objects;

CREATE POLICY "Hall admins can upload hall assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND public.storage_path_hall_id(name) IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'super_admin'::public.app_role)
      OR public.is_hall_admin(auth.uid(), public.storage_path_hall_id(name))
    )
  );

CREATE POLICY "Hall admins can update hall assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'hall-assets'
    AND public.storage_path_hall_id(name) IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'super_admin'::public.app_role)
      OR public.is_hall_admin(auth.uid(), public.storage_path_hall_id(name))
    )
  );

CREATE POLICY "Hall admins can delete hall assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'hall-assets'
    AND public.storage_path_hall_id(name) IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'super_admin'::public.app_role)
      OR public.is_hall_admin(auth.uid(), public.storage_path_hall_id(name))
    )
  );

CREATE POLICY "Guests can upload wedding photos to real halls"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'weddings'
    AND EXISTS (
      SELECT 1 FROM public.wedding_halls h
      WHERE h.id = public.storage_path_hall_id(name)
    )
  );
