import { X, Pencil, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import { Workout, INTENSITY_LABELS, DISCIPLINE_LABELS } from '../types';
import { Bike, Droplets, Footprints, Dumbbell } from 'lucide-react';

interface WorkoutDetailModalProps {
  isOpen: boolean;
  workout: Workout | null;
  onClose: () => void;
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
  isDeleting: boolean;
}

const DISCIPLINE_ICONS = {
  swim: Droplets,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
};

const DISCIPLINE_HEADER: Record<string, string> = {
  swim:     'bg-blue-600 text-white',
  bike:     'bg-yellow-500 text-slate-900',
  run:      'bg-green-600 text-white',
  strength: 'bg-slate-500 text-white',
};

const DISCIPLINE_BORDER_TOP: Record<string, string> = {
  swim:     'border-t-4 border-blue-600',
  bike:     'border-t-4 border-yellow-500',
  run:      'border-t-4 border-green-600',
  strength: 'border-t-4 border-slate-500',
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 p-2 flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

export function WorkoutDetailModal({
  isOpen,
  workout,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: WorkoutDetailModalProps) {
  if (!isOpen || !workout) return null;

  const Icon = DISCIPLINE_ICONS[workout.discipline];
  const headerColor = DISCIPLINE_HEADER[workout.discipline] ?? 'bg-slate-500 text-white';
  const borderTop = DISCIPLINE_BORDER_TOP[workout.discipline] ?? 'border-t-4 border-slate-500';
  const hasStrava = !!workout.strava_activity_id;

  const formatSpeed = (ms: number) => `${(ms * 3.6).toFixed(1)} km/h`;
  const formatPace = (ms: number) => {
    const secsPerKm = 1000 / ms;
    const mins = Math.floor(secsPerKm / 60);
    const secs = Math.round(secsPerKm % 60);
    return `${mins}:${String(secs).padStart(2, '0')} /km`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 p-4">
      <div className={`bg-white ${borderTop} shadow-sm w-full max-w-sm`}>
        {/* Colored header */}
        <div className={`${headerColor} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="font-bold text-base">{DISCIPLINE_LABELS[workout.discipline]}</span>
            {hasStrava && (
              <span className="text-[11px] font-semibold opacity-80 bg-white/20 px-1.5 py-0.5">
                via Strava
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 bg-white/20 hover:bg-white/30 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* ── Strava Activity Section ─────────────────────────────────── */}
          {hasStrava && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Activity (via Strava)
                </span>
              </div>
              {workout.strava_name && (
                <p className="text-sm font-semibold text-slate-800 mb-2">{workout.strava_name}</p>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {workout.actual_duration_minutes != null && (
                  <StatTile label="Duration" value={`${workout.actual_duration_minutes} min`} />
                )}
                {workout.actual_tss != null && (
                  <StatTile label="TSS" value={`${workout.actual_tss}`} />
                )}
                {workout.strava_avg_hr != null && (
                  <StatTile label="Avg HR" value={`${Math.round(workout.strava_avg_hr)} bpm`} />
                )}
                {workout.strava_max_hr != null && (
                  <StatTile label="Max HR" value={`${Math.round(workout.strava_max_hr)} bpm`} />
                )}
                {workout.strava_avg_watts != null && (
                  <StatTile label="Avg Power" value={`${Math.round(workout.strava_avg_watts)} W`} />
                )}
                {workout.strava_elev_gain != null && (
                  <StatTile label="Elevation" value={`${Math.round(workout.strava_elev_gain)} m`} />
                )}
                {workout.strava_avg_speed_ms != null && workout.discipline !== 'run' && (
                  <StatTile label="Avg Speed" value={formatSpeed(workout.strava_avg_speed_ms)} />
                )}
                {workout.strava_avg_speed_ms != null && workout.discipline === 'run' && (
                  <StatTile label="Pace" value={formatPace(workout.strava_avg_speed_ms)} />
                )}
                {workout.distance_km != null && (
                  <StatTile label="Distance" value={`${workout.distance_km.toFixed(1)} km`} />
                )}
              </div>
            </div>
          )}

          {/* ── Plan Section ────────────────────────────────────────────── */}
          <div>
            {hasStrava && (
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Plan
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <StatTile label="Effort" value={INTENSITY_LABELS[workout.intensity]} />
              <StatTile label="Planned Duration" value={`${workout.duration_minutes} min`} />
              <StatTile label="Planned TSS" value={`${workout.tss}`} />
              {!hasStrava && workout.distance_km != null && (
                <StatTile label="Distance" value={`${workout.distance_km.toFixed(1)} km`} />
              )}
            </div>
            {workout.notes && (
              <div className="mt-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Notes
                </div>
                <p className="text-sm text-slate-600">{workout.notes}</p>
              </div>
            )}
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                onEdit(workout);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium transition text-sm"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(workout);
                onClose();
              }}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium transition disabled:opacity-50 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

