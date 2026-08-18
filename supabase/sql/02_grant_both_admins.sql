-- ============================================================================
-- 02_grant_both_admins.sql  —  run in the NEW Supabase project (vbikhnzwnsfddgjzwuge)
-- Run THIS AFTER 00_consolidated_schema.sql (creates the user_roles table).
--
-- Grants the 'super_admin' role to BOTH admin accounts (idempotent / safe to
-- re-run). Add or remove emails in the IN (...) list as needed.
-- ============================================================================

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE u.email IN (
  'khalmuratovnursultan3@gmail.com',
  'nursultansayyora@gmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = u.id AND r.role = 'super_admin'
);

-- Quick sanity check: list everyone with super_admin
SELECT u.email, r.role
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE r.role = 'super_admin';
