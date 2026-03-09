ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_name text;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_avg_hr numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_max_hr numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_avg_watts numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_elev_gain numeric;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS strava_avg_speed_ms numeric;
