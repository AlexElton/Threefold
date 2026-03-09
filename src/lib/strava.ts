import { supabase } from './supabase';
import type { Discipline, Intensity } from '../types';

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string;
const STRAVA_CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET as string;

// Throttle automatic syncs: once per hour on normal page loads
const SYNC_THROTTLE_MS = 60 * 60 * 1000;

export interface StravaConnection {
  id: string;
  user_id: string;
  athlete_id: number;
  athlete_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Returns the Strava OAuth authorization URL. Redirects back to the current page origin. */
export function getStravaAuthUrl(): string {
  const redirectUri = window.location.origin + '/';
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

/** Exchanges the authorization code for tokens and persists the connection in Supabase. */
export async function exchangeStravaCode(code: string, userId: string): Promise<StravaConnection> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava token exchange failed: ${err}`);
  }

  const data = await res.json();
  const athleteName =
    [data.athlete?.firstname, data.athlete?.lastname].filter(Boolean).join(' ') || null;

  const { data: upserted, error } = await supabase
    .from('strava_connections')
    .upsert(
      {
        user_id: userId,
        athlete_id: data.athlete.id,
        athlete_name: athleteName,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save Strava connection: ${error.message}`);
  return upserted as StravaConnection;
}

/** Returns a valid access token, refreshing it in the DB if it has expired. */
async function getValidAccessToken(connection: StravaConnection): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (connection.expires_at > now + 300) {
    return connection.access_token;
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Failed to refresh Strava token');

  const data = await res.json();
  await supabase
    .from('strava_connections')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', connection.user_id);

  return data.access_token;
}

function mapSportTypeToDiscipline(sportType: string): Discipline | null {
  const map: Record<string, Discipline> = {
    Run: 'run',
    VirtualRun: 'run',
    TrailRun: 'run',
    Ride: 'bike',
    VirtualRide: 'bike',
    EBikeRide: 'bike',
    GravelRide: 'bike',
    MountainBikeRide: 'bike',
    Swim: 'swim',
    OpenWaterSwim: 'swim',
    WeightTraining: 'strength',
    Workout: 'strength',
    Yoga: 'strength',
    Crossfit: 'strength',
    Pilates: 'strength',
  };
  return map[sportType] ?? null;
}

function estimateIntensity(avgHR: number | undefined, discipline: Discipline): Intensity {
  if (discipline === 'strength') return 'lower_body';
  if (avgHR) {
    const pct = avgHR / 190; // assume 190 bpm max HR
    if (pct < 0.65) return 'recovery';
    if (pct < 0.78) return 'endurance';
    if (pct < 0.88) return 'threshold';
    return 'intervals';
  }
  return 'endurance';
}

function estimateTSS(
  movingTime: number,
  avgHR: number | undefined,
  discipline: Discipline,
): number {
  const hours = movingTime / 3600;
  if (avgHR) {
    const thresholdHR = 190 * 0.85;
    const intensityFactor = Math.min(avgHR / thresholdHR, 1.3);
    return Math.round(hours * intensityFactor * intensityFactor * 65);
  }
  const rateByDiscipline: Record<Discipline, number> = {
    swim: 60,
    bike: 55,
    run: 65,
    strength: 40,
  };
  return Math.round(hours * (rateByDiscipline[discipline] ?? 55));
}

/**
 * Extracts all relevant fields from a raw Strava activity object.
 * Returns a partial workout payload ready for upsert/insert.
 */
function extractStravaFields(
  activity: Record<string, unknown>,
  discipline: Discipline,
  userId: string,
  date: string,
) {
  const movingTime = (activity.moving_time as number) ?? 0;
  const avgHR = activity.average_heartrate as number | undefined;
  const maxHR = activity.max_heartrate as number | undefined;
  const avgWatts = activity.average_watts as number | undefined;
  const elevGain = activity.total_elevation_gain as number | undefined;
  const avgSpeed = activity.average_speed as number | undefined;
  const tss = estimateTSS(movingTime, avgHR, discipline);

  return {
    user_id: userId,
    date,
    actual_duration_minutes: Math.max(1, Math.round(movingTime / 60)),
    actual_tss: tss,
    distance_km: activity.distance
      ? Math.round(((activity.distance as number) / 1000) * 100) / 100
      : null,
    notes: (activity.name as string) ?? '',
    strava_activity_id: activity.id as number,
    strava_name: (activity.name as string) ?? null,
    strava_avg_hr: avgHR ?? null,
    strava_max_hr: maxHR ?? null,
    strava_avg_watts: avgWatts ?? null,
    strava_elev_gain: elevGain ?? null,
    strava_avg_speed_ms: avgSpeed ?? null,
    intensity: estimateIntensity(avgHR, discipline),
  };
}

