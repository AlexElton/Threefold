import { useState } from 'react';
import { CalendarDays, BarChart2 } from 'lucide-react';
import { WorkoutCreatorPanel } from '@/features/workouts/components/WorkoutCreatorPanel';
import type { Workout } from '@/types';
import { Calendar } from './Calendar';
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
  // Mobile tab: 'calendar' | 'weekly'
  const [mobileTab, setMobileTab] = useState<'calendar' | 'weekly'>('calendar');

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

      {/* ── Mobile tab bar (hidden on lg+) ─────────────── */}
      <div className="lg:hidden flex border border-slate-200 bg-white mb-3 overflow-hidden">
        <button
          onClick={() => setMobileTab('calendar')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition
            ${mobileTab === 'calendar'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:bg-slate-50'
            }`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendar
        </button>
        <button
          onClick={() => setMobileTab('weekly')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition border-l border-slate-200
            ${mobileTab === 'weekly'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:bg-slate-50'
            }`}
        >
          <BarChart2 className="w-4 h-4" />
          This Week
        </button>
      </div>

      {/* ── Desktop two-column layout ───────────────────── */}
      <div className="hidden lg:grid grid-cols-12 gap-4">
        <section className="col-span-9">
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
        <aside className="col-span-3">
          <WeeklySidebar
            workouts={workouts}
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
          />
        </aside>
      </div>

      {/* ── Mobile: show active tab content ─────────────── */}
      <div className="lg:hidden">
        {mobileTab === 'calendar' && (
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
        )}
        {mobileTab === 'weekly' && (
          <WeeklySidebar
            workouts={workouts}
            weekStart={weekStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
          />
        )}
      </div>
    </>
  );
}
