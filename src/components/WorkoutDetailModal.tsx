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
  const colorClass = INTENSITY_COLORS[workout.intensity];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between">
          <div className={`${colorClass} text-white p-3 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
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
                {INTENSITY_LABELS[workout.intensity as any]}
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition text-sm"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition disabled:opacity-50 text-sm"
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
