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