CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  bride_name text NOT NULL,
  groom_name text NOT NULL,
  wedding_date date NOT NULL,
  wedding_time time NOT NULL,
  hall_name text NOT NULL,
  address text,
  photos text[] NOT NULL DEFAULT '{}',
  template text NOT NULL DEFAULT 'luxury',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invitations_slug_idx ON public.invitations (slug);

GRANT SELECT, INSERT ON public.invitations TO anon;
GRANT SELECT, INSERT ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invitations"
  ON public.invitations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create validated invitations"
  ON public.invitations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(slug) BETWEEN 6 AND 60
    AND char_length(bride_name) BETWEEN 1 AND 60
    AND char_length(groom_name) BETWEEN 1 AND 60
    AND char_length(hall_name) BETWEEN 1 AND 120
    AND (address IS NULL OR char_length(address) <= 300)
    AND template IN ('luxury','minimal','classic','royal','modern')
    AND array_length(photos, 1) IS NOT DISTINCT FROM array_length(photos, 1)
    AND coalesce(array_length(photos, 1), 0) <= 5
    AND views = 0
  );

CREATE POLICY "Super admins can update invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete invitations"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();