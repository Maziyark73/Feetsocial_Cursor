import { supabase } from './supabase';
import { LiveInputResponse, LiveStream } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('Missing Supabase URL environment variable');
}

export async function createLiveInput(title: string, description?: string): Promise<LiveInputResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-live-input`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create live input: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating live input:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function saveLiveStreamToDatabase(
  userId: string,
  liveInputData: NonNullable<LiveInputResponse['liveInput']>,
  title: string,
  description?: string
): Promise<LiveStream | null> {
  try {
    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        user_id: userId,
        cloudflare_live_input_id: liveInputData.id,
        title,
        description,
        rtmp_url: liveInputData.rtmpUrl,
        stream_key: liveInputData.streamKey,
        playback_url: liveInputData.playbackUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving live stream to database:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving live stream to database:', error);
    return null;
  }
}

export async function endLiveStream(liveStreamId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('live_streams')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', liveStreamId);

    if (error) {
      console.error('Error ending live stream:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ending live stream:', error);
    return false;
  }
}

export async function getActiveLiveStreams(): Promise<LiveStream[]> {
  try {
    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        user:users(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active live streams:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching active live streams:', error);
    return [];
  }
}

export async function getUserLiveStreams(userId: string): Promise<LiveStream[]> {
  try {
    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        user:users(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user live streams:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user live streams:', error);
    return [];
  }
}