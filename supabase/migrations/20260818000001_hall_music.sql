-- ============================================================
--  Vowly — hall background music (admin-managed, single active track)
-- ============================================================
--  Context:
--   * 20260817000001 already added wedding_halls.music_url.
--   * This migration adds a human-friendly title + an upload timestamp so the
--     admin can name the track and the guest UI has metadata. A single column
--     models "exactly one active track per hall" (NULL = no music).
--   * ROOT CAUSE FIX: wedding_halls had ONLY a "Super admins can update halls"
--     RLS policy, so a hall admin's update({ music_url }) was rejected and the
--     music was never saved. We add an UPDATE policy scoped to the admin's own
--     hall (multi-tenant safe: id = get_user_hall_id(auth.uid())).

ALTER TABLE public.wedding_halls
  ADD COLUMN IF NOT EXISTS music_title text,
  ADD COLUMN IF NOT EXISTS music_created_at timestamptz;

-- Hall admins may update their own hall (name, logo, music, ...). Scoped so a
-- hall admin can never touch another hall's row → multi-tenant isolation kept.
DROP POLICY IF EXISTS "Hall admins can update their hall" ON public.wedding_halls;
CREATE POLICY "Hall admins can update their hall" ON public.wedding_halls
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR id = public.get_user_hall_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR id = public.get_user_hall_id(auth.uid())
  );
