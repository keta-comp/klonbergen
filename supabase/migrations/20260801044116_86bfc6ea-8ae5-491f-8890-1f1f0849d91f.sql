GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hall_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_hall_id(uuid) TO authenticated;