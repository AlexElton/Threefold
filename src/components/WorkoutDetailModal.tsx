import { X, Pencil, Trash2 } from 'lucide-react';
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

type TableRow = { label: string; planned: string | null; completed: string | null };

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

  // Build comparison table rows
  const tableRows: TableRow[] = [
    {
      label: 'Duration',
      planned: `${workout.duration_minutes} min`,
      completed: workout.actual_duration_minutes != null ? `${workout.actual_duration_minutes} min` : null,
    },
    {
      label: 'TSS',
      planned: `${workout.tss}`,
      completed: workout.actual_tss != null ? `${workout.actual_tss}` : null,
    },
    {
      label: 'Effort',
      planned: INTENSITY_LABELS[workout.intensity],
      completed: null,
    },
  ];

  if (hasStrava && workout.distance_km != null)
    tableRows.push({ label: 'Distance', planned: null, completed: `${workout.distance_km.toFixed(1)} km` });

  if (workout.strava_avg_speed_ms != null)
    tableRows.push({
      label: workout.discipline === 'run' ? 'Pace' : 'Avg Speed',
      planned: null,
      completed: workout.discipline === 'run'
        ? formatPace(workout.strava_avg_speed_ms)
        : formatSpeed(workout.strava_avg_speed_ms),
    });

  if (workout.strava_avg_hr != null)
    tableRows.push({ label: 'Avg HR', planned: null, completed: `${Math.round(workout.strava_avg_hr)} bpm` });

  if (workout.strava_max_hr != null)
    tableRows.push({ label: 'Max HR', planned: null, completed: `${Math.round(workout.strava_max_hr)} bpm` });

  if (workout.strava_avg_watts != null)
    tableRows.push({ label: 'Avg Power', planned: null, completed: `${Math.round(workout.strava_avg_watts)} W` });

  if (workout.strava_elev_gain != null)
    tableRows.push({ label: 'Elevation', planned: null, completed: `${Math.round(workout.strava_elev_gain)} m` });

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 p-4">
      <div className={`bg-white ${borderTop} shadow-sm w-full max-w-2xl`}>
        {/* Colored header */}
        <div className={`${headerColor} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 shrink-0" />
            <span className="font-bold text-base shrink-0">{DISCIPLINE_LABELS[workout.discipline]}</span>
            {workout.strava_name && (
              <span className="text-sm font-semibold opacity-90 truncate">
                — {workout.strava_name}
              </span>
            )}
            {hasStrava && (
              <span className="text-[11px] font-semibold opacity-80 bg-white/20 px-1.5 py-0.5 shrink-0">
                via Strava
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 bg-white/20 hover:bg-white/30 transition shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {hasStrava ? (
            /* ── Strava layout: comparison table left, map/notes/actions right ── */
            <div className="grid grid-cols-[3fr_2fr] gap-4">

              {/* ── Left: Planned vs Completed table ──────────────────── */}
              <div className="border border-slate-200 overflow-hidden self-start">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_1fr] bg-slate-50 border-b border-slate-200">
                  <div className="px-3 py-2" />
                  <div className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 border-l border-slate-200">
                    Planned
                  </div>
                  <div className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-green-600 border-l border-slate-200">
                    Completed
                  </div>
                </div>
                {/* Data rows */}
                {tableRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1fr_1fr_1fr] border-b border-slate-100 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 flex items-center">
                      {row.label}
                    </div>
                    <div className="px-3 py-2 text-sm font-semibold text-slate-800 border-l border-slate-100 text-center flex items-center justify-center">
                      {row.planned ?? <span className="text-slate-300 font-normal">—</span>}
                    </div>
                    <div className="px-3 py-2 text-sm font-semibold text-slate-800 border-l border-slate-100 text-center flex items-center justify-center">
                      {row.completed ?? <span className="text-slate-300 font-normal">—</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Right: Map + Notes + Actions ──────────────────────── */}
              <div className="flex flex-col gap-3">
                {/* Map placeholder */}
                <div className="bg-slate-100 border border-slate-200 h-36 flex items-center justify-center text-slate-400 text-xs font-medium shrink-0">
                  Map coming soon
                </div>

                {/* Notes */}
                {workout.notes && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Notes
                    </div>
                    <p className="text-sm text-slate-600">{workout.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => { onEdit(workout); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium transition text-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(workout); onClose(); }}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium transition disabled:opacity-50 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Plan-only layout ─────────────────────────────────────── */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1.5">
                <StatTile label="Effort" value={INTENSITY_LABELS[workout.intensity]} />
                <StatTile label="Duration" value={`${workout.duration_minutes} min`} />
                <StatTile label="TSS" value={`${workout.tss}`} />
                {workout.distance_km != null && (
                  <StatTile label="Distance" value={`${workout.distance_km.toFixed(1)} km`} />
                )}
              </div>
              {workout.notes && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Notes
                  </div>
                  <p className="text-sm text-slate-600">{workout.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { onEdit(workout); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium transition text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(workout); onClose(); }}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium transition disabled:opacity-50 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

