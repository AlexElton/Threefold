/*
  # Create Threefold Training Schema

  ## Overview
  This migration sets up the database schema for Threefold, a triathlon training platform
  with AI-powered workout generation and volume-based planning.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `current_ctl` (numeric) - Chronic Training Load
  - `current_atl` (numeric) - Acute Training Load
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `workouts`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `date` (date) - Scheduled date for the workout
  - `discipline` (text) - swim, bike, run, strength
  - `intensity` (text) - endurance, threshold, intervals, recovery
  - `duration_minutes` (integer)
  - `tss` (numeric) - Training Stress Score
  - `distance_km` (numeric, optional)
  - `completed` (boolean)
  - `actual_duration_minutes` (integer, nullable)
  - `actual_tss` (numeric, nullable)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `workout_blocks`
  - `id` (uuid, primary key)
  - `workout_id` (uuid, references workouts)
  - `order` (integer) - Position in the workout sequence
  - `name` (text) - e.g., "Warm-up", "Main Set", "Cool-down"
  - `duration_minutes` (integer)
  - `intensity` (text)
  - `description` (text)
  - `created_at` (timestamptz)

  ### `weekly_stats`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `week_start_date` (date)
  - `total_duration_minutes` (integer)
  - `total_distance_km` (numeric)
  - `total_tss` (numeric)
  - `ctl` (numeric) - Chronic Training Load at end of week
  - `atl` (numeric) - Acute Training Load at end of week
  - `tsb` (numeric) - Training Stress Balance
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  current_ctl numeric DEFAULT 0,
  current_atl numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  discipline text NOT NULL CHECK (discipline IN ('swim', 'bike', 'run', 'strength')),
  intensity text NOT NULL CHECK (intensity IN ('technique', 'endurance', 'threshold', 'intervals', 'recovery', 'upper_body', 'lower_body', 'core')),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  tss numeric NOT NULL DEFAULT 0 CHECK (tss >= 0),
  distance_km numeric CHECK (distance_km >= 0),
  completed boolean DEFAULT false,
  actual_duration_minutes integer CHECK (actual_duration_minutes > 0),
  actual_tss numeric CHECK (actual_tss >= 0),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create workout_blocks table
CREATE TABLE IF NOT EXISTS workout_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" >= 0),
  name text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  intensity text NOT NULL CHECK (intensity IN ('endurance', 'threshold', 'intervals', 'recovery')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout blocks"
  ON workout_blocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_blocks.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout blocks"
  ON workout_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_blocks.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout blocks"
  ON workout_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_blocks.workout_id
      AND workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_blocks.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout blocks"
  ON workout_blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_blocks.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- Create weekly_stats table
CREATE TABLE IF NOT EXISTS weekly_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  total_duration_minutes integer DEFAULT 0,
  total_distance_km numeric DEFAULT 0,
  total_tss numeric DEFAULT 0,
  ctl numeric DEFAULT 0,
  atl numeric DEFAULT 0,
  tsb numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly stats"
  ON weekly_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly stats"
  ON weekly_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly stats"
  ON weekly_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly stats"
  ON weekly_stats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_blocks_workout_order ON workout_blocks(workout_id, "order");
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON weekly_stats(user_id, week_start_date);
