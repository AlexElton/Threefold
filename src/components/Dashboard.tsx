import { useState, useEffect, useCallback } from 'react';
import { LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';
import { Calendar } from './Calendar';
import { WorkoutCreatorPanel } from './WorkoutCreatorPanel';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import { WeeklySidebar } from './WeeklySidebar';
import { VolumeAlert } from './VolumeAlert';
import logo from '../img/logo(text).png';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [draggedWorkout, setDraggedWorkout] = useState<Workout | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [runVolumeAlert, setRunVolumeAlert] = useState<{ date: string; increase: number } | null>(null);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const checkRunVolumeIncrease = useCallback((allWorkouts: Workout[]) => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay() + 1);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekRuns = allWorkouts.filter(w => {
      const wDate = new Date(w.date + 'T00:00:00');
      return w.discipline === 'run' && wDate >= thisWeekStart && wDate < new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    const lastWeekRuns = allWorkouts.filter(w => {
      const wDate = new Date(w.date + 'T00:00:00');
      return w.discipline === 'run' && wDate >= lastWeekStart && wDate < thisWeekStart;
    });

    const thisWeekVolume = thisWeekRuns.reduce((sum, w) => sum + w.duration_minutes, 0);
    const lastWeekVolume = lastWeekRuns.reduce((sum, w) => sum + w.duration_minutes, 0);

    if (lastWeekVolume > 0 && thisWeekVolume > lastWeekVolume) {
      const increase = ((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100;
      if (increase > 10) {
        setRunVolumeAlert({ date: today.toISOString().split('T')[0], increase: Math.round(increase) });
      } else {
        setRunVolumeAlert(null);
      }
    } else {
      setRunVolumeAlert(null);
    }
  }, []);
  
  const loadWorkouts = useCallback(async () => {
    if (!user) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 2, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (!error && data) {
      setWorkouts(data);
      checkRunVolumeIncrease(data);
    }
    setLoading(false);
  }, [user, currentMonth, checkRunVolumeIncrease]);



  const handleDeleteWorkout = async (workout: Workout) => {
    setIsDeleting(true);
    try {
      await supabase.from("workouts").delete().eq("id", workout.id);
      loadWorkouts();
    } finally {
      setIsDeleting(false);
      setSelectedWorkout(null);
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setSelectedDate(workout.date);
    setSelectedWorkout(null);
    setIsCreatorOpen(true);
  };

  const loadProfile = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
  }, [user]);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setEditingWorkout(null);
    setIsCreatorOpen(true);
  };

  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout);
  };

  const handleDragStart = (workout: Workout) => {
    setDraggedWorkout(workout);
  };

  const handleDragEnd = () => {
    setDraggedWorkout(null);
  };

  const handleDrop = async (newDate: string) => {
    if (!draggedWorkout || !user) return;

    const { error } = await supabase
      .from('workouts')
      .update({ date: newDate })
      .eq('id', draggedWorkout.id);

    if (!error) {
      loadWorkouts();
    }

    setDraggedWorkout(null);
  };

  useEffect(() => {
    loadWorkouts();
    loadProfile();
  }, [loadWorkouts, loadProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Threefold" className="h-28 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {runVolumeAlert && <VolumeAlert increase={runVolumeAlert.increase} onClose={() => setRunVolumeAlert(null)} />}

        {showAnalytics && (
          <div className="mb-6">
            <button
              onClick={() => setShowAnalytics(false)}
              className="mb-4 text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Back to Calendar
            </button>
          </div>
        )}

        {!showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-3">
            <WorkoutCreatorPanel
              isOpen={isCreatorOpen}
              onClose={() => {
                setIsCreatorOpen(false);
                setEditingWorkout(null);
              }}
              selectedDate={selectedDate}
              onWorkoutCreated={loadWorkouts}
              existingWorkout={editingWorkout}
            />
            <Calendar
              workouts={workouts}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDayClick={handleDayClick}
              onWorkoutClick={handleWorkoutClick}
              draggedWorkout={draggedWorkout}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          </div>

          <div className="lg:col-span-1">
            <WeeklySidebar
              workouts={workouts}
              weekStart={currentWeekStart}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
            />
          </div>
        </div>
        )}

        {showAnalytics && (
          <ProgressionAnalytics workouts={workouts} />
        )}
      </main>

      <WorkoutDetailModal
        isOpen={selectedWorkout !== null}
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onEdit={handleEditWorkout}
        onDelete={handleDeleteWorkout}
        isDeleting={isDeleting}
      />
    </div>

  );
}

function ProgressionAnalytics({ workouts }: { workouts: Workout[] }) {
  return (
    <div className="px-0 sm:px-2">
      <h2 className="text-xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Training Progression</h2>
      <p className="text-slate-600 mb-3 sm:mb-4 text-base sm:text-lg">3-month weekly volume analysis by discipline</p>
      <AnalyticsChart workouts={workouts} />
    </div>
  );
}

