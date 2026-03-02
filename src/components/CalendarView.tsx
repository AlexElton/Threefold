import { Workout } from '../types';
import { Calendar } from './Calendar';
import { WorkoutCreatorPanel } from './WorkoutCreatorPanel';
import { WeeklySidebar } from './WeeklySidebar';
import { VolumeAlert } from './VolumeAlert';

interface CalendarViewProps {
  workouts: Workout[];
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  onDayClick: (date: string) => void;
  onWorkoutClick: (workout: Workout) => void;
  draggedWorkout: Workout | null;
  onDragStart: (workout: Workout) => void;
  onDragEnd: () => void;
  onDrop: (date: string) => void;
  isCreatorOpen: boolean;
  onCreatorClose: () => void;
  selectedDate: string;
  onWorkoutCreated: () => void;
  editingWorkout: Workout | null;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  runVolumeAlert: { date: string; increase: number } | null;
  onDismissAlert: () => void;
}

export function CalendarView({
  workouts,
  currentMonth,
  onMonthChange,
  onDayClick,
  onWorkoutClick,
  draggedWorkout,
  onDragStart,
  onDragEnd,
  onDrop,
  isCreatorOpen,
  onCreatorClose,
  selectedDate,
  onWorkoutCreated,
  editingWorkout,
  weekStart,
  onPrevWeek,
  onNextWeek,
  runVolumeAlert,
  onDismissAlert,
}: CalendarViewProps) {
  return (
    <>
      {runVolumeAlert && (
        <VolumeAlert increase={runVolumeAlert.increase} onClose={onDismissAlert} />
      )}

      <WorkoutCreatorPanel
        isOpen={isCreatorOpen}
        onClose={onCreatorClose}
        selectedDate={selectedDate}
        onWorkoutCreated={onWorkoutCreated}
        existingWorkout={editingWorkout}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-9">
          <Calendar
            workouts={workouts}
            currentMonth={currentMonth}
            onMonthChange={onMonthChange}
            onDayClick={onDayClick}
            onWorkoutClick={onWorkoutClick}
            draggedWorkout={draggedWorkout}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
          />
        </section>
        <aside className="lg:col-span-3">
          <WeeklySidebar
            workouts={workouts}
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
          />
        </aside>
      </div>
    </>
  );
}
