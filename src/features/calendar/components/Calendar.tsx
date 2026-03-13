import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Bike, Droplets, Footprints, Dumbbell, CheckCircle2 } from 'lucide-react';
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard';
import type { Workout, Discipline } from '@/types';

interface CalendarProps {
  workouts: Workout[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDayClick: (date: string) => void;
  onWorkoutClick: (workout: Workout) => void;
  draggedWorkout: Workout | null;
  onDragStart: (workout: Workout) => void;
  onDragEnd: () => void;
  onDrop: (date: string) => void;
}

const DISCIPLINE_ICONS: Record<Discipline, React.ComponentType<{ className?: string }>> = {
  swim: Droplets,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
};

const DISCIPLINE_DOT_COLORS: Record<Discipline, string> = {
  swim:     'bg-blue-500',
  bike:     'bg-yellow-500',
  run:      'bg-green-500',
  strength: 'bg-slate-500',
};

// Completed badge colors for the mobile detail panel
const COMPLETED_BADGE: Record<Discipline, string> = {
  swim:     'bg-blue-50 border-l-4 border-l-blue-500 border border-blue-100',
  bike:     'bg-yellow-50 border-l-4 border-l-yellow-500 border border-yellow-100',
  run:      'bg-green-50 border-l-4 border-l-green-600 border border-green-100',
  strength: 'bg-slate-100 border-l-4 border-l-slate-500 border border-slate-200',
};

const COMPLETED_ICON_COLOR: Record<Discipline, string> = {
  swim:     'text-blue-600',
  bike:     'text-yellow-700',
  run:      'text-green-700',
  strength: 'text-slate-600',
};

export function Calendar({
  workouts,
  currentMonth,
  onMonthChange,
  onDayClick,
  onWorkoutClick,
  draggedWorkout,
  onDragStart,
  onDragEnd,
  onDrop,
}: CalendarProps) {
  const [days, setDays] = useState<Date[]>([]);
  const [dropIndicator, setDropIndicator] = useState<{ date: string; workoutId?: string } | null>(null);
  // Mobile: which day is selected for the detail panel
  const [selectedMobileDay, setSelectedMobileDay] = useState<string | null>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Helper: Format date to YYYY-MM-DD local time
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper: Filter workouts for a specific day
  const getWorkoutsForDay = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return workouts.filter((w) => w.date === dateStr);
  };

