-- Add image_url to food_items so admin can attach a photo to each dish
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS image_url text;
