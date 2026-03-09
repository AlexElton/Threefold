import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          current_ctl: number;
          current_atl: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          current_ctl?: number;
          current_atl?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          current_ctl?: number;
          current_atl?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          discipline: 'swim' | 'bike' | 'run' | 'strength' | 'brick';
          intensity: 'endurance' | 'threshold' | 'intervals' | 'recovery';
          duration_minutes: number;
          tss: number;
          distance_km: number | null;
          completed: boolean;
          actual_duration_minutes: number | null;
          actual_tss: number | null;
          notes: string;
          strava_activity_id: number | null;
          strava_name: string | null;
          strava_avg_hr: number | null;
          strava_max_hr: number | null;
          strava_avg_watts: number | null;
          strava_elev_gain: number | null;
          strava_avg_speed_ms: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          discipline: 'swim' | 'bike' | 'run' | 'strength' | 'brick';
          intensity: 'endurance' | 'threshold' | 'intervals' | 'recovery';
          duration_minutes: number;
          tss?: number;
          distance_km?: number | null;
          completed?: boolean;
          actual_duration_minutes?: number | null;
          actual_tss?: number | null;
          notes?: string;
          strava_activity_id?: number | null;
          strava_name?: string | null;
          strava_avg_hr?: number | null;
          strava_max_hr?: number | null;
          strava_avg_watts?: number | null;
          strava_elev_gain?: number | null;
          strava_avg_speed_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          discipline?: 'swim' | 'bike' | 'run' | 'strength' | 'brick';
          intensity?: 'endurance' | 'threshold' | 'intervals' | 'recovery';
          duration_minutes?: number;
          tss?: number;
          distance_km?: number | null;
          completed?: boolean;
          actual_duration_minutes?: number | null;
          actual_tss?: number | null;
          notes?: string;
          strava_activity_id?: number | null;
          strava_name?: string | null;
          strava_avg_hr?: number | null;
          strava_max_hr?: number | null;
          strava_avg_watts?: number | null;
          strava_elev_gain?: number | null;
          strava_avg_speed_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_blocks: {
        Row: {
          id: string;
          workout_id: string;
          order: number;
          name: string;
          duration_minutes: number;
          intensity: 'endurance' | 'threshold' | 'intervals' | 'recovery';
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          order: number;
          name: string;
          duration_minutes: number;
          intensity: 'endurance' | 'threshold' | 'intervals' | 'recovery';
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          order?: number;
          name?: string;
          duration_minutes?: number;
          intensity?: 'endurance' | 'threshold' | 'intervals' | 'recovery';
          description?: string;
          created_at?: string;
        };
      };
      weekly_stats: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          total_duration_minutes: number;
          total_distance_km: number;
          total_tss: number;
          ctl: number;
          atl: number;
          tsb: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          total_duration_minutes?: number;
          total_distance_km?: number;
          total_tss?: number;
          ctl?: number;
          atl?: number;
          tsb?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          total_duration_minutes?: number;
          total_distance_km?: number;
          total_tss?: number;
          ctl?: number;
          atl?: number;
          tsb?: number;
          created_at?: string;
        };
      };
      strava_connections: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          athlete_id: number;
          athlete_name?: string | null;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          athlete_id?: number;
          athlete_name?: string | null;
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
