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
    ('venue',             'Venue',               99000, 30, 'Faqat toʼyxona boshqaruvi',           true, 1),
    ('invitation',        'Invitation',         299000, 30, 'Faqat raqamli taklifnoma',            true, 2),
    ('venue_invitation',  'Venue + Invitation', 399000, 30, 'Toʼyxona va taklifnoma birgalikda',   true, 3)
  on conflict (code) do update
    set name         = excluded.name,
        price        = excluded.price,
        period_days  = excluded.period_days,
        description  = excluded.description,
        is_active    = excluded.is_active,
        display_order = excluded.display_order;

  select count(*) into v_count from public.plans;
  return v_count;
end $$;

grant execute on function public.seed_default_plans() to authenticated, service_role;
