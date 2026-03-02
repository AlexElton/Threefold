import { X, Pencil, Trash2 } from 'lucide-react';
import { Workout, INTENSITY_LABELS, DISCIPLINE_LABELS, INTENSITY_COLORS } from '../types';
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
  const colorClass = (() => {
    if (workout.discipline === 'strength') {
      return 'bg-slate-200 text-slate-700 border border-slate-300';
    }

    if (workout.discipline === 'swim') {
      return 'bg-blue-600 text-white';
    }

    if (workout.intensity === 'recovery') {
      return 'bg-slate-500 text-white';
    }

    if (workout.intensity === 'endurance') {
      return 'bg-green-600 text-white';
    }

    return `${INTENSITY_COLORS[workout.intensity]} text-white`;
  })();

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 shadow-sm w-full max-w-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between">
          <div className={`${colorClass} p-3`}>
            <Icon className="w-6 h-6" />
          </div>
          <button onClick={onClose} className="p-1 border border-slate-300 hover:border-slate-400">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Workout Type
            </div>
            <div className="text-xl font-bold text-slate-900">
              {DISCIPLINE_LABELS[workout.discipline]}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Effort
              </div>
              <div className="text-lg font-bold text-slate-900">
                {INTENSITY_LABELS[workout.intensity]}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Duration
              </div>
              <div className="text-lg font-bold text-slate-900">
                {workout.duration_minutes} min
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Training Stress
            </div>
            <div className="text-lg font-bold text-slate-900">{workout.tss} TSS</div>
          </div>

          {workout.distance_km && (
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Distance
              </div>
              <div className="text-lg font-bold text-slate-900">
                {workout.distance_km.toFixed(1)} km
              </div>
            </div>
          )}

          {workout.notes && (
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Notes
              </div>
              <div className="text-slate-700">{workout.notes}</div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
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