function AnalyticsChart({ workouts }: { workouts: Workout[] }) {
  const [selectedSport, setSelectedSport] = useState<'swim' | 'bike' | 'run' | 'strength' | 'all'>('all');
  const TOTAL_WEEKS = 12;
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(TOTAL_WEEKS - 1);

  const formatDuration = (minutes: number) => {
    const totalMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWeeklyData = () => {
    const weeks: {
      monthLabel: string;
      weekRange: string;
      swim: number;
      bike: number;
      run: number;
      strength: number;
    }[] = [];
    const now = new Date();

    for (let i = TOTAL_WEEKS - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - now.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekRangeEnd = new Date(weekEnd);
      weekRangeEnd.setDate(weekRangeEnd.getDate() - 1);

      const weekWorkouts = workouts.filter(w => {
        const wDate = new Date(w.date + 'T00:00:00');
        return wDate >= weekStart && wDate < weekEnd;
      });

      const disciplines = {
        swim: weekWorkouts.filter(w => w.discipline === 'swim').reduce((s, w) => s + w.duration_minutes, 0),
        bike: weekWorkouts.filter(w => w.discipline === 'bike').reduce((s, w) => s + w.duration_minutes, 0),
        run: weekWorkouts.filter(w => w.discipline === 'run').reduce((s, w) => s + w.duration_minutes, 0),
        strength: weekWorkouts.filter(w => w.discipline === 'strength').reduce((s, w) => s + w.duration_minutes, 0),
      };

      weeks.push({
        monthLabel: weekStart.toLocaleDateString('en-US', { month: 'short' }),
        weekRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekRangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        ...disciplines,
      });
    }

    return weeks;
  };

  const weeks = getWeeklyData();
  const sportOptions: { key: 'swim' | 'bike' | 'run' | 'strength' | 'all'; label: string }[] = [
    { key: 'swim', label: 'Swim' },
    { key: 'bike', label: 'Bike' },
    { key: 'run', label: 'Run' },
    { key: 'strength', label: 'Strength' },
    { key: 'all', label: 'All' },
  ];

  const selectedConfig = sportOptions.find(option => option.key === selectedSport) ?? sportOptions[4];
  const series = weeks.map(week => {
    if (selectedSport === 'all') {
      return week.swim + week.bike + week.run + week.strength;
    }
    return week[selectedSport];
  });

  const maxVolume = Math.max(...series, 1);
  const roundedTopHours = Math.max(1, Math.round(maxVolume / 60));
  const yAxisMaxMinutes = roundedTopHours * 60;
  const chartWidth = 960;
  const chartHeight = 320;
  const paddingX = 44;
  const paddingTop = 24;
  const paddingBottom = 56;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = series.map((value, index) => {
    const x = paddingX + (index / Math.max(series.length - 1, 1)) * plotWidth;
    const y = paddingTop + (1 - value / yAxisMaxMinutes) * plotHeight;
    return { x, y, value, label: weeks[index].weekRange };
  });

  const monthLabelIndices = (() => {
    const labels: number[] = [];
    const seen = new Set<string>();

    for (let index = weeks.length - 1; index >= 0; index--) {
      const month = weeks[index].monthLabel;
      if (seen.has(month)) continue;
      seen.add(month);
      labels.push(index);
      if (labels.length === 3) break;
    }

    return labels.sort((a, b) => a - b);
  })();

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  useEffect(() => {
    if (weeks.length === 0) return;
    if (selectedWeekIndex < 0 || selectedWeekIndex >= weeks.length) {
      setSelectedWeekIndex(weeks.length - 1);
    }
  }, [weeks.length, selectedWeekIndex]);

  const areaPathData = points.length
    ? `M ${points[0].x.toFixed(2)} ${(paddingTop + plotHeight).toFixed(2)} ${points
        .map((point, index) => `${index === 0 ? 'L' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ')} L ${points[points.length - 1].x.toFixed(2)} ${(paddingTop + plotHeight).toFixed(2)} Z`
    : '';

  const safeSelectedIndex = Math.min(Math.max(selectedWeekIndex, 0), Math.max(weeks.length - 1, 0));
  const selectedWeek = weeks[safeSelectedIndex];
  const selectedPoint = points[safeSelectedIndex];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-3 md:gap-6 items-start">
        <div className="px-1 md:pt-2">
          <div className="flex md:flex-col gap-2 mb-4 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {sportOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setSelectedSport(option.key)}
                className={`px-3 py-2 rounded-lg text-base font-medium border transition shrink-0 md:w-full md:text-left ${
                  selectedSport === option.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-0 sm:px-1">
          {selectedWeek && selectedPoint && (
            <div className="mb-3 px-1">
              <div className="text-base font-semibold text-slate-900">Week of {selectedWeek.weekRange}</div>
              <div className="text-xl font-bold text-slate-900">{formatDuration(selectedPoint.value)}</div>
            </div>
          )}

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 sm:h-72" role="img" aria-label={`${selectedConfig.label} weekly line chart`}>
          {[1, 0.5, 0].map((ratio, index) => {
            const y = paddingTop + (1 - ratio) * plotHeight;
            const value = yAxisMaxMinutes * ratio;
            const hours = value / 60;
            return (
              <g key={index}>
                <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} className="stroke-slate-200" strokeWidth="1" />
                <text x={paddingX - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-lg font-medium">
                  {`${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`}
                </text>
              </g>
            );
          })}

          <g className="text-orange-500">
            <path d={areaPathData} className="fill-current opacity-20" />
            <path d={pathData} fill="none" className="stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((point, index) => (
              <g key={`${point.label}-${index}`} className="cursor-pointer" onClick={() => setSelectedWeekIndex(index)}>
                {safeSelectedIndex === index && (
                  <circle cx={point.x} cy={point.y} r="10" className="fill-current opacity-20" />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  className={safeSelectedIndex === index ? 'fill-current stroke-current' : 'fill-white stroke-current'}
                  strokeWidth="2.5"
                >
                  <title>{`${selectedConfig.label} · ${point.label}: ${formatDuration(point.value)}`}</title>
                </circle>
              {monthLabelIndices.includes(index) && (
                <text x={point.x} y={chartHeight - 20} textAnchor="middle" className="fill-slate-500 text-lg font-medium">
                  {weeks[index].monthLabel}
                </text>
              )}
              </g>
            ))}
          </g>
          </svg>

          <div className="mt-1 text-base text-slate-700 font-medium px-1">
            {selectedConfig.label} weekly volume (hours)
          </div>
        </div>
      </div>
    </div>
  );
}
