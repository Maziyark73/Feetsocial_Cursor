-- Create follows table for user relationships

CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for follows table
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Demo user can follow/unfollow"
  ON follows FOR ALL
  TO public
  USING (
    follower_id = '550e8400-e29b-41d4-a716-446655440000'::uuid OR
    following_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Insert some demo follows for testing
INSERT INTO follows (follower_id, following_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (follower_id, following_id) DO NOTHING;
