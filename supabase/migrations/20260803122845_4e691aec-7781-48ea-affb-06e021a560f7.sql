-- 1. Fix storage upload path validation
DROP POLICY IF EXISTS "Guests can upload wedding photos to real halls" ON storage.objects;
DROP POLICY IF EXISTS "Signed in guests can upload wedding photos" ON storage.objects;

CREATE POLICY "Guests can upload wedding photos to real halls"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'hall-assets'
  AND (storage.foldername(name))[1] = 'weddings'
  AND public.storage_path_hall_id(name) IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = public.storage_path_hall_id(name))
);

CREATE POLICY "Signed in guests can upload wedding photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hall-assets'
  AND (storage.foldername(name))[1] = 'weddings'
  AND public.storage_path_hall_id(name) IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = public.storage_path_hall_id(name))
);

-- 2. Harden SECURITY DEFINER helpers: they may only answer about the caller
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END
$function$;

CREATE OR REPLACE FUNCTION public.is_hall_admin(_user_id uuid, _hall_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.hall_admins WHERE user_id = _user_id AND hall_id = _hall_id)
  END
$function$;

CREATE OR REPLACE FUNCTION public.get_user_hall_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN NULL
    ELSE (SELECT hall_id FROM public.hall_admins WHERE user_id = _user_id LIMIT 1)
  END
$function$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_hall_admin(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_hall_id(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_hall_admin(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_hall_id(uuid) TO authenticated, service_role;