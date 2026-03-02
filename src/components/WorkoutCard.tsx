import { Bike, Droplets, Footprints, Dumbbell } from 'lucide-react';
import { Workout, INTENSITY_COLORS, Discipline } from '../types';

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

export function WorkoutCard({
  workout,
  onDragStart,
  onDragEnd,
  isDragging,
  onClick,
}: WorkoutCardProps) {
  const Icon = DISCIPLINE_ICONS[workout.discipline];
  const colorClass = (() => {
    if (workout.discipline === 'strength') {
      return 'bg-slate-300 text-slate-800 border border-slate-300';
    }

    if (workout.discipline === 'swim') {
      return 'bg-blue-600 text-white border border-blue-700/20';
    }

    if (workout.intensity === 'recovery') {
      return 'bg-slate-500 text-white border border-slate-600/20';
    }

    if (workout.intensity === 'endurance') {
      return 'bg-green-600 text-white border border-green-700/20';
    }

    return `${INTENSITY_COLORS[workout.intensity]} text-white border border-black/10`;
  })();

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`${colorClass} p-2 cursor-move hover:cursor-pointer transition ${
        isDragging ? 'opacity-50' : 'hover:opacity-90'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline text-xs font-medium capitalize">{workout.discipline}</span>
          </div>
          <div className="text-xs leading-tight">
            <span className="font-semibold">{workout.duration_minutes}</span>
            <span className="block sm:inline sm:ml-0.5">Min</span>
            <span className="hidden sm:inline"> • {workout.tss} TSS</span>
          </div>
        </div>
      </div>

      {workout.completed && (
        <div className="text-xs mt-1 opacity-75 tracking-wide">✓ Complete</div>
      )}
    </div>
  );
}