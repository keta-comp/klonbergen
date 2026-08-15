-- ============================================================
--  Vowly — invitation background music
-- ============================================================
-- 1. Store the uploaded track's public URL on the invitation row.
--    Existing rows are unaffected (NULL = no music).
-- 2. The invitation creator is typically anonymous (guest flow on
--    /taklifnoma/yangi), so we grant BOTH anon and authenticated the
--    ability to upload / delete music under the `invitations/` prefix of
--    the *existing* public `hall-assets` bucket. The policy is scoped to
--    that folder only, so it cannot touch hall-admin or wedding-photo
--    objects — no broad bucket write, no new bucket.
-- 3. Reading the music happens via the public object URL (CDN), which
--    does not require an extra SELECT policy because the bucket is public.
-- ============================================================

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS music_url text NULL;

-- Upload: allow creators to write music objects into invitations/*
DROP POLICY IF EXISTS "Anyone can upload invitation music" ON storage.objects;
CREATE POLICY "Anyone can upload invitation music"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'invitations'
  );

-- Delete: allow creators to remove / replace their uploaded music
DROP POLICY IF EXISTS "Anyone can delete invitation music" ON storage.objects;
CREATE POLICY "Anyone can delete invitation music"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (
    bucket_id = 'hall-assets'
    AND (storage.foldername(name))[1] = 'invitations'
  );
