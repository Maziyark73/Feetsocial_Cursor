-- Set up Supabase Storage for user avatars

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow avatar uploads for demo user"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = '550e8400-e29b-41d4-a716-446655440000'
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
