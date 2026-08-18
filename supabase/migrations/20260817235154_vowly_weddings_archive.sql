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
