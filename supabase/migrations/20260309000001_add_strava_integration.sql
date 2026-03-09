/*
  # Add Strava Integration

  ## New Tables
  
  ### `strava_connections`
  - `id` (uuid, primary key)
  - `user_id` (uuid, unique, references profiles)
  - `athlete_id` (bigint) - Strava athlete ID
  - `athlete_name` (text) - Athlete's display name
  - `access_token` (text) - OAuth access token
  - `refresh_token` (text) - OAuth refresh token
  - `expires_at` (bigint) - Token expiry as Unix timestamp
  - `last_synced_at` (timestamptz) - When activities were last imported
  - `created_at` / `updated_at`

  ## Schema Changes

  ### `workouts`
  - Add `strava_activity_id` (bigint, nullable) to track imported activities
    and prevent duplicate imports.
*/

-- Create strava_connections table
CREATE TABLE IF NOT EXISTS strava_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id bigint NOT NULL,
  athlete_name text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at bigint NOT NULL,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Strava connection"
  ON strava_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Strava connection"
  ON strava_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Strava connection"
  ON strava_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Strava connection"
  ON strava_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Track which workouts were imported from Strava to prevent duplicates
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_activity_id bigint;

-- Index for efficient duplicate-detection queries
CREATE INDEX IF NOT EXISTS idx_workouts_strava_activity
  ON workouts(user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;
