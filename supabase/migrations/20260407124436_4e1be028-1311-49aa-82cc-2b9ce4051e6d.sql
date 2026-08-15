
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
