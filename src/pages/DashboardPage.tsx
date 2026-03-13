import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, CalendarDays, BarChart3, User } from 'lucide-react';
import { AnalyticsView } from '@/features/analytics/components/AnalyticsView';
import { CalendarView } from '@/features/calendar/components/CalendarView';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { WorkoutDetailModal } from '@/features/workouts/components/WorkoutDetailModal';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { supabase } from '@/services/supabase';
import type { Workout } from '@/types';
import {
  getStravaConnection,
  syncStravaActivities,
  disconnectStrava,
  stravaConnectionNeedsSync,
} from '@/services/strava';
import type { StravaConnection } from '@/services/strava';

type Page = 'dashboard' | 'calendar' | 'analysis' | 'profile';
type ProfileData = { full_name: string | null; current_ctl: number; current_atl: number; created_at: string };

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'calendar', label: 'Calendar', icon: CalendarDays },
  { page: 'analysis', label: 'Analysis', icon: BarChart3 },
  { page: 'profile', label: 'Profile', icon: User },
];

export function DashboardPage() {
  const { user } = useAuth();

  const [page, setPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stravaConnection, setStravaConnection] = useState<StravaConnection | null>(null);
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

    const pad = (n: number) => String(n).padStart(2, '0');
    const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const from = new Date();
    from.setDate(from.getDate() - 90);
    const to = new Date();
    to.setDate(to.getDate() + 90);

    const [workoutsRes, profileRes, stravaConn] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fmtDate(from))
        .lte('date', fmtDate(to))
        .order('date'),
      supabase.from('profiles').select('full_name, current_ctl, current_atl, created_at').eq('id', user.id).maybeSingle(),
      getStravaConnection(user.id),
    ]);

    if (!workoutsRes.error && workoutsRes.data) {
      setWorkouts(workoutsRes.data);
      checkRunVolumeIncrease(workoutsRes.data);
    }
    if (profileRes.data) setProfileData(profileRes.data as ProfileData);
    setStravaConnection(stravaConn);
    setLoading(false);

    // Sync Strava activities if connected and due for a check
    if (stravaConn && stravaConnectionNeedsSync(stravaConn)) {
      try {
        const imported = await syncStravaActivities(user.id, stravaConn);
        if (imported > 0) {
          // Reload workouts to include newly imported activities
          const refreshed = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', fmtDate(from))
            .lte('date', fmtDate(to))
            .order('date');
          if (!refreshed.error && refreshed.data) {
            setWorkouts(refreshed.data);
            checkRunVolumeIncrease(refreshed.data);
          }
          // Re-fetch connection so state has the latest (possibly rotated) tokens
          const freshConn = await getStravaConnection(user.id);
          setStravaConnection(freshConn);
        } else {
          // No new activities — still refresh connection state to capture any token rotation
          const freshConn = await getStravaConnection(user.id);
          setStravaConnection(freshConn);
        }
      } catch {
        // Strava sync failures are non-fatal; the user can retry manually
      }
    }
  }, [user, checkRunVolumeIncrease]);



  const handleStravaSync = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    // Always re-fetch from DB to get the latest (possibly rotated) tokens
    const freshConn = await getStravaConnection(user.id);
    if (!freshConn) return 0;
    setStravaConnection(freshConn);
    const count = await syncStravaActivities(user.id, freshConn, true);
    if (count > 0) {
      await loadWorkouts();
    } else {
      // Refresh state to capture any token rotation that happened during sync
      const updatedConn = await getStravaConnection(user.id);
      setStravaConnection(updatedConn);
    }
    return count;
  }, [user, loadWorkouts]);

  const handleStravaDisconnect = useCallback(async () => {
    if (!user) return;
    await disconnectStrava(user.id);
    setStravaConnection(null);
  }, [user]);

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
    <DashboardLayout
      activePage={page}
      isMobileMenuOpen={isMobileMenuOpen}
      navItems={NAV_ITEMS}
      onNavigate={navigate}
      onToggleMobileMenu={() => setIsMobileMenuOpen(v => !v)}
    >
        {page === 'dashboard' && <DashboardView workouts={workouts} profileName={profileData?.full_name ?? null} />}

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

        {page === 'analysis' && <AnalyticsView workouts={workouts} />}

        {page === 'profile' && (
          <ProfileView
            profileData={profileData}
            onProfileUpdate={(name) => setProfileData(p => p ? { ...p, full_name: name } : p)}
            stravaConnection={stravaConnection}
            onStravaDisconnect={handleStravaDisconnect}
            onStravaSync={handleStravaSync}
          />
        )}

      <WorkoutDetailModal
        isOpen={selectedWorkout !== null}
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onEdit={handleEditWorkout}
        onDelete={handleDeleteWorkout}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}

