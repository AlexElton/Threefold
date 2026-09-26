import { Bike, Droplets, Footprints, Dumbbell } from 'lucide-react';
import type { Workout, Discipline } from '@/types';

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

const COMPLETED_STYLE: Record<Discipline, string> = {
  swim:     'border-l-2 border-l-blue-500 bg-blue-50',
  bike:     'border-l-2 border-l-amber-400 bg-amber-50',
  run:      'border-l-2 border-l-emerald-500 bg-emerald-50',
  strength: 'border-l-2 border-l-slate-400 bg-slate-100',
};

const COMPLETED_ICON: Record<Discipline, string> = {
  swim:     'text-blue-500',
  bike:     'text-amber-500',
  run:      'text-emerald-500',
  strength: 'text-slate-400',
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
    const displayDuration = workout.actual_duration_minutes ?? workout.duration_minutes;

    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`${COMPLETED_STYLE[workout.discipline]} px-2 py-1.5 cursor-pointer hover:brightness-95 transition rounded-sm ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 flex-shrink-0 ${COMPLETED_ICON[workout.discipline]}`} />
          <span className="text-[10px] text-slate-500 flex-shrink-0">{displayDuration}m</span>
        </div>
      </div>
    );
  }

  // Planned
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`border border-slate-200 bg-white px-2 py-1.5 cursor-pointer hover:bg-slate-50 transition rounded-sm ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 flex-shrink-0 text-slate-400" />
        <span className="text-[10px] text-slate-400 flex-shrink-0">{workout.duration_minutes}m</span>
      </div>
    </div>
  );
}
