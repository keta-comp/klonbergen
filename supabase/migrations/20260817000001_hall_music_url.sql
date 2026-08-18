-- Add music_url to wedding_halls for background ambient music on guest page
ALTER TABLE wedding_halls ADD COLUMN IF NOT EXISTS music_url text;
