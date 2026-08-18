-- ============================================================================
-- Vowly — Billing schema installer (idempotent, safe to re-run)
-- ============================================================================
-- The app's "Add standard plans" / "Add plan" buttons fail with
--   "relation public.plans does not exist"
-- because the billing migrations were never deployed to this Supabase project.
--
-- Paste this whole file into the Supabase SQL Editor and RUN IT. It creates the
-- plans + billing tables, seeds the three standard plans, installs the
-- seed_default_plans() RPC, and applies RLS. Every statement is guarded
-- (IF NOT EXISTS / CREATE OR REPLACE / ON CONFLICT DO NOTHING) so re-running
-- is safe.
-- ============================================================================

-- 0. Role enum + helper (guard, do not fail if already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = 'app_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END
$$;

-- 1. plans -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  period_days integer NOT NULL DEFAULT 30,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

INSERT INTO public.plans (code, name, price, period_days, display_order, description) VALUES
  ('venue',             'Venue',               99000, 30, 1, 'Faqat to''yxona boshqaruvi'),
  ('invitation',        'Invitation',         299000, 30, 2, 'Faqat raqamli taklifnoma'),
  ('venue_invitation',  'Venue + Invitation', 399000, 30, 3, 'To''yxona va taklifnoma birgalikda')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
$$;

DROP POLICY IF EXISTS "Anyone can read plans" ON public.plans;
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin manages plans" ON public.plans;
CREATE POLICY "Super admin manages plans"
  ON public.plans FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 2. billing tables ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid NOT NULL REFERENCES public.wedding_halls(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','expired','blocked','archived')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  auto_renew boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_hall_id_idx ON public.subscriptions(hall_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx ON public.subscriptions(expires_at);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid NOT NULL REFERENCES public.wedding_halls(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'UZS',
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','pending','failed','refunded')),
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_hall_id_idx ON public.payments(hall_id);
CREATE INDEX IF NOT EXISTS payments_paid_at_idx ON public.payments(paid_at);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid REFERENCES public.wedding_halls(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read_at timestamptz,
  dedup_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_hall_id_idx ON public.notifications(hall_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON public.notifications(read_at);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedup_key_unique
  ON public.notifications(dedup_key) WHERE dedup_key IS NOT NULL;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  hall_id uuid REFERENCES public.wedding_halls(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_hall_id_idx ON public.activity_logs(hall_id);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS for the new billing tables
DROP POLICY IF EXISTS "Super admin manages subscriptions" ON public.subscriptions;
CREATE POLICY "Super admin manages subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "Hall admin reads own subscription" ON public.subscriptions;
CREATE POLICY "Hall admin reads own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_hall_admin(auth.uid(), hall_id));

DROP POLICY IF EXISTS "Super admin manages payments" ON public.payments;
CREATE POLICY "Super admin manages payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "Hall admin reads own payments" ON public.payments;
CREATE POLICY "Hall admin reads own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_hall_admin(auth.uid(), hall_id));

DROP POLICY IF EXISTS "Super admin manages notifications" ON public.notifications;
CREATE POLICY "Super admin manages notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "Hall admin reads own notifications" ON public.notifications;
CREATE POLICY "Hall admin reads own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_hall_admin(auth.uid(), hall_id));

DROP POLICY IF EXISTS "Super admin reads activity logs" ON public.activity_logs;
CREATE POLICY "Super admin reads activity logs"
  ON public.activity_logs FOR SELECT TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin writes activity logs" ON public.activity_logs;
CREATE POLICY "Super admin writes activity logs"
  ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

-- 3. helpers + billing RPCs --------------------------------------------------
CREATE OR REPLACE FUNCTION public.today_in_tashkent()
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Tashkent')::date
$$;

CREATE OR REPLACE FUNCTION public.subscription_days_remaining(_expires_at timestamptz)
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT ((_expires_at AT TIME ZONE 'Asia/Tashkent')::date - public.today_in_tashkent())
$$;

CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(
  _hall_id uuid,
  _plan_id uuid,
  _paid_at timestamptz DEFAULT now(),
  _note text DEFAULT null
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan record; v_new_sub_id uuid; v_period_start timestamptz; v_period_end timestamptz;
  v_payment_id uuid; v_actor uuid := auth.uid(); v_actor_email text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  SELECT * INTO v_plan FROM public.plans WHERE id = _plan_id AND is_active = true;
  IF v_plan.id IS NULL THEN RAISE EXCEPTION 'Plan not found or inactive'; END IF;
  UPDATE public.subscriptions SET status = 'archived'
   WHERE hall_id = _hall_id AND status IN ('active','trial','expired');
  v_period_start := (date_trunc('day', _paid_at AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent');
  v_period_end := v_period_start + (v_plan.period_days || ' days')::interval;
  INSERT INTO public.subscriptions (hall_id, plan_id, status, started_at, expires_at, auto_renew)
  VALUES (_hall_id, _plan_id, 'active', v_period_start, v_period_end, false) RETURNING id INTO v_new_sub_id;
  INSERT INTO public.payments (hall_id, subscription_id, plan_id, amount, period_start, period_end, paid_at, status, note, created_by)
  VALUES (_hall_id, v_new_sub_id, _plan_id, v_plan.price, v_period_start, v_period_end, v_period_start, 'paid', _note, v_actor) RETURNING id INTO v_payment_id;
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor;
  INSERT INTO public.activity_logs (actor_id, actor_email, hall_id, action, description, metadata)
  VALUES (v_actor, v_actor_email, _hall_id, 'payment_confirmed',
    format('To''lov qabul qilindi: %s so''m', v_plan.price::text),
    jsonb_build_object('plan_id', _plan_id, 'plan_code', v_plan.code, 'amount', v_plan.price, 'subscription_id', v_new_sub_id, 'payment_id', v_payment_id));
  UPDATE public.notifications SET read_at = now()
   WHERE hall_id = _hall_id AND type LIKE 'sub_%' AND read_at IS NULL;
  RETURN v_payment_id;
END $$;

CREATE OR REPLACE FUNCTION public.sync_subscription_notifications()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today date := public.today_in_tashkent(); v_inserted integer := 0; v_rec record;
  v_days_left integer; v_type text; v_title text; v_message text; v_dedup text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  FOR v_rec IN
    SELECT s.id AS sub_id, s.hall_id, s.expires_at, h.name AS hall_name
    FROM public.subscriptions s JOIN public.wedding_halls h ON h.id = s.hall_id
    WHERE s.status IN ('active','trial','expired') AND h.archived = false
  LOOP
    v_days_left := public.subscription_days_remaining(v_rec.expires_at);
    IF v_days_left = 5 THEN v_type := 'sub_5d'; v_title := v_rec.hall_name; v_message := 'Oylik to''lovingiz tugashiga 5 kun qoldi.';
    ELSIF v_days_left = 3 THEN v_type := 'sub_3d'; v_title := v_rec.hall_name; v_message := 'Oylik to''lov tugashiga 3 kun qoldi.';
    ELSIF v_days_left = 1 THEN v_type := 'sub_1d'; v_title := v_rec.hall_name; v_message := 'Oylik to''lov ertaga tugaydi.';
    ELSIF v_days_left = 0 THEN v_type := 'sub_today'; v_title := v_rec.hall_name; v_message := 'Oylik abonement bugun tugaydi.';
    ELSIF v_days_left < 0 THEN v_type := 'sub_expired'; v_title := v_rec.hall_name; v_message := format('Oylik abonement muddati tugagan (%s kun avval).', abs(v_days_left));
    ELSE CONTINUE;
    END IF;
    v_dedup := v_rec.hall_id || ':' || v_type || ':' || v_today::text;
    INSERT INTO public.notifications (hall_id, type, title, message, link, dedup_key)
    VALUES (v_rec.hall_id, v_type, v_title, v_message, '/super-admin/halls/' || v_rec.hall_id::text, v_dedup)
    ON CONFLICT (dedup_key) DO NOTHING RETURNING 1 INTO v_inserted;
  END LOOP;
  UPDATE public.subscriptions SET status = 'expired'
   WHERE status IN ('active','trial') AND expires_at < (v_today::timestamp AT TIME ZONE 'Asia/Tashkent');
  RETURN v_inserted;
END $$;

-- 4. the robust seed RPC (bypasses plans RLS; idempotent) --------------------
CREATE OR REPLACE FUNCTION public.seed_default_plans()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  INSERT INTO public.plans (code, name, price, period_days, description, is_active, display_order)
  VALUES
    ('venue',             'Venue',               99000, 30, 'Faqat to''yxona boshqaruvi',           true, 1),
    ('invitation',        'Invitation',         299000, 30, 'Faqat raqamli taklifnoma',            true, 2),
    ('venue_invitation',  'Venue + Invitation', 399000, 30, 'To''yxona va taklifnoma birgalikda',   true, 3)
  ON CONFLICT (code) DO UPDATE
    SET name = excluded.name, price = excluded.price, period_days = excluded.period_days,
        description = excluded.description, is_active = excluded.is_active, display_order = excluded.display_order;
  SELECT count(*) INTO v_count FROM public.plans;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.seed_default_plans() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

-- Done. After running, the "Add standard plans" and "Add plan" buttons work.
SELECT count(*) AS plans_now FROM public.plans;
