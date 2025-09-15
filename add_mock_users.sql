-- Add mock users for testing follow functionality

-- Insert additional mock users
INSERT INTO users (id, username, avatar_url, bio, followers_count, following_count, videos_count, battles_won, battles_lost, is_admin, created_at, updated_at) VALUES
  ('user-2', 'alex_creator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'Content creator and dancer 🕺', 1250, 340, 45, 12, 3, false, NOW(), NOW()),
  ('user-3', 'sarah_music', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'Musician and singer 🎵', 2100, 180, 32, 8, 2, false, NOW(), NOW()),
  ('user-4', 'mike_fitness', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'Fitness enthusiast 💪', 890, 420, 28, 15, 1, false, NOW(), NOW()),
  ('user-5', 'lisa_art', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa', 'Digital artist and designer 🎨', 1650, 290, 67, 6, 4, false, NOW(), NOW()),
  ('user-6', 'david_tech', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 'Tech reviewer and gamer 🎮', 3200, 150, 89, 22, 5, false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  followers_count = EXCLUDED.followers_count,
  following_count = EXCLUDED.following_count,
  videos_count = EXCLUDED.videos_count,
  battles_won = EXCLUDED.battles_won,
  battles_lost = EXCLUDED.battles_lost,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();

-- Add some mock videos for these users
INSERT INTO videos (id, title, description, cloudflare_video_id, thumbnail_url, user_id, view_count, like_count, comment_count, share_count, duration, is_public, is_flagged, hashtags, created_at, updated_at) VALUES
  ('video-user2-1', 'Amazing Dance Moves', 'Check out these cool dance moves!', 'https://picsum.photos/400/600?random=1', 'https://picsum.photos/400/600?random=1', 'user-2', 15420, 890, 45, 23, 30, true, false, ARRAY['dance', 'music', 'fun'], NOW() - INTERVAL '2 hours', NOW()),
  ('video-user3-1', 'Beautiful Song Cover', 'Cover of my favorite song', 'https://picsum.photos/400/600?random=2', 'https://picsum.photos/400/600?random=2', 'user-3', 22100, 1200, 78, 45, 45, true, false, ARRAY['music', 'cover', 'singing'], NOW() - INTERVAL '4 hours', NOW()),
  ('video-user4-1', 'Workout Routine', 'My daily workout routine', 'https://picsum.photos/400/600?random=3', 'https://picsum.photos/400/600?random=3', 'user-4', 8750, 450, 32, 18, 60, true, false, ARRAY['fitness', 'workout', 'health'], NOW() - INTERVAL '6 hours', NOW()),
  ('video-user5-1', 'Digital Art Process', 'Creating digital art step by step', 'https://picsum.photos/400/600?random=4', 'https://picsum.photos/400/600?random=4', 'user-5', 12300, 670, 56, 29, 90, true, false, ARRAY['art', 'digital', 'creative'], NOW() - INTERVAL '8 hours', NOW()),
  ('video-user6-1', 'Gaming Setup Tour', 'My gaming setup and equipment', 'https://picsum.photos/400/600?random=5', 'https://picsum.photos/400/600?random=5', 'user-6', 18900, 980, 67, 34, 75, true, false, ARRAY['gaming', 'setup', 'tech'], NOW() - INTERVAL '10 hours', NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  cloudflare_video_id = EXCLUDED.cloudflare_video_id,
  thumbnail_url = EXCLUDED.thumbnail_url,
  view_count = EXCLUDED.view_count,
  like_count = EXCLUDED.like_count,
  comment_count = EXCLUDED.comment_count,
  share_count = EXCLUDED.share_count,
  duration = EXCLUDED.duration,
  is_public = EXCLUDED.is_public,
  is_flagged = EXCLUDED.is_flagged,
  hashtags = EXCLUDED.hashtags,
  updated_at = NOW();

-- Add some mock posts for these users
INSERT INTO posts (id, user_id, caption, image_url, hashtags, like_count, comment_count, share_count, is_public, created_at, updated_at) VALUES
  ('post-user2-1', 'user-2', 'Behind the scenes of my latest dance video! 🎬', 'https://picsum.photos/400/600?random=6', ARRAY['dance', 'behindthescenes', 'video'], 234, 12, 8, true, NOW() - INTERVAL '1 hour', NOW()),
  ('post-user3-1', 'user-3', 'Recording session vibes 🎤', 'https://picsum.photos/400/600?random=7', ARRAY['music', 'recording', 'studio'], 456, 23, 15, true, NOW() - INTERVAL '3 hours', NOW()),
  ('post-user4-1', 'user-4', 'Morning workout complete! 💪', 'https://picsum.photos/400/600?random=8', ARRAY['fitness', 'morning', 'workout'], 189, 8, 5, true, NOW() - INTERVAL '5 hours', NOW()),
  ('post-user5-1', 'user-5', 'New art piece in progress 🎨', 'https://picsum.photos/400/600?random=9', ARRAY['art', 'progress', 'creative'], 312, 18, 12, true, NOW() - INTERVAL '7 hours', NOW()),
  ('post-user6-1', 'user-6', 'New gaming gear just arrived! 🎮', 'https://picsum.photos/400/600?random=10', ARRAY['gaming', 'gear', 'unboxing'], 567, 31, 22, true, NOW() - INTERVAL '9 hours', NOW())
ON CONFLICT (id) DO UPDATE SET
  caption = EXCLUDED.caption,
  image_url = EXCLUDED.image_url,
  hashtags = EXCLUDED.hashtags,
  like_count = EXCLUDED.like_count,
  comment_count = EXCLUDED.comment_count,
  share_count = EXCLUDED.share_count,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();
