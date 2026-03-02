import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, CalendarDays, BarChart3, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';
import { CalendarView } from './CalendarView';
import { DashboardView } from './DashboardView';
import { AnalyticsView } from './AnalyticsView';
import { ProfileView } from './ProfileView';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import logo from '../img/logo(text).png';

type Page = 'dashboard' | 'calendar' | 'analysis' | 'profile';

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'calendar', label: 'Calendar', icon: CalendarDays },
  { page: 'analysis', label: 'Analysis', icon: BarChart3 },
  { page: 'profile', label: 'Profile', icon: User },
];

export function Dashboard() {
  const { user } = useAuth();

  const [page, setPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [draggedWorkout, setDraggedWorkout] = useState<Workout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      await supabase.from('workouts').delete().eq('id', workout.id);
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

  const navigate = (p: Page) => {
    setPage(p);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600 text-sm font-medium">Loading training data…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <img src={logo} alt="Threefold" className="h-20 w-auto" />

          <button
            onClick={() => setIsMobileMenuOpen(v => !v)}
            className="sm:hidden p-2 border border-slate-300 text-slate-700"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ page: p, label, icon: Icon }) => (
              <button
                key={p}
                onClick={() => navigate(p)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border transition ${
                  page === p
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 px-4 py-3 space-y-2">
            {NAV_ITEMS.map(({ page: p, label, icon: Icon }) => (
              <button
                key={p}
                onClick={() => navigate(p)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium border transition ${
                  page === p
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-[1500px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {page === 'dashboard' && <DashboardView />}

        {page === 'calendar' && (
          <CalendarView
            workouts={workouts}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDayClick={(date) => { setSelectedDate(date); setEditingWorkout(null); setIsCreatorOpen(true); }}
            onWorkoutClick={setSelectedWorkout}
            draggedWorkout={draggedWorkout}
            onDragStart={setDraggedWorkout}
            onDragEnd={() => setDraggedWorkout(null)}
            onDrop={async (newDate) => {
              if (!draggedWorkout) return;
              await supabase.from('workouts').update({ date: newDate }).eq('id', draggedWorkout.id);
              setDraggedWorkout(null);
              loadWorkouts();
            }}
            isCreatorOpen={isCreatorOpen}
            onCreatorClose={() => { setIsCreatorOpen(false); setEditingWorkout(null); }}
            selectedDate={selectedDate}
            onWorkoutCreated={loadWorkouts}
            editingWorkout={editingWorkout}
            weekStart={currentWeekStart}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            runVolumeAlert={runVolumeAlert}
            onDismissAlert={() => setRunVolumeAlert(null)}
          />
        )}

        {page === 'analysis' && <AnalyticsView />}

        {page === 'profile' && <ProfileView />}
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

