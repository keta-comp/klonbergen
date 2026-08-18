-- ============================================================================
-- Vowly - COMPLETE schema for a FRESH Supabase project (migrations only)
-- All 25 migrations concatenated in chronological order.
-- This already includes the billing schema, ALL RPCs
-- (confirm_subscription_payment, sync_subscription_notifications, seed_default_plans,
-- has_role, is_super_admin, today_in_tashkent, subscription_days_remaining),
-- the wedding_halls extensions, and seeds the SINGLE 299 000 UZS 'venue' plan.
-- Idempotent where it matters; run ONCE on a brand-new project.
-- ============================================================================


-- ===================== migration: 20260407124436_4e1be028-1311-49aa-82cc-2b9ce4051e6d.sql =====================

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('super_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Wedding halls table
CREATE TABLE public.wedding_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.wedding_halls ENABLE ROW LEVEL SECURITY;

-- Hall admins table
CREATE TABLE public.hall_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID REFERENCES public.wedding_halls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE public.hall_admins ENABLE ROW LEVEL SECURITY;

-- Food items table
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID REFERENCES public.wedding_halls(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  description TEXT,
  image_url TEXT,
  is_today BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Artists table
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID REFERENCES public.wedding_halls(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  performance_time TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Bride & Groom table
CREATE TABLE public.bride_groom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID REFERENCES public.wedding_halls(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  bride_photo TEXT,
  groom_photo TEXT,
  love_story TEXT,
  wedding_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.bride_groom ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin of a hall
CREATE OR REPLACE FUNCTION public.get_user_hall_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hall_id FROM public.hall_admins WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Super admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());

-- RLS Policies for wedding_halls
CREATE POLICY "Anyone can view halls" ON public.wedding_halls
  FOR SELECT USING (true);
CREATE POLICY "Super admins can insert halls" ON public.wedding_halls
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update halls" ON public.wedding_halls
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete halls" ON public.wedding_halls
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for hall_admins
CREATE POLICY "Super admins can view all admins" ON public.hall_admins
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());
CREATE POLICY "Super admins can insert admins" ON public.hall_admins
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update admins" ON public.hall_admins
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete admins" ON public.hall_admins
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for food_items
CREATE POLICY "Anyone can view food" ON public.food_items
  FOR SELECT USING (true);
CREATE POLICY "Hall admins can insert food" ON public.food_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can update food" ON public.food_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can delete food" ON public.food_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));

-- RLS Policies for artists
CREATE POLICY "Anyone can view artists" ON public.artists
  FOR SELECT USING (true);
CREATE POLICY "Hall admins can insert artists" ON public.artists
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can update artists" ON public.artists
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can delete artists" ON public.artists
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));

-- RLS Policies for bride_groom
CREATE POLICY "Anyone can view bride_groom" ON public.bride_groom
  FOR SELECT USING (true);
CREATE POLICY "Hall admins can insert bride_groom" ON public.bride_groom
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can update bride_groom" ON public.bride_groom
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can delete bride_groom" ON public.bride_groom
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR hall_id = public.get_user_hall_id(auth.uid()));


-- ===================== migration: 20260408144547_42d6d04d-32b6-4fbb-9e2d-aa29f18d415a.sql =====================

-- Profiles table for tracking all registered users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Banners table
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES public.wedding_halls(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Hall admins can insert banners" ON public.banners FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can update banners" ON public.banners FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can delete banners" ON public.banners FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));


-- ===================== migration: 20260408144620_c01a3f73-36c8-42b6-aead-f06094296082.sql =====================

INSERT INTO storage.buckets (id, name, public) VALUES ('hall-assets', 'hall-assets', true);

CREATE POLICY "Anyone can view hall assets" ON storage.objects FOR SELECT USING (bucket_id = 'hall-assets');
CREATE POLICY "Authenticated users can upload hall assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hall-assets');
CREATE POLICY "Authenticated users can update hall assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hall-assets');
CREATE POLICY "Authenticated users can delete hall assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hall-assets');


-- ===================== migration: 20260615191337_2b789f55-05cc-4a28-99f5-6314a0b7bcfa.sql =====================

GRANT SELECT ON public.wedding_halls TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.wedding_halls TO authenticated;
GRANT ALL ON public.wedding_halls TO service_role;

GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

GRANT SELECT ON public.bride_groom TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bride_groom TO authenticated;
GRANT ALL ON public.bride_groom TO service_role;

GRANT SELECT ON public.food_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.food_items TO authenticated;
GRANT ALL ON public.food_items TO service_role;

GRANT SELECT ON public.artists TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT ALL ON public.artists TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hall_admins TO authenticated;
GRANT ALL ON public.hall_admins TO service_role;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;


-- ===================== migration: 20260730150410_ffe0d268-f3eb-4c9e-9902-0901a153cd6c.sql =====================

create or replace function public.is_hall_admin(_user_id uuid, _hall_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hall_admins where user_id = _user_id and hall_id = _hall_id)
$$;

create table public.wedding_moments (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  image_url text not null,
  storage_path text,
  guest_name text,
  table_number text,
  caption text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert on public.wedding_moments to anon;
grant select, insert, update, delete on public.wedding_moments to authenticated;
grant all on public.wedding_moments to service_role;
alter table public.wedding_moments enable row level security;

create policy "Anyone can view approved moments" on public.wedding_moments
for select to anon, authenticated using (approved = true);
create policy "Admins can view all moments" on public.wedding_moments
for select to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));
create policy "Anyone can upload moments" on public.wedding_moments
for insert to anon, authenticated with check (true);
create policy "Admins can update moments" on public.wedding_moments
for update to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));
create policy "Admins can delete moments" on public.wedding_moments
for delete to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  guest_name text not null,
  phone text,
  guests_count integer not null default 1,
  attending boolean not null default true,
  message text,
  table_number text,
  created_at timestamptz not null default now()
);
grant insert on public.rsvps to anon;
grant select, insert, update, delete on public.rsvps to authenticated;
grant all on public.rsvps to service_role;
alter table public.rsvps enable row level security;

