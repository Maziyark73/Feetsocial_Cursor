-- Fix RLS policies for videos table to allow demo user
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all public videos" ON videos;
DROP POLICY IF EXISTS "Users can create own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;

-- Create new policies that allow demo user
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
