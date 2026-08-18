-- ============================================================================
-- Vowly — add the columns that the current frontend expects on wedding_halls
-- but which were introduced by a later migration that was never applied to the
-- live project. Running this removes the "400 PGRST204 / unknown column cover_url"
-- error when creating a hall.
-- Idempotent: safe to run multiple times.
-- ============================================================================

ALTER TABLE public.wedding_halls
  ADD COLUMN IF NOT EXISTS cover_url      text,
  ADD COLUMN IF NOT EXISTS archived       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at    timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at  timestamptz;

-- NOTE: This only fixes the wedding_halls table. For the rest of the system
-- (plans, subscriptions, payments, notifications, activity_logs + the RPCs),
-- run the full installer in supabase/sql/install_billing.sql as well.
