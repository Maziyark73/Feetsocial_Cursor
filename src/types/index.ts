export interface User {
  id: string;
  username: string;
  avatar_url: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  videos_count: number;
  battles_won: number;
  battles_lost: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  cloudflare_video_id: string;
  thumbnail_url?: string;
  user_id: string;
  user?: User;
  sound_id?: string;
  sound?: Sound;
  battle_id?: string;
  battle?: Battle;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  duration: number;
  is_public: boolean;
  is_flagged: boolean;
  hashtags: string[];
  created_at: string;
  updated_at: string;
}

export interface Battle {
  id: string;
  title: string;
  description?: string;
  video1_id: string;
  video1?: Video;
  video2_id: string;
  video2?: Video;
  creator_id: string;
  creator?: User;
  votes1_count: number;
  votes2_count: number;
  total_votes: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  winner_video_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  battle_id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  user?: User;
  content: string;
  likes_count: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sound {
  id: string;
  title: string;
  artist?: string;
  url: string;
  duration: number;
  use_count: number;
  created_by?: string;
  created_at: string;
}

export interface Flag {
  id: string;
  target_type: 'video' | 'user' | 'comment';
  target_id: string;
  reason: string;
  description?: string;
  created_by: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface Like {
  id: string;
  video_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  follower?: User;
  following?: User;
  created_at: string;
}

export interface LiveStream {
  id: string;
  user_id: string;
  user?: User;
  cloudflare_live_input_id: string;
  title: string;
  description?: string;
  rtmp_url: string;
  stream_key: string;
  playback_url: string;
  is_active: boolean;
  viewer_count: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveInputResponse {
  success: boolean;
  liveInput?: {
    id: string;
    rtmpUrl: string;
    streamKey: string;
    playbackUrl: string;
    srtUrl: string;
    srtStreamId: string;
    status: string;
    title: string;
  };
  error?: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: User;
  user2?: User;
  last_message_at: string;
  last_message?: Message;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'emoji';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}