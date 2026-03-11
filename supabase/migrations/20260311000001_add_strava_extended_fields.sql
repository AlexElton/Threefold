-- Extended Strava fields for richer per-sport display
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_elapsed_seconds integer;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_suffer_score integer;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_calories integer;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_cadence numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_max_speed_ms numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_weighted_avg_watts numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_max_watts numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_kilojoules integer;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_device_watts boolean;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_pool_length numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_polyline text;
