import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Workout } from '../types';
import { WorkoutCard } from './WorkoutCard';

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

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-slate-200 pb-2">
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

      {/* Grid */}
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
                if (e.currentTarget === e.target) {
                  setDropIndicator(null);
                }
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
                  className="opacity-0 hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100"
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
                      if (e.currentTarget === e.target) {
                        setDropIndicator(null);
                      }
                    }}
                  >
                    {dropIndicator?.date === dateStr && dropIndicator.workoutId === workout.id && (
                      <div className="absolute -top-0.5 left-1 right-1 h-0.5 bg-blue-300 opacity-80" />
                    )}
                    <WorkoutCard
                      workout={workout}
                      onClick={() => onWorkoutClick(workout)}
                      onDragStart={() => onDragStart(workout)}
                      onDragEnd={() => {
                        setDropIndicator(null);
                        onDragEnd();
                      }}
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
  );
}