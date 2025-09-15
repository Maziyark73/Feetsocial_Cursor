-- Fix RLS policies for users table to resolve authentication errors

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all public users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Allow user updates for demo user" ON users;
DROP POLICY IF EXISTS "Allow user creation for demo user" ON users;

-- Create new policies that work for both authenticated and anonymous users
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

-- Also fix storage policies to work with demo user
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload video thumbnails" ON storage.objects;

CREATE POLICY "Allow video uploads for demo user"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'videos' AND 
    (storage.foldername(name))[1] = '550e8400-e29b-41d4-a716-446655440000'
  );

CREATE POLICY "Allow thumbnail uploads for demo user"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'video-thumbnails' AND 
    (storage.foldername(name))[1] = '550e8400-e29b-41d4-a716-446655440000'
  );