  // Helper: Check if date is in the currently viewed month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  // Helper: Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    
    // Calculate how many days to skip to start on Monday
    const dayOfWeek = (firstDay.getDay() + 6) % 7; 
    
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - dayOfWeek);

    const calendarDays: Date[] = [];
    const current = new Date(startDay);

    // Standard 6-week calendar grid (42 days)
    for (let i = 0; i < 42; i++) {
      calendarDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    setDays(calendarDays);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Format display label for selected mobile day
  const formatMobileDayLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const selectedMobileDayWorkouts = selectedMobileDay
    ? workouts.filter((w) => w.date === selectedMobileDay)
    : [];

  return (
    <div className="bg-white border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-slate-200">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 border border-slate-300 hover:border-slate-400 transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 border border-slate-300 hover:border-slate-400 transition"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────
          DESKTOP GRID (hidden on small screens)
      ───────────────────────────────────────────────── */}
      <div className="hidden sm:block p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center font-semibold text-slate-600 text-xs sm:text-sm py-1.5 border-b border-slate-200">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const dayWorkouts = getWorkoutsForDay(day);
            const dateStr = formatLocalDate(day);

            return (
              <div
                key={day.toISOString() + index}
                className={`min-h-[100px] sm:min-h-[118px] border p-1.5 sm:p-2 transition ${
                  isCurrentMonth(day) ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                } ${isToday(day) ? 'ring-1 ring-blue-700 ring-inset' : ''} ${
                  dropIndicator?.date === dateStr && !dropIndicator.workoutId
                    ? 'ring-1 ring-blue-300 ring-inset'
                    : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!draggedWorkout || dayWorkouts.length > 0) return;
                  setDropIndicator({ date: dateStr });
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setDropIndicator(null);
                }}
                onDrop={() => {
                  setDropIndicator(null);
                  onDrop(dateStr);
                }}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      isCurrentMonth(day) ? 'text-slate-700' : 'text-slate-400'
                    } ${isToday(day) ? 'text-blue-700 font-semibold' : ''}`}
                  >
                    {day.getDate()}
                  </span>
                  <button
                    onClick={() => onDayClick(dateStr)}
                    className="opacity-30 hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
                  </button>
                </div>
                <div className="space-y-1">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="relative"
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!draggedWorkout || draggedWorkout.id === workout.id) return;
                        setDropIndicator({ date: dateStr, workoutId: workout.id });
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget === e.target) setDropIndicator(null);
                      }}
                    >
                      {dropIndicator?.date === dateStr && dropIndicator.workoutId === workout.id && (
                        <div className="absolute -top-0.5 left-1 right-1 h-0.5 bg-blue-300 opacity-80" />
                      )}
                      <WorkoutCard
                        workout={workout}
                        onClick={() => onWorkoutClick(workout)}
                        onDragStart={() => onDragStart(workout)}
                        onDragEnd={() => { setDropIndicator(null); onDragEnd(); }}
                        isDragging={draggedWorkout?.id === workout.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────
          MOBILE GRID — compact dots (visible only < sm)
      ───────────────────────────────────────────────── */}
      <div className="sm:hidden">
        {/* Day-of-week header — single letter */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[11px] font-bold text-slate-500 py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Compact day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayWorkouts = getWorkoutsForDay(day);
            const dateStr = formatLocalDate(day);
            const isSelected = selectedMobileDay === dateStr;
            const today = isToday(day);
            const inMonth = isCurrentMonth(day);

            return (
              <button
                key={day.toISOString() + index}
                onClick={() => setSelectedMobileDay(dateStr)}
                className={`relative flex flex-col items-center py-2 gap-1 transition border-b border-slate-100
                  ${isSelected ? 'bg-blue-50' : inMonth ? 'bg-white' : 'bg-slate-50'}
                  ${isSelected ? 'border-b-2 border-b-blue-600' : ''}
                `}
              >
                {/* Day number */}
                <span
                  className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-full transition
                    ${today && isSelected ? 'bg-blue-600 text-white' : ''}
                    ${today && !isSelected ? 'bg-blue-100 text-blue-700' : ''}
                    ${!today && isSelected ? 'bg-slate-200 text-slate-900' : ''}
                    ${!today && !isSelected && inMonth ? 'text-slate-700' : ''}
                    ${!today && !isSelected && !inMonth ? 'text-slate-300' : ''}
                  `}
                >
                  {day.getDate()}
                </span>

                {/* Workout dots */}
                <div className="flex gap-[3px] flex-wrap justify-center min-h-[6px]">
                  {dayWorkouts.slice(0, 3).map((w) => (
                    <span
                      key={w.id}
                      className={`w-1.5 h-1.5 rounded-full ${DISCIPLINE_DOT_COLORS[w.discipline]}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Selected-day detail panel ── */}
        {selectedMobileDay && (
          <div className="border-t-2 border-slate-200 bg-white">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {formatMobileDayLabel(selectedMobileDay)}
                </p>
                {selectedMobileDayWorkouts.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedMobileDayWorkouts.length} workout{selectedMobileDayWorkouts.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDayClick(selectedMobileDay)}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 transition hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
                <button
                  onClick={() => setSelectedMobileDay(null)}
                  className="p-1.5 border border-slate-200 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Workout list */}
            {selectedMobileDayWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-sm">No workouts — tap Add to log one</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedMobileDayWorkouts.map((workout) => {
                  const Icon = DISCIPLINE_ICONS[workout.discipline];
                  const isCompleted = workout.completed;
                  const displayName = workout.strava_name ?? workout.discipline;
                  const displayDuration = workout.actual_duration_minutes ?? workout.duration_minutes;
                  return (
                    <button
                      key={workout.id}
                      onClick={() => onWorkoutClick(workout)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
                    >
                      {/* Discipline icon badge */}
                      {isCompleted ? (
                        <div className={`${COMPLETED_BADGE[workout.discipline]} w-9 h-9 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${COMPLETED_ICON_COLOR[workout.discipline]}`} />
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-300 bg-white w-9 h-9 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 capitalize truncate">
                          {isCompleted ? displayName : workout.discipline}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {workout.intensity.replace('_', ' ')}
                        </p>
                      </div>
                      {/* Stats */}
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-bold text-slate-800">{displayDuration} min</span>
                        {isCompleted && workout.strava_avg_hr != null ? (
                          <span className="text-xs text-slate-400">{Math.round(workout.strava_avg_hr)} bpm</span>
                        ) : (
                          <span className="text-xs text-slate-400">{workout.tss} TSS</span>
                        )}
                      </div>
                      {/* Status indicator */}
                      {isCompleted ? (
                        <CheckCircle2 className={`w-4 h-4 ml-1 flex-shrink-0 ${COMPLETED_ICON_COLOR[workout.discipline]}`} />
                      ) : (
                        <span className="w-4 h-4 ml-1 flex-shrink-0 rounded-full border-2 border-slate-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}