/** Loads the user's Strava connection from Supabase, or null if not connected. */
export async function getStravaConnection(userId: string): Promise<StravaConnection | null> {
  const { data } = await supabase
    .from('strava_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as StravaConnection | null;
}

/** Returns true if the connection hasn't been synced in the past hour. */
export function stravaConnectionNeedsSync(connection: StravaConnection): boolean {
  if (!connection.last_synced_at) return true;
  return Date.now() - new Date(connection.last_synced_at).getTime() > SYNC_THROTTLE_MS;
}

/**
 * Fetches activities from the last 3 months and:
 * 1. If a planned (incomplete) workout exists on the same day + discipline, updates it in place.
 * 2. Otherwise inserts a new completed workout row.
 * 3. Runs a retroactive cleanup to remove orphaned planned rows that previously
 *    ended up duplicated alongside a separately-inserted Strava row.
 *
 * Pass `force = true` to bypass the 1-hour throttle.
 * Returns the number of newly imported activities.
 */
export async function syncStravaActivities(
  userId: string,
  connection: StravaConnection,
  force = false,
): Promise<number> {
  if (!force && !stravaConnectionNeedsSync(connection)) return 0;

  const accessToken = await getValidAccessToken(connection);
  const threeMonthsAgoMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const threeMonthsAgoUnix = Math.floor(threeMonthsAgoMs / 1000);
  const threeMonthsAgoDate = new Date(threeMonthsAgoMs).toISOString().split('T')[0];

  // ── 1. Fetch all Strava activities in date range ──────────────────────────
  let page = 1;
  const allActivities: Record<string, unknown>[] = [];

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${threeMonthsAgoUnix}&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error('Failed to fetch Strava activities');
    const activities = (await res.json()) as Record<string, unknown>[];
    if (!activities.length) break;
    allActivities.push(...activities);
    if (activities.length < 100) break;
    page++;
  }

  const supported = allActivities.filter(a =>
    mapSportTypeToDiscipline(((a.sport_type ?? a.type) as string) ?? ''),
  );

  // ── 2. Skip already-imported IDs ─────────────────────────────────────────
  const { data: existing } = await supabase
    .from('workouts')
    .select('strava_activity_id')
    .eq('user_id', userId)
    .not('strava_activity_id', 'is', null);

  const existingIds = new Set((existing ?? []).map(w => w.strava_activity_id as number));
  const newActivities = supported.filter(a => !existingIds.has(a.id as number));

  // ── 3. Build planned-workout lookup (date|discipline → workout id) ────────
  const { data: plannedWorkouts } = await supabase
    .from('workouts')
    .select('id, date, discipline')
    .eq('user_id', userId)
    .eq('completed', false)
    .gte('date', threeMonthsAgoDate);

  // Only keep the first planned entry per date+discipline slot
  const plannedMap = new Map<string, string>();
  for (const pw of plannedWorkouts ?? []) {
    const key = `${pw.date}|${pw.discipline}`;
    if (!plannedMap.has(key)) plannedMap.set(key, pw.id);
  }

  // ── 4. Import each new activity ───────────────────────────────────────────
  let importedCount = 0;

  for (const activity of newActivities) {
    const sportType = ((activity.sport_type ?? activity.type) as string) ?? '';
    const discipline = mapSportTypeToDiscipline(sportType)!;
    const date = (activity.start_date_local as string).split('T')[0];
    const fields = extractStravaFields(activity, discipline, userId, date);

    const key = `${date}|${discipline}`;
    const matchedId = plannedMap.get(key);

    if (matchedId) {
      // Update the planned row in place → it becomes the completed workout
      await supabase
        .from('workouts')
        .update({
          completed: true,
          actual_duration_minutes: fields.actual_duration_minutes,
          actual_tss: fields.actual_tss,
          distance_km: fields.distance_km,
          strava_activity_id: fields.strava_activity_id,
          strava_name: fields.strava_name,
          strava_avg_hr: fields.strava_avg_hr,
          strava_max_hr: fields.strava_max_hr,
          strava_avg_watts: fields.strava_avg_watts,
          strava_elev_gain: fields.strava_elev_gain,
          strava_avg_speed_ms: fields.strava_avg_speed_ms,
        })
        .eq('id', matchedId);

      // Remove slot so a second activity on the same day doesn't reuse it
      plannedMap.delete(key);
    } else {
      // No matching plan → insert as a standalone completed workout
      await supabase.from('workouts').insert({
        user_id: userId,
        date,
        discipline,
        intensity: fields.intensity,
        duration_minutes: fields.actual_duration_minutes ?? 1,
        tss: fields.actual_tss ?? 0,
        distance_km: fields.distance_km,
        completed: true,
        actual_duration_minutes: fields.actual_duration_minutes,
        actual_tss: fields.actual_tss,
        notes: fields.notes,
        strava_activity_id: fields.strava_activity_id,
        strava_name: fields.strava_name,
        strava_avg_hr: fields.strava_avg_hr,
        strava_max_hr: fields.strava_max_hr,
        strava_avg_watts: fields.strava_avg_watts,
        strava_elev_gain: fields.strava_elev_gain,
        strava_avg_speed_ms: fields.strava_avg_speed_ms,
      });
    }

    importedCount++;
  }

  // ── 5. Retroactive cleanup ────────────────────────────────────────────────
  // Remove orphaned planned rows where a separate Strava completion row already
  // exists for the same date + discipline (can happen from a previous sync that
  // used the old insert-only logic).
  const { data: stravaRows } = await supabase
    .from('workouts')
    .select('date, discipline')
    .eq('user_id', userId)
    .not('strava_activity_id', 'is', null)
    .gte('date', threeMonthsAgoDate);

  if (stravaRows && stravaRows.length > 0) {
    const stravaKeys = new Set(stravaRows.map(r => `${r.date}|${r.discipline}`));

    const { data: orphaned } = await supabase
      .from('workouts')
      .select('id, date, discipline')
      .eq('user_id', userId)
      .eq('completed', false)
      .is('strava_activity_id', null)
      .gte('date', threeMonthsAgoDate);

    const toDelete = (orphaned ?? [])
      .filter(w => stravaKeys.has(`${w.date}|${w.discipline}`))
      .map(w => w.id);

    if (toDelete.length > 0) {
      await supabase.from('workouts').delete().in('id', toDelete);
    }
  }

  // ── 6. Update last-synced timestamp ──────────────────────────────────────
  await supabase
    .from('strava_connections')
    .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return importedCount;
}

/** Removes the user's Strava connection from Supabase (does not revoke the Strava token). */
export async function disconnectStrava(userId: string): Promise<void> {
  await supabase.from('strava_connections').delete().eq('user_id', userId);
}
