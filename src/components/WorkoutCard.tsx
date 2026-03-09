import { Bike, Droplets, Footprints, Dumbbell, CheckCircle2 } from 'lucide-react';
import { Workout, Discipline } from '../types';

interface WorkoutCardProps {
  workout: Workout;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onClick: () => void;
}

const DISCIPLINE_ICONS: Record<Discipline, React.ComponentType<{ className?: string }>> = {
  swim: Droplets,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
};

// Completed chip: colored left border accent + light tinted background
const COMPLETED_CHIP: Record<Discipline, string> = {
  swim:     'border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50',
  bike:     'border border-yellow-100 border-l-4 border-l-yellow-500 bg-yellow-50',
  run:      'border border-green-100 border-l-4 border-l-green-600 bg-green-50',
  strength: 'border border-slate-200 border-l-4 border-l-slate-500 bg-slate-100',
};

const COMPLETED_ICON: Record<Discipline, string> = {
  swim:     'text-blue-600',
  bike:     'text-yellow-700',
  run:      'text-green-700',
  strength: 'text-slate-600',
};

const COMPLETED_CHECK: Record<Discipline, string> = {
  swim:     'text-blue-500',
  bike:     'text-yellow-600',
  run:      'text-green-600',
  strength: 'text-slate-500',
};

export function WorkoutCard({
  workout,
  onDragStart,
  onDragEnd,
  isDragging,
  onClick,
}: WorkoutCardProps) {
  const Icon = DISCIPLINE_ICONS[workout.discipline];

  if (workout.completed) {
    const displayName = workout.strava_name ?? workout.discipline;
    const displayDuration = workout.actual_duration_minutes ?? workout.duration_minutes;

    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`${COMPLETED_CHIP[workout.discipline]} p-2 cursor-pointer hover:opacity-90 transition ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-start gap-1.5">
          <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${COMPLETED_ICON[workout.discipline]}`} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate leading-tight capitalize">
              {displayName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
              <span>{displayDuration} min</span>
              {workout.strava_avg_hr != null && (
                <span>· {Math.round(workout.strava_avg_hr)} bpm</span>
              )}
            </div>
          </div>
          <CheckCircle2 className={`w-3 h-3 flex-shrink-0 mt-0.5 ${COMPLETED_CHECK[workout.discipline]}`} />
        </div>
      </div>
    );
  }

  // Planned chip: white bg, dashed grey border, muted text
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`border border-dashed border-slate-300 bg-white p-2 cursor-pointer hover:bg-slate-50 transition ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <Icon className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-500 capitalize leading-tight">
            {workout.discipline}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{workout.duration_minutes} min</div>
        </div>
      </div>
    </div>
  );
}