create policy "Anyone can send rsvp" on public.rsvps
for insert to anon, authenticated with check (true);
create policy "Admins can view rsvps" on public.rsvps
for select to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));
create policy "Admins can delete rsvps" on public.rsvps
for delete to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));

alter table public.wedding_moments replica identity full;
alter publication supabase_realtime add table public.wedding_moments;

create policy "Guests can upload wedding photos" on storage.objects
for insert to anon with check (bucket_id = 'hall-assets' and (storage.foldername(name))[1] = 'weddings');


-- ===================== migration: 20260731115127_314a320b-d0eb-4af1-99eb-70e4390169af.sql =====================

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


-- ===================== migration: 20260731115205_d82813ac-29d8-404a-85fe-d7dea8093d6e.sql =====================

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


-- ===================== migration: 20260801044116_86bfc6ea-8ae5-491f-8890-1f1f0849d91f.sql =====================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hall_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_hall_id(uuid) TO authenticated;


-- ===================== migration: 20260801044535_7377d053-cc77-47fe-b989-b4bf1a245f6d.sql =====================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

UPDATE public.profiles SET approved = true, approved_at = now() WHERE approved = false;

-- prevent self-approval: users may update their own profile but not the approval flag
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND approved = (SELECT p.approved FROM public.profiles p WHERE p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;
CREATE POLICY "Super admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));


-- ===================== migration: 20260803122845_4e691aec-7781-48ea-affb-06e021a560f7.sql =====================

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


-- ===================== migration: 20260803132751_0d665c66-b957-4f16-bd18-5c0ba7c6074d.sql =====================

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


-- ===================== migration: 20260804062410_2b2877a1-c896-4ea2-bc29-fde4fe06b69d.sql =====================

CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid NOT NULL REFERENCES public.wedding_halls(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  start_time time NOT NULL,
  end_time time,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.timeline_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timeline events" ON public.timeline_events FOR SELECT USING (true);
CREATE POLICY "Hall admins can insert timeline events" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can update timeline events" ON public.timeline_events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can delete timeline events" ON public.timeline_events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));

CREATE INDEX timeline_events_hall_idx ON public.timeline_events(hall_id, start_time);


-- ===================== migration: 20260805080604_89d24d12-05d4-4a1c-8d83-4614474f5df3.sql =====================

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  bride_name text NOT NULL,
  groom_name text NOT NULL,
  wedding_date date NOT NULL,
  wedding_time time NOT NULL,
  hall_name text NOT NULL,
  address text,
  photos text[] NOT NULL DEFAULT '{}',
  template text NOT NULL DEFAULT 'luxury',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invitations_slug_idx ON public.invitations (slug);

GRANT SELECT, INSERT ON public.invitations TO anon;
GRANT SELECT, INSERT ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invitations"
  ON public.invitations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create validated invitations"
  ON public.invitations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(slug) BETWEEN 6 AND 60
    AND char_length(bride_name) BETWEEN 1 AND 60
    AND char_length(groom_name) BETWEEN 1 AND 60
    AND char_length(hall_name) BETWEEN 1 AND 120
    AND (address IS NULL OR char_length(address) <= 300)
    AND template IN ('luxury','minimal','classic','royal','modern')
    AND array_length(photos, 1) IS NOT DISTINCT FROM array_length(photos, 1)
    AND coalesce(array_length(photos, 1), 0) <= 5
    AND views = 0
  );

CREATE POLICY "Super admins can update invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete invitations"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ===================== migration: 20260805080644_779e3e94-f0b2-496b-b161-676aabd3d246.sql =====================

CREATE POLICY "Anyone can upload free invitation photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'invitations'
    AND coalesce(array_length(storage.foldername(name), 1), 0) = 2
  );


-- ===================== migration: 20260806093348_861aad75-3144-411f-989a-66685716d5d3.sql =====================

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


-- ===================== migration: 20260815000000_taklifnoma_editorial_fields.sql =====================

-- Adds optional editorial fields to the invitations table for the new
-- premium taklifnoma builder. Existing rows are unaffected.
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS welcome_text text NULL,
  ADD COLUMN IF NOT EXISTS invitation_text text NULL,
  ADD COLUMN IF NOT EXISTS final_text text NULL,
  ADD COLUMN IF NOT EXISTS phone text NULL,
  ADD COLUMN IF NOT EXISTS maps_url text NULL;


-- ===================== migration: 20260815000001_taklifnoma_template_policy.sql =====================

-- Allow the new editorial builder template ids (t1..t4) in the public
-- insert policy. Without this, inserts from the Taklifnoma builder are
-- rejected by RLS even though the `template` column is plain text.
drop policy if exists "Anyone can create validated invitations" on public.invitations;

