-- Add hashtags column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hashtags text[];

-- Add hashtags column to posts table (if not already exists)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags text[];

-- Update existing records to have empty hashtags array
UPDATE videos SET hashtags = '{}' WHERE hashtags IS NULL;
UPDATE posts SET hashtags = '{}' WHERE hashtags IS NULL;
