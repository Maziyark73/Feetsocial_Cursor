import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials (not placeholder values)
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder_key';

if (!hasValidCredentials) {
  console.warn('Supabase not configured. Running in demo mode.');
}

export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Database = {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cloudflare_video_id: string;
          thumbnail_url: string | null;
          sound_id: string | null;
          hashtags: string[] | null;
          view_count: number;
          like_count: number;
          comment_count: number;
          share_count: number;
          is_public: boolean;
          battle_id: string | null;
          is_flagged: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cloudflare_video_id: string;
          thumbnail_url?: string | null;
          sound_id?: string | null;
          hashtags?: string[] | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          share_count?: number;
          is_public?: boolean;
          battle_id?: string | null;
          is_flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          cloudflare_video_id?: string;
          thumbnail_url?: string | null;
          sound_id?: string | null;
          hashtags?: string[] | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          share_count?: number;
          is_public?: boolean;
          battle_id?: string | null;
          is_flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          username: string;
          avatar_url: string;
          bio: string;
          followers_count: number;
          following_count: number;
          videos_count: number;
          battles_won: number;
          battles_lost: number;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string;
          bio?: string;
          followers_count?: number;
          following_count?: number;
          videos_count?: number;
          battles_won?: number;
          battles_lost?: number;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string;
          bio?: string;
          followers_count?: number;
          following_count?: number;
          videos_count?: number;
          battles_won?: number;
          battles_lost?: number;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};