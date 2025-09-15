-- Set up Supabase Storage for video uploads

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Create video thumbnails storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-thumbnails',
  'video-thumbnails',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for videos bucket
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for video-thumbnails bucket
CREATE POLICY "Anyone can view video thumbnails"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'video-thumbnails');

CREATE POLICY "Authenticated users can upload video thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'video-thumbnails');

CREATE POLICY "Users can update own video thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own video thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update videos table to store file paths instead of cloudflare_video_id
ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_file_path text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_file_path text;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_videos_video_file_path ON videos(video_file_path);
CREATE INDEX IF NOT EXISTS idx_videos_thumbnail_file_path ON videos(thumbnail_file_path);
