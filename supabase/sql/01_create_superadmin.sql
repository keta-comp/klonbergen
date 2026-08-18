-- ============================================================================
-- 01_create_superadmin.sql  —  run in the NEW Supabase project (vbikhnzwnsfddgjzwuge)
-- Run THIS AFTER:
--   1) 00_consolidated_schema.sql  (creates tables + RPCs + 299k plan)
--   2) You have created your admin account
--      (Supabase Dashboard -> Authentication -> Add user -> email + password)
-- ============================================================================
--
-- This grants the 'super_admin' role to an account so the SuperAdmin dashboard
-- is unlocked. It is IDEMPOTENT (safe to run more than once).
--
-- How it picks the account:
--   * If you set v_email below to the admin's email, it targets that account.
--   * If you leave v_email NULL, it grants to the MOST RECENTLY created user
--     (perfect for a fresh project where you just made the one admin account).
-- ============================================================================

DO $$
DECLARE
  v_email text := NULL;   -- <-- optional: put admin email here, e.g. 'me@example.com'
  v_uid   uuid;
BEGIN
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_uid
    FROM auth.users
    WHERE email = v_email
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT id INTO v_uid
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'No user found to promote. Create the admin account first (Dashboard -> Authentication -> Add user), then re-run this script.';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Granted super_admin to user %', v_uid;
  END IF;
END $$;
