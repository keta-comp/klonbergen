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
