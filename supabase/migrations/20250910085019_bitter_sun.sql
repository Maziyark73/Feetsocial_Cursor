/*
  # Create live streams table

  1. New Tables
    - `live_streams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `cloudflare_live_input_id` (text, unique)
      - `title` (text, required)
      - `description` (text, optional)
      - `rtmp_url` (text, required)
      - `stream_key` (text, required)
      - `playback_url` (text, required)
      - `is_active` (boolean, default true)
      - `viewer_count` (integer, default 0)
      - `started_at` (timestamp, default now)
      - `ended_at` (timestamp, optional)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `live_streams` table
    - Add policies for authenticated users to manage their own streams
    - Add policy for public read access to active streams

  3. Indexes
    - Index on user_id for efficient user stream queries
    - Index on is_active for finding active streams
    - Index on created_at for chronological ordering
*/

-- Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cloudflare_live_input_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  rtmp_url text NOT NULL,
  stream_key text NOT NULL,
  playback_url text NOT NULL,
  is_active boolean DEFAULT true,
  viewer_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON live_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_cloudflare_id ON live_streams(cloudflare_live_input_id);

-- RLS Policies

-- Users can create their own live streams
CREATE POLICY "Users can create own live streams"
  ON live_streams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own live streams
CREATE POLICY "Users can read own live streams"
  ON live_streams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own live streams
CREATE POLICY "Users can update own live streams"
  ON live_streams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own live streams
CREATE POLICY "Users can delete own live streams"
  ON live_streams
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can read active live streams (for discovery)
CREATE POLICY "Public can read active live streams"
  ON live_streams
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_live_streams_updated_at();