create policy "Anyone can create validated invitations"
  on public.invitations for insert
  to anon, authenticated
  with check (
    char_length(slug) between 6 and 60
    and char_length(bride_name) between 1 and 60
    and char_length(groom_name) between 1 and 60
    and char_length(hall_name) between 1 and 120
    and (address is null or char_length(address) <= 300)
    and template in ('luxury','minimal','classic','royal','modern','t1','t2','t3','t4')
    and coalesce(array_length(photos, 1), 0) <= 5
    and views = 0
  );


-- ===================== migration: 20260815000002_taklifnoma_music.sql =====================

-- ============================================================
--  Vowly — invitation background music
-- ============================================================
-- 1. Store the uploaded track's public URL on the invitation row.
--    Existing rows are unaffected (NULL = no music).
-- 2. The invitation creator is typically anonymous (guest flow on
--    /taklifnoma/yangi), so we grant BOTH anon and authenticated the
--    ability to upload / delete music under the `invitations/` prefix of
--    the *existing* public `hall-assets` bucket. The policy is scoped to
--    that folder only, so it cannot touch hall-admin or wedding-photo
--    objects — no broad bucket write, no new bucket.
-- 3. Reading the music happens via the public object URL (CDN), which
--    does not require an extra SELECT policy because the bucket is public.
-- ============================================================

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS music_url text NULL;

-- Upload: allow creators to write music objects into invitations/*
DROP POLICY IF EXISTS "Anyone can upload invitation music" ON storage.objects;
CREATE POLICY "Anyone can upload invitation music"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'invitations'
  );

-- Delete: allow creators to remove / replace their uploaded music
DROP POLICY IF EXISTS "Anyone can delete invitation music" ON storage.objects;
CREATE POLICY "Anyone can delete invitation music"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'invitations'
  );


-- ===================== migration: 20260817000001_hall_music_url.sql =====================

-- Add music_url to wedding_halls for background ambient music on guest page
ALTER TABLE wedding_halls ADD COLUMN IF NOT EXISTS music_url text;


-- ===================== migration: 20260817000002_food_image_url.sql =====================

-- Add image_url to food_items so admin can attach a photo to each dish
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS image_url text;


-- ===================== migration: 20260817235154_vowly_weddings_archive.sql =====================

-- =========================================================
-- VOWLY — Wedding lifecycle (current + archive)
-- =========================================================
-- Each "wedding day" is its own record in `weddings`. Wedding-scoped content
-- (banners, food, artists, bride_groom, program, moments, rsvps, timeline) is
-- keyed to that wedding via `wedding_id`. At midnight Asia/Tashkent, the cron
-- archives the active wedding (status='archived', archived_at=now) so its data
-- becomes read-only and visible in the archive list. A fresh active wedding is
-- auto-created only when the admin opens the dashboard for the next day.
--
-- IMPORTANT: this migration preserves 100% of all existing data. Old rows that
-- have no wedding_id yet are auto-backfilled into a single "legacy" active
-- wedding per hall so the previous admin edit screens keep working.

-- ---- weddings table ----
CREATE TABLE public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES public.wedding_halls(id) ON DELETE CASCADE,
  bride_name TEXT NOT NULL DEFAULT '',
  groom_name TEXT NOT NULL DEFAULT '',
  wedding_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cover_image TEXT,
  -- 'active' = current wedding; 'archived' = permanently saved historical record
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  archived_at TIMESTAMPTZ,
  guest_count INTEGER NOT NULL DEFAULT 0,
  qr_scan_count INTEGER NOT NULL DEFAULT 0,
  uploaded_photo_count INTEGER NOT NULL DEFAULT 0,
  rsvp_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX weddings_hall_idx ON public.weddings (hall_id);
CREATE INDEX weddings_status_idx ON public.weddings (status);
CREATE INDEX weddings_date_idx ON public.weddings (wedding_date);

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weddings" ON public.weddings
  FOR SELECT USING (true);
CREATE POLICY "Hall admins can insert weddings" ON public.weddings
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can update weddings" ON public.weddings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));
CREATE POLICY "Hall admins can delete weddings" ON public.weddings
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR hall_id = get_user_hall_id(auth.uid()));

-- =========================================================
-- Step 1 — Backfill: create one legacy active "seed" wedding per hall and
-- attach all existing rows to it so old data is preserved.
-- =========================================================
DO $$
DECLARE
  r RECORD;
  v_wedding_id UUID;
  v_bride_name TEXT;
  v_groom_name TEXT;
  v_wedding_date DATE;
  v_cover TEXT;
BEGIN
  FOR r IN SELECT id, name, logo_url FROM public.wedding_halls LOOP
    -- pull the most recent bride_groom row (if any) for nicer seed defaults
    SELECT bride_name, groom_name, wedding_date, COALESCE(bride_photo, groom_photo)
      INTO v_bride_name, v_groom_name, v_wedding_date, v_cover
      FROM public.bride_groom
      WHERE hall_id = r.id
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1;

    INSERT INTO public.weddings (hall_id, bride_name, groom_name, wedding_date, cover_image, status)
    VALUES (
      r.id,
      COALESCE(v_bride_name, ''),
      COALESCE(v_groom_name, ''),
      COALESCE(v_wedding_date, CURRENT_DATE),
      COALESCE(v_cover, r.logo_url),
      'active'
    )
    RETURNING id INTO v_wedding_id;

    UPDATE public.bride_groom   SET wedding_id = v_wedding_id WHERE hall_id = r.id;
    UPDATE public.banners       SET wedding_id = v_wedding_id WHERE hall_id = r.id;
    UPDATE public.food_items    SET wedding_id = v_wedding_id WHERE hall_id = r.id;
    UPDATE public.artists       SET wedding_id = v_wedding_id WHERE hall_id = r.id;
    UPDATE public.timeline_events SET wedding_id = v_wedding_id WHERE hall_id = r.id;
    UPDATE public.wedding_moments SET wedding_id = v_wedding_id WHERE hall_id = r.id;
    UPDATE public.rsvps         SET wedding_id = v_wedding_id WHERE hall_id = r.id;
  END LOOP;
END $$;

-- =========================================================
-- Step 2 — wedding_id columns. Nullable so old rows never break.
-- =========================================================
ALTER TABLE public.bride_groom
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

-- bride_groom is UNIQUE per hall. Allow multiple bride_groom rows per hall
-- (one per wedding) by dropping that constraint and adding one per wedding.
ALTER TABLE public.bride_groom DROP CONSTRAINT IF EXISTS bride_groom_hall_id_key;

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

ALTER TABLE public.timeline_events
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

ALTER TABLE public.wedding_moments
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bride_groom_wedding_idx ON public.bride_groom (wedding_id);
CREATE INDEX IF NOT EXISTS banners_wedding_idx     ON public.banners (wedding_id);
CREATE INDEX IF NOT EXISTS food_items_wedding_idx  ON public.food_items (wedding_id);
CREATE INDEX IF NOT EXISTS artists_wedding_idx     ON public.artists (wedding_id);
CREATE INDEX IF NOT EXISTS timeline_wedding_idx    ON public.timeline_events (wedding_id);
CREATE INDEX IF NOT EXISTS moments_wedding_idx     ON public.wedding_moments (wedding_id);
CREATE INDEX IF NOT EXISTS rsvps_wedding_idx       ON public.rsvps (wedding_id);

-- =========================================================
-- Step 3 — update_updated_at trigger for weddings
-- =========================================================
CREATE TRIGGER update_weddings_updated_at
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Step 4 — Helper RPC: archive current active wedding for a hall
-- Idempotent: does nothing if no active wedding exists.
-- =========================================================
CREATE OR REPLACE FUNCTION public.archive_active_wedding(_hall_id UUID, _now TIMESTAMPTZ DEFAULT NOW())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_guests INTEGER;
  v_rsvp INTEGER;
  v_photos INTEGER;
BEGIN
  -- Only archive the active wedding that is genuinely in the past (Asia/Tashkent).
  -- This guards against double-active edge cases and keeps today's wedding live.
  SELECT id INTO v_id
    FROM public.weddings
    WHERE hall_id = _hall_id AND status = 'active'
      AND wedding_date < (now() AT TIME ZONE 'Asia/Tashkent')::date
    ORDER BY wedding_date DESC, created_at DESC
    LIMIT 1
    FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Snapshot real stats so the archive cards / detail page are meaningful.
  SELECT COALESCE(SUM(r.guests_count), 0), COUNT(*)
    INTO v_guests, v_rsvp
    FROM public.rsvps r
    WHERE r.wedding_id = v_id;

  SELECT COUNT(*)
    INTO v_photos
    FROM public.wedding_moments m
    WHERE m.wedding_id = v_id;

  UPDATE public.weddings
    SET status = 'archived',
        archived_at = _now,
        guest_count = v_guests,
        rsvp_count = v_rsvp,
        uploaded_photo_count = v_photos
    WHERE id = v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_active_wedding(UUID, TIMESTAMPTZ) TO authenticated, service_role;

-- =========================================================
-- Step 5 — Helper RPC: archive ALL active weddings (for the 00:00 cron)
-- Archives only past-due weddings and snapshots real counts.
-- =========================================================
CREATE OR REPLACE FUNCTION public.archive_all_active_weddings(_now TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH archived AS (
    UPDATE public.weddings w
      SET status = 'archived',
          archived_at = _now,
          guest_count = COALESCE((SELECT SUM(r.guests_count) FROM public.rsvps r WHERE r.wedding_id = w.id), 0),
          rsvp_count = COALESCE((SELECT COUNT(*) FROM public.rsvps r WHERE r.wedding_id = w.id), 0),
          uploaded_photo_count = COALESCE((SELECT COUNT(*) FROM public.wedding_moments m WHERE m.wedding_id = w.id), 0)
      WHERE status = 'active'
        AND wedding_date < (now() AT TIME ZONE 'Asia/Tashkent')::date
      RETURNING 1
  )
  SELECT count(*) INTO v_count FROM archived;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_all_active_weddings(TIMESTAMPTZ) TO authenticated, service_role;


-- ===================== migration: 20260818000000_super_admin_billing.sql =====================

-- ============================================================================
-- Vowly Super Admin — billing & management system
-- ============================================================================
-- Adds: plans, subscriptions, payments, notifications, activity_logs
-- Adds: cover_url + archived + trial columns to wedding_halls
-- Deduplicated: notifications are uniquely identified by (hall_id, type, day)
-- so 5/3/1-day reminders are never created twice.
-- All times are computed in Asia/Tashkent via SQL helpers.
-- ============================================================================

-- 1. plans — subscription plan templates ======================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- 'venue' | 'invitation' | 'venue_invitation'
  name text not null,                        -- 'Venue', 'Invitation', 'Venue + Invitation'
  price numeric(12, 2) not null default 0,  -- monthly price in UZS
  period_days integer not null default 30,   -- subscription period
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;

-- seed default plans
insert into public.plans (code, name, price, period_days, display_order, description) values
  ('venue', 'Toyxona', 299000, 30, 1, 'Vowly toʼyxona tarifi — 299 000 soʼm/oy')
on conflict (code) do nothing;

delete from public.plans where code <> 'venue';

-- 2. extend wedding_halls =====================================================
alter table public.wedding_halls
  add column if not exists cover_url text,
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

-- 3. subscriptions ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active','trial','expired','blocked','archived')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_hall_id_idx on public.subscriptions(hall_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_expires_at_idx on public.subscriptions(expires_at);
alter table public.subscriptions enable row level security;

-- trigger to keep updated_at fresh
create or replace function public.subscriptions_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.subscriptions_touch_updated_at();

-- Only one ACTIVE/TRIAL subscription per hall at a time
create unique index if not exists subscriptions_one_active_per_hall
  on public.subscriptions(hall_id)
  where status in ('active','trial');

-- 4. payments =================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'UZS',
  period_start timestamptz not null,
  period_end timestamptz not null,
  paid_at timestamptz not null default now(),
  status text not null default 'paid' check (status in ('paid','pending','failed','refunded')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists payments_hall_id_idx on public.payments(hall_id);
create index if not exists payments_paid_at_idx on public.payments(paid_at desc);
alter table public.payments enable row level security;

-- 5. notifications ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid references public.wedding_halls(id) on delete cascade,
  type text not null,                       -- 'sub_5d' | 'sub_3d' | 'sub_1d' | 'sub_today' | 'trial_ending' | 'info' | 'payment'
  title text not null,
  message text not null,
  link text,                                -- e.g. '/super-admin/halls/<id>'
  read_at timestamptz,
  dedup_key text,                           -- (hall_id + type + day) — prevents duplicates
  created_at timestamptz not null default now()
);
create index if not exists notifications_hall_id_idx on public.notifications(hall_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notifications_read_at_idx on public.notifications(read_at);
create unique index if not exists notifications_dedup_key_unique
  on public.notifications(dedup_key) where dedup_key is not null;
alter table public.notifications enable row level security;

-- 6. activity logs ============================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  hall_id uuid references public.wedding_halls(id) on delete set null,
  action text not null,                     -- 'hall_created' | 'hall_archived' | 'admin_created' | 'plan_changed' | 'payment_confirmed' | ...
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index if not exists activity_logs_hall_id_idx on public.activity_logs(hall_id);
alter table public.activity_logs enable row level security;

-- 7. Helper: Tashkent "today" date (00:00 Asia/Tashkent)
create or replace function public.today_in_tashkent()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Tashkent')::date
$$;

-- Helper: days remaining (positive = days left, negative = days overdue)
create or replace function public.subscription_days_remaining(_expires_at timestamptz)
returns integer language sql stable as $$
  select ((_expires_at at time zone 'Asia/Tashkent')::date - public.today_in_tashkent())
$$;

-- 8. RPC — confirm payment ====================================================
-- Creates a new subscription period and a payment record atomically.
-- Returns the new payment id.
create or replace function public.confirm_subscription_payment(
  _hall_id uuid,
  _plan_id uuid,
  _paid_at timestamptz default now(),
  _note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan record;
  v_new_sub_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_payment_id uuid;
  v_actor uuid := auth.uid();
  v_actor_email text;
begin
  -- load plan
  select * into v_plan from public.plans where id = _plan_id and is_active = true;
  if v_plan.id is null then
    raise exception 'Plan not found or inactive';
  end if;

  -- expire current active subscription
  update public.subscriptions
     set status = 'archived'
   where hall_id = _hall_id
     and status in ('active','trial','expired');

  -- create new subscription starting today
  v_period_start := _paid_at;
  v_period_end := v_period_start + (v_plan.period_days || ' days')::interval;

  insert into public.subscriptions (hall_id, plan_id, status, started_at, expires_at, auto_renew)
  values (_hall_id, _plan_id, 'active', v_period_start, v_period_end, false)
  returning id into v_new_sub_id;

  -- record payment
  insert into public.payments (hall_id, subscription_id, plan_id, amount, period_start, period_end, paid_at, status, note, created_by)
  values (_hall_id, v_new_sub_id, _plan_id, v_plan.price, v_period_start, v_period_end, v_period_start, 'paid', _note, v_actor)
  returning id into v_payment_id;

  -- resolve actor email for activity log
  select email into v_actor_email from auth.users where id = v_actor;

  insert into public.activity_logs (actor_id, actor_email, hall_id, action, description, metadata)
  values (
    v_actor, v_actor_email, _hall_id, 'payment_confirmed',
    format('Toʼlov qabul qilindi: %s soʼm', v_plan.price::text),
    jsonb_build_object('plan_id', _plan_id, 'plan_code', v_plan.code, 'amount', v_plan.price, 'subscription_id', v_new_sub_id, 'payment_id', v_payment_id)
  );

  -- clear any pending sub_* notifications for this hall
  update public.notifications
     set read_at = now()
   where hall_id = _hall_id
     and type like 'sub_%'
     and read_at is null;

  return v_payment_id;
end $$;

-- 9. RPC — generate subscription reminder notifications =======================
-- Idempotent: deduplicated via notifications.dedup_key (one row per hall/type/date).
-- Call this when the super-admin dashboard loads (or as a scheduled Edge Function).
create or replace function public.sync_subscription_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.today_in_tashkent();
  v_actor uuid := auth.uid();
  v_inserted integer := 0;
  v_rec record;
  v_days_left integer;
  v_type text;
  v_title text;
  v_message text;
  v_dedup text;
begin
  for v_rec in
    select s.id as sub_id, s.hall_id, s.expires_at, h.name as hall_name
    from public.subscriptions s
    join public.wedding_halls h on h.id = s.hall_id
    where s.status in ('active','trial','expired')
      and h.archived = false
  loop
    v_days_left := public.subscription_days_remaining(v_rec.expires_at);

    if v_days_left = 5 then
      v_type := 'sub_5d';
      v_title := v_rec.hall_name;
      v_message := 'Oylik toʼlovingiz tugashiga 5 kun qoldi.';
    elsif v_days_left = 3 then
      v_type := 'sub_3d';
      v_title := v_rec.hall_name;
      v_message := 'Oylik toʼlov tugashiga 3 kun qoldi.';
    elsif v_days_left = 1 then
      v_type := 'sub_1d';
      v_title := v_rec.hall_name;
      v_message := 'Oylik toʼlov ertaga tugaydi.';
    elsif v_days_left = 0 then
      v_type := 'sub_today';
      v_title := v_rec.hall_name;
      v_message := 'Oylik abonement bugun tugaydi.';
    elsif v_days_left < 0 then
      v_type := 'sub_expired';
      v_title := v_rec.hall_name;
      v_message := format('Oylik abonement muddati tugagan (%s kun avval).', abs(v_days_left));
    else
      continue;
    end if;

    v_dedup := v_rec.hall_id || ':' || v_type || ':' || v_today::text;

    insert into public.notifications (hall_id, type, title, message, link, dedup_key)
    values (
      v_rec.hall_id, v_type, v_title, v_message,
      '/super-admin/halls/' || v_rec.hall_id::text,
      v_dedup
    )
    on conflict (dedup_key) do nothing
    returning 1 into v_inserted;
  end loop;

  -- auto-archive expired subscriptions
  update public.subscriptions
     set status = 'expired'
   where status in ('active','trial')
     and expires_at < (v_today::timestamp at time zone 'Asia/Tashkent');

  return v_inserted;
end $$;

-- 10. RLS policies ============================================================
-- helper
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'super_admin')
$$;

-- plans: everyone can read, only super_admin can write
create policy "Anyone can read plans" on public.plans for select using (true);
create policy "Super admin manages plans" on public.plans
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- subscriptions: super admin full access, hall admin can read their own
create policy "Super admin manages subscriptions" on public.subscriptions
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Hall admin reads own subscription" on public.subscriptions
  for select to authenticated using (public.is_hall_admin(auth.uid(), hall_id));

-- payments: super admin full access, hall admin can read their own
create policy "Super admin manages payments" on public.payments
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Hall admin reads own payments" on public.payments
  for select to authenticated using (public.is_hall_admin(auth.uid(), hall_id));

-- notifications: super admin full access, hall admin can read their own
create policy "Super admin manages notifications" on public.notifications
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Hall admin reads own notifications" on public.notifications
  for select to authenticated using (public.is_hall_admin(auth.uid(), hall_id));

-- activity logs: super admin only
create policy "Super admin reads activity logs" on public.activity_logs
  for select to authenticated using (public.is_super_admin());
create policy "Super admin writes activity logs" on public.activity_logs
  for insert to authenticated with check (public.is_super_admin());


-- ===================== migration: 20260818000001_hall_music.sql =====================

-- ============================================================
--  Vowly — hall background music (admin-managed, single active track)
-- ============================================================
--  Context:
--   * 20260817000001 already added wedding_halls.music_url.
--   * This migration adds a human-friendly title + an upload timestamp so the
--     admin can name the track and the guest UI has metadata. A single column
--     models "exactly one active track per hall" (NULL = no music).
--   * ROOT CAUSE FIX: wedding_halls had ONLY a "Super admins can update halls"
--     RLS policy, so a hall admin's update({ music_url }) was rejected and the
--     music was never saved. We add an UPDATE policy scoped to the admin's own
--     hall (multi-tenant safe: id = get_user_hall_id(auth.uid())).

ALTER TABLE public.wedding_halls
  ADD COLUMN IF NOT EXISTS music_title text,
  ADD COLUMN IF NOT EXISTS music_created_at timestamptz;

-- Hall admins may update their own hall (name, logo, music, ...). Scoped so a
-- hall admin can never touch another hall's row → multi-tenant isolation kept.
DROP POLICY IF EXISTS "Hall admins can update their hall" ON public.wedding_halls;
CREATE POLICY "Hall admins can update their hall" ON public.wedding_halls
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR id = public.get_user_hall_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR id = public.get_user_hall_id(auth.uid())
  );


-- ===================== migration: 20260818000100_security_hardening.sql =====================

-- ============================================================================
-- Vowly — security hardening (multi-tenant isolation + billing integrity)
-- ----------------------------------------------------------------------------
-- Fixes found during the production audit:
--   1. Anonymous RSVP / moment uploads were only required to reference a REAL
--      hall; a client could attach data to a wedding belonging to a DIFFERENT
--      hall. Now the wedding_id must belong to the stated hall_id.
--   2. The billing + archive RPCs were SECURITY DEFINER with NO caller check,
--      so any authenticated hall admin could grant subscriptions or archive
--      another venue. They are now scoped to the correct privilege level.
--   3. Subscription periods now start/end at 00:00 Asia/Tashkent (expiry at
--      midnight, per product spec) instead of at the raw payment timestamp.
--   4. A partial unique index guarantees at most ONE active wedding per hall,
--      eliminating the duplicate-active-wedding race in the client hook.
-- All statements are idempotent and safe to re-apply.
-- ============================================================================

-- 1a. rsvps: guests may only attach an RSVP to a wedding inside the same hall.
DROP POLICY IF EXISTS "Guests can send validated rsvp" ON public.rsvps;
CREATE POLICY "Guests can send validated rsvp"
  ON public.rsvps FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = hall_id)
    AND (wedding_id IS NULL OR EXISTS (
      SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.hall_id = hall_id
    ))
    AND char_length(guest_name) BETWEEN 1 AND 100
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND (message IS NULL OR char_length(message) <= 1000)
    AND (table_number IS NULL OR char_length(table_number) <= 20)
    AND guests_count BETWEEN 1 AND 20
  );

-- 1b. wedding_moments: guests may only upload to a wedding inside the same hall.
DROP POLICY IF EXISTS "Guests can upload validated moments" ON public.wedding_moments;
CREATE POLICY "Guests can upload validated moments"
  ON public.wedding_moments FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_halls h WHERE h.id = hall_id)
    AND (wedding_id IS NULL OR EXISTS (
      SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.hall_id = hall_id
    ))
    AND approved = true
    AND char_length(image_url) <= 1000
    AND (caption IS NULL OR char_length(caption) <= 500)
    AND (guest_name IS NULL OR char_length(guest_name) <= 100)
    AND (table_number IS NULL OR char_length(table_number) <= 20)
  );

-- 2a. confirm_subscription_payment: super-admin (or trusted server) only,
--     with periods aligned to 00:00 Asia/Tashkent.
CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(
  _hall_id uuid,
  _plan_id uuid,
  _paid_at timestamptz default now(),
  _note text default null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan record;
  v_new_sub_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_payment_id uuid;
  v_actor uuid := auth.uid();
  v_actor_email text;
BEGIN
  -- billing integrity: only super admins (or the trusted service role) may grant.
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE id = _plan_id AND is_active = true;
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found or inactive';
  END IF;

  -- expire the current active subscription for this hall
  UPDATE public.subscriptions
     SET status = 'archived'
   WHERE hall_id = _hall_id
     AND status IN ('active','trial','expired');

  -- align the new period to 00:00 Asia/Tashkent (expiry at midnight).
  v_period_start := (date_trunc('day', _paid_at AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent');
  v_period_end := v_period_start + (v_plan.period_days || ' days')::interval;

  INSERT INTO public.subscriptions (hall_id, plan_id, status, started_at, expires_at, auto_renew)
  VALUES (_hall_id, _plan_id, 'active', v_period_start, v_period_end, false)
  RETURNING id INTO v_new_sub_id;

  INSERT INTO public.payments (hall_id, subscription_id, plan_id, amount, period_start, period_end, paid_at, status, note, created_by)
  VALUES (_hall_id, v_new_sub_id, _plan_id, v_plan.price, v_period_start, v_period_end, v_period_start, 'paid', _note, v_actor)
  RETURNING id INTO v_payment_id;

  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor;

  INSERT INTO public.activity_logs (actor_id, actor_email, hall_id, action, description, metadata)
  VALUES (
    v_actor, v_actor_email, _hall_id, 'payment_confirmed',
    format('To''lov qabul qilindi: %s so''m', v_plan.price::text),
    jsonb_build_object('plan_id', _plan_id, 'plan_code', v_plan.code, 'amount', v_plan.price, 'subscription_id', v_new_sub_id, 'payment_id', v_payment_id)
  );

  -- clear pending sub_* notifications for this hall
  UPDATE public.notifications
     SET read_at = now()
   WHERE hall_id = _hall_id AND type LIKE 'sub_%' AND read_at IS NULL;

  RETURN v_payment_id;
END $$;

-- 2b. sync_subscription_notifications: service_role or super-admin only.
CREATE OR REPLACE FUNCTION public.sync_subscription_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := public.today_in_tashkent();
  v_inserted integer := 0;
  v_rec record;
  v_days_left integer;
  v_type text;
  v_title text;
  v_message text;
  v_dedup text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  FOR v_rec IN
    SELECT s.id AS sub_id, s.hall_id, s.expires_at, h.name AS hall_name
    FROM public.subscriptions s
    JOIN public.wedding_halls h ON h.id = s.hall_id
    WHERE s.status IN ('active','trial','expired') AND h.archived = false
  LOOP
    v_days_left := public.subscription_days_remaining(v_rec.expires_at);

    IF v_days_left = 5 THEN
      v_type := 'sub_5d'; v_title := v_rec.hall_name; v_message := 'Oylik to''lovingiz tugashiga 5 kun qoldi.';
    ELSIF v_days_left = 3 THEN
      v_type := 'sub_3d'; v_title := v_rec.hall_name; v_message := 'Oylik to''lov tugashiga 3 kun qoldi.';
    ELSIF v_days_left = 1 THEN
      v_type := 'sub_1d'; v_title := v_rec.hall_name; v_message := 'Oylik to''lov ertaga tugaydi.';
    ELSIF v_days_left = 0 THEN
      v_type := 'sub_today'; v_title := v_rec.hall_name; v_message := 'Oylik abonement bugun tugaydi.';
    ELSIF v_days_left < 0 THEN
      v_type := 'sub_expired'; v_title := v_rec.hall_name; v_message := format('Oylik abonement muddati tugagan (%s kun avval).', abs(v_days_left));
    ELSE
      CONTINUE;
    END IF;

    v_dedup := v_rec.hall_id || ':' || v_type || ':' || v_today::text;

    INSERT INTO public.notifications (hall_id, type, title, message, link, dedup_key)
    VALUES (v_rec.hall_id, v_type, v_title, v_message, '/super-admin/halls/' || v_rec.hall_id::text, v_dedup)
    ON CONFLICT (dedup_key) DO NOTHING
    RETURNING 1 INTO v_inserted;
  END LOOP;

  -- auto-archive expired subscriptions (past 00:00 Tashkent of expiry date)
  UPDATE public.subscriptions
     SET status = 'expired'
   WHERE status IN ('active','trial') AND expires_at < (v_today::timestamp AT TIME ZONE 'Asia/Tashkent');

  RETURN v_inserted;
END $$;

-- 2c. archive_active_wedding: service_role / super-admin / the hall's own admin.
CREATE OR REPLACE FUNCTION public.archive_active_wedding(_hall_id UUID, _now TIMESTAMPTZ DEFAULT NOW())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_guests INTEGER;
  v_rsvp INTEGER;
  v_photos INTEGER;
BEGIN
  IF auth.role() <> 'service_role'
     AND NOT public.is_super_admin()
     AND NOT public.is_hall_admin(auth.uid(), _hall_id) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT id INTO v_id
    FROM public.weddings
    WHERE hall_id = _hall_id AND status = 'active'
      AND wedding_date < (now() AT TIME ZONE 'Asia/Tashkent')::date
    ORDER BY wedding_date DESC, created_at DESC
    LIMIT 1
    FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(r.guests_count), 0), COUNT(*)
    INTO v_guests, v_rsvp
    FROM public.rsvps r
    WHERE r.wedding_id = v_id;

  SELECT COUNT(*)
    INTO v_photos
    FROM public.wedding_moments m
    WHERE m.wedding_id = v_id;

  UPDATE public.weddings
    SET status = 'archived',
        archived_at = _now,
        guest_count = v_guests,
        rsvp_count = v_rsvp,
        uploaded_photo_count = v_photos
    WHERE id = v_id;

  RETURN v_id;
END $$;

-- 2d. archive_all_active_weddings: service_role / super-admin only.
CREATE OR REPLACE FUNCTION public.archive_all_active_weddings(_now TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  WITH archived AS (
    UPDATE public.weddings w
      SET status = 'archived',
          archived_at = _now,
          guest_count = COALESCE((SELECT SUM(r.guests_count) FROM public.rsvps r WHERE r.wedding_id = w.id), 0),
          rsvp_count = COALESCE((SELECT COUNT(*) FROM public.rsvps r WHERE r.wedding_id = w.id), 0),
          uploaded_photo_count = COALESCE((SELECT COUNT(*) FROM public.wedding_moments m WHERE m.wedding_id = w.id), 0)
      WHERE status = 'active'
        AND wedding_date < (now() AT TIME ZONE 'Asia/Tashkent')::date
      RETURNING 1
  )
  SELECT count(*) INTO v_count FROM archived;
  RETURN v_count;
END $$;

-- 4. At most ONE active wedding per hall (guards the client auto-create race).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.weddings WHERE status = 'active' GROUP BY hall_id HAVING count(*) > 1 LIMIT 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS weddings_one_active_per_hall
      ON public.weddings(hall_id) WHERE status = 'active';
  END IF;
END $$;


-- ===================== migration: 20260818000200_seed_default_plans_rpc.sql =====================

-- ============================================================================
-- Seed the three standard Vowly plans via a SECURITY DEFINER RPC
-- ============================================================================
-- The super-admin UI "Standart tariflarni qo'shish" (Add standard plans) button
-- used to call supabase.from('plans').upsert(...) directly from the browser.
-- That insert is gated by the plans RLS policy
--   WITH CHECK (public.is_super_admin())
-- which can reject the write even for a legitimately-roled super admin (the
-- client-side role is resolved independently of is_super_admin() via the
-- user_roles "user_id = auth.uid()" branch). The result was a confusing
-- "new row violates row-level security policy for table plans" error on click.
--
-- This RPC runs as the function owner (postgres), so it bypasses the plans RLS
-- INSERT policy entirely, performs an idempotent insert (ON CONFLICT DO UPDATE),
-- and authorizes the caller directly against user_roles — independent of the
-- has_role()/is_super_admin() SECURITY DEFINER chain.
-- ============================================================================

create or replace function public.seed_default_plans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  -- Authorize: service_role (Edge Functions) or a caller with the super_admin role.
  -- Checked directly against user_roles so it does not depend on has_role()/is_super_admin().
  if auth.role() <> 'service_role' and not exists (
    select 1
      from public.user_roles
     where user_id = auth.uid()
       and role = 'super_admin'
  ) then
    raise exception 'permission_denied';
  end if;

  insert into public.plans (code, name, price, period_days, description, is_active, display_order)
  values
    ('venue', 'Toyxona', 299000, 30, 'Vowly toʼyxona tarifi — 299 000 soʼm/oy', true, 1)
  on conflict (code) do update
    set name         = excluded.name,
        price        = excluded.price,
        period_days  = excluded.period_days,
        description  = excluded.description,
        is_active    = excluded.is_active,
        display_order = excluded.display_order;

  delete from public.plans where code <> 'venue';

  select count(*) into v_count from public.plans;
  return v_count;
end $$;

grant execute on function public.seed_default_plans() to authenticated, service_role;
