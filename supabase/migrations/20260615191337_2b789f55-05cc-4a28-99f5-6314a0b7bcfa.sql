
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
