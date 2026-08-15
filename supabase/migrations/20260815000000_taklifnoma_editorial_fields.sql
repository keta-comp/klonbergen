-- Adds optional editorial fields to the invitations table for the new
-- premium taklifnoma builder. Existing rows are unaffected.
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS welcome_text text NULL,
  ADD COLUMN IF NOT EXISTS invitation_text text NULL,
  ADD COLUMN IF NOT EXISTS final_text text NULL,
  ADD COLUMN IF NOT EXISTS phone text NULL,
  ADD COLUMN IF NOT EXISTS maps_url text NULL;
