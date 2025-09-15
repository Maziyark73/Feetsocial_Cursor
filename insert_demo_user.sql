-- Insert demo user into the database
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
