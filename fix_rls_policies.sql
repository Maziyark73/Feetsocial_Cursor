-- Fix RLS policies to allow demo user to insert posts
-- First, let's check if the demo user exists and create it if needed
INSERT INTO users (
  id,
  username,
  display_name,
  email,
  avatar_url,
  bio,
  follower_count,
  following_count,
  video_count,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo_user',
  'Demo User',
  'demo@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  'Demo user for testing',
  0,
  0,
  0,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = now();

-- Drop existing policies and recreate them with more permissive rules
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can view all public posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Create more permissive policies
CREATE POLICY "Anyone can view public posts"
  ON posts FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Allow post creation for authenticated users or demo user"
  ON posts FOR INSERT
  TO public
  WITH CHECK (
    auth.role() = 'authenticated' OR 
    user_id = '550e8400-e29b-41d4-a716-446655440000'
  );

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO public
  USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) OR user_id = '550e8400-e29b-41d4-a716-446655440000';

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO public
  USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) OR user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Also fix the storage policies
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own posts" ON storage.objects;

CREATE POLICY "Anyone can view posts"
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'posts');

CREATE POLICY "Allow post uploads for authenticated users or demo user"
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'posts' AND (
      auth.role() = 'authenticated' OR 
      (storage.foldername(name))[1] = '550e8400-e29b-41d4-a716-446655440000'
    )
  );

CREATE POLICY "Users can update own posts"
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'posts' AND (
      (auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]) OR
      (storage.foldername(name))[1] = '550e8400-e29b-41d4-a716-446655440000'
    )
  );

CREATE POLICY "Users can delete own posts"
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'posts' AND (
      (auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]) OR
      (storage.foldername(name))[1] = '550e8400-e29b-41d4-a716-446655440000'
    )
  );
