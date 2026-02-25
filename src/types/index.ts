export type Discipline = 'swim' | 'bike' | 'run' | 'strength';
export type SwimIntensity = 'technique' | 'endurance' | 'intervals';
export type BikeIntensity = 'endurance' | 'threshold' | 'intervals' | 'recovery';
export type RunIntensity = 'endurance' | 'threshold' | 'intervals' | 'recovery';
export type StrengthIntensity = 'upper_body' | 'lower_body' | 'core';
export type Intensity = SwimIntensity | BikeIntensity | RunIntensity | StrengthIntensity;

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  discipline: Discipline;
  intensity: Intensity;
  duration_minutes: number;
  tss: number;
  distance_km: number | null;
  completed: boolean;
  actual_duration_minutes: number | null;
  actual_tss: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutBlock {
  id: string;
  workout_id: string;
  order: number;
  name: string;
  duration_minutes: number;
  intensity: Intensity;
  description: string;
  created_at: string;
}

export interface WeeklyStats {
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
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  current_ctl: number;
  current_atl: number;
  created_at: string;
  updated_at: string;
}

export const INTENSITY_COLORS: Record<Intensity, string> = {
  endurance: 'bg-blue-500',
  threshold: 'bg-emerald-500',
  intervals: 'bg-orange-500',
  recovery: 'bg-slate-400',
  technique: 'bg-blue-600',
  upper_body: 'bg-rose-500',
  lower_body: 'bg-amber-500',
  core: 'bg-purple-500',
};

export const INTENSITY_BORDER_COLORS: Record<Intensity, string> = {
  endurance: 'border-blue-500',
  threshold: 'border-emerald-500',
  intervals: 'border-orange-500',
  recovery: 'border-slate-400',
  technique: 'border-blue-600',
  upper_body: 'border-rose-500',
  lower_body: 'border-amber-500',
  core: 'border-purple-500',
};

export const INTENSITY_TEXT_COLORS: Record<Intensity, string> = {
  endurance: 'text-blue-700',
  threshold: 'text-emerald-700',
  intervals: 'text-orange-700',
  recovery: 'text-slate-700',
  technique: 'text-blue-700',
  upper_body: 'text-rose-700',
  lower_body: 'text-amber-700',
  core: 'text-purple-700',
};

export const DISCIPLINE_LABELS = {
  swim: 'Swim',
  bike: 'Bike',
  run: 'Run',
  strength: 'Strength',
};

export const INTENSITY_LABELS: Record<Intensity, string> = {
  endurance: 'Endurance',
  threshold: 'Threshold',
  intervals: 'Intervals',
  recovery: 'Recovery',
  technique: 'Technique',
  upper_body: 'Upper Body',
  lower_body: 'Lower Body',
  core: 'Core',
};

export const DISCIPLINE_INTENSITY_MAP: Record<Discipline, Intensity[]> = {
  swim: ['technique', 'endurance', 'intervals'],
  bike: ['endurance', 'threshold', 'intervals', 'recovery'],
  run: ['endurance', 'threshold', 'intervals', 'recovery'],
  strength: ['upper_body', 'lower_body', 'core'],
};
