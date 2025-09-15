-- Fix all database issues at once

-- 1. Add missing hashtags columns
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hashtags text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags text[];

-- 2. Update existing records
UPDATE videos SET hashtags = '{}' WHERE hashtags IS NULL;
UPDATE posts SET hashtags = '{}' WHERE hashtags IS NULL;

-- 3. Fix RLS policies for videos table
DROP POLICY IF EXISTS "Users can view all public videos" ON videos;
DROP POLICY IF EXISTS "Users can create own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;
DROP POLICY IF EXISTS "Anyone can view public videos" ON videos;
DROP POLICY IF EXISTS "Allow video creation for demo user" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;

CREATE POLICY "Anyone can view public videos"
  ON videos FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Allow video creation for demo user"
  ON videos FOR INSERT
  TO public
  WITH CHECK (user_id = '550e8400-e29b-41d4-a716-446655440000');

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO public
  USING (user_id = '550e8400-e29b-41d4-a716-446655440000');

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO public
  USING (user_id = '550e8400-e29b-41d4-a716-446655440000');

-- 4. Fix RLS policies for users table
DROP POLICY IF EXISTS "Users can view all public users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow user updates for demo user"
  ON users FOR UPDATE
  TO public
  USING (id = '550e8400-e29b-41d4-a716-446655440000');

CREATE POLICY "Allow user creation for demo user"
  ON users FOR INSERT
  TO public
  WITH CHECK (id = '550e8400-e29b-41d4-a716-446655440000');

-- 5. Fix RLS policies for live_streams table
DROP POLICY IF EXISTS "Users can view active live streams" ON live_streams;
DROP POLICY IF EXISTS "Users can create own live streams" ON live_streams;
DROP POLICY IF EXISTS "Users can update own live streams" ON live_streams;

CREATE POLICY "Anyone can view active live streams"
  ON live_streams FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow live stream creation for demo user"
  ON live_streams FOR INSERT
  TO public
  WITH CHECK (user_id = '550e8400-e29b-41d4-a716-446655440000');

CREATE POLICY "Allow live stream updates for demo user"
  ON live_streams FOR UPDATE
  TO public
  USING (user_id = '550e8400-e29b-41d4-a716-446655440000');
