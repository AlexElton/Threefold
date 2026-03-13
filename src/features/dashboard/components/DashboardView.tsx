import { Clock, Zap, Dumbbell, TrendingUp, TrendingDown, CalendarDays, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Workout } from '@/types';

const DISCIPLINE_COLORS: Record<string, string> = {
  swim: '#0284c7',
  bike: '#d97706',
  run: '#16a34a',
  strength: '#7c3aed',
};

const DISCIPLINE_BG: Record<string, string> = {
  swim: 'bg-sky-100 text-sky-700',
  bike: 'bg-amber-100 text-amber-700',
  run: 'bg-green-100 text-green-700',
  strength: 'bg-violet-100 text-violet-700',
};

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeTrainingLoad(workouts: Workout[]) {
  // Build map of date → total TSS
  const tssMap: Record<string, number> = {};
  workouts.forEach(w => {
    tssMap[w.date] = (tssMap[w.date] || 0) + (w.tss || 0);
  });

  const k_ctl = 1 - Math.exp(-1 / 42);
  const k_atl = 1 - Math.exp(-1 / 7);
  let ctl = 0, atl = 0;

  // Walk from 60 days ago to today
  const today = new Date();
  for (let i = 60; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    const tss = tssMap[key] || 0;
    ctl = ctl + k_ctl * (tss - ctl);
    atl = atl + k_atl * (tss - atl);
  }

  return { ctl, atl, tsb: ctl - atl };
}

export function DashboardView({ workouts, profileName }: { workouts: Workout[]; profileName: string | null }) {
  const { user } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);

  // Week bounds (Mon–Sun)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  lastWeekEnd.setMilliseconds(-1);

  const thisWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date + 'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });

  const lastWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date + 'T00:00:00');
    return d >= lastWeekStart && d <= lastWeekEnd;
  });

  const thisWeekVolume = thisWeekWorkouts.reduce((s, w) => s + w.duration_minutes, 0);
  const lastWeekVolume = lastWeekWorkouts.reduce((s, w) => s + w.duration_minutes, 0);
  const thisWeekTSS = thisWeekWorkouts.reduce((s, w) => s + (w.tss || 0), 0);
  const lastWeekTSS = lastWeekWorkouts.reduce((s, w) => s + (w.tss || 0), 0);
  const completedThisWeek = thisWeekWorkouts.filter(w => w.completed).length;

  const volumeTrend = lastWeekVolume > 0 ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100) : null;
  const tssTrend = lastWeekTSS > 0 ? Math.round(((thisWeekTSS - lastWeekTSS) / lastWeekTSS) * 100) : null;

  // Upcoming workouts (from today onward, not completed)
  const upcoming = workouts
    .filter(w => w.date >= todayStr && !w.completed)
    .slice(0, 5);

  // Recent completed workouts
  const recentCompleted = workouts
    .filter(w => w.date < todayStr && w.completed)
    .slice(-3)
    .reverse();

  // Discipline distribution this week
  const disciplineMins: Record<string, number> = { swim: 0, bike: 0, run: 0, strength: 0 };
  thisWeekWorkouts.forEach(w => { disciplineMins[w.discipline] = (disciplineMins[w.discipline] || 0) + w.duration_minutes; });

  const { ctl, atl, tsb } = computeTrainingLoad(workouts);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profileName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const tsbStatus = tsb < -10
    ? { label: 'High Fatigue', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' }
    : tsb > 5
    ? { label: 'Recovering', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
    : { label: 'Optimal Form', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{greeting}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* This week at a glance */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">This Week</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Volume */}
          <div className="bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Volume</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{fmt(thisWeekVolume)}</div>
            {volumeTrend !== null && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${volumeTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {volumeTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {volumeTrend > 0 ? '+' : ''}{volumeTrend}% vs last week
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{thisWeekWorkouts.length}</div>
            {completedThisWeek > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {completedThisWeek} completed
              </div>
            )}
          </div>

          {/* TSS */}
          <div className="bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">TSS</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{thisWeekTSS}</div>
            {tssTrend !== null && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${tssTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tssTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {tssTrend > 0 ? '+' : ''}{tssTrend}% vs last week
              </div>
            )}
          </div>

          {/* Discipline mix */}
          <div className="bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sport Mix</span>
            </div>
            {thisWeekVolume > 0 ? (
              <>
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2">
                  {(['swim', 'bike', 'run', 'strength'] as const).map(d => {
                    const pct = (disciplineMins[d] / thisWeekVolume) * 100;
                    if (pct < 1) return null;
                    return <div key={d} style={{ width: `${pct}%`, backgroundColor: DISCIPLINE_COLORS[d] }} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {(['swim', 'bike', 'run', 'strength'] as const).filter(d => disciplineMins[d] > 0).map(d => (
                    <div key={d} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DISCIPLINE_COLORS[d] }} />
                      <span className="text-xs text-slate-500 capitalize">{d}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400">No workouts yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming workouts */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Upcoming</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming workouts planned.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(w => (
                <div key={w.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className={`px-2 py-0.5 text-xs font-semibold rounded-sm ${DISCIPLINE_BG[w.discipline]}`}>
                    {w.discipline.charAt(0).toUpperCase() + w.discipline.slice(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 capitalize">{w.intensity.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-400">{formatDate(w.date)}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 shrink-0">{fmt(w.duration_minutes)}</div>
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Training Load */}
        <div className={`border p-4 sm:p-5 ${tsbStatus.bg}`}>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Training Load</h2>
          <div className={`text-xs font-semibold mb-4 ${tsbStatus.color}`}>{tsbStatus.label}</div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">CTL</div>
              <div className="text-xl font-bold text-slate-900">{ctl.toFixed(0)}</div>
              <div className="text-xs text-slate-400">Fitness</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">ATL</div>
              <div className="text-xl font-bold text-slate-900">{atl.toFixed(0)}</div>
              <div className="text-xs text-slate-400">Fatigue</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">TSB</div>
              <div className={`text-xl font-bold ${tsbStatus.color}`}>{tsb > 0 ? '+' : ''}{tsb.toFixed(0)}</div>
              <div className="text-xs text-slate-400">Form</div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-200 pt-3">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 inline-block rounded-sm" />CTL = chronic (42d) fitness</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-400 inline-block rounded-sm" />ATL = acute (7d) fatigue</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-400 inline-block rounded-sm" />TSB = form (CTL − ATL)</div>
          </div>
        </div>
      </div>

      {/* Recently completed */}
      {recentCompleted.length > 0 && (
        <div className="bg-white border border-slate-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recently Completed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentCompleted.map(w => (
              <div key={w.id} className="border border-slate-100 p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-sm ${DISCIPLINE_BG[w.discipline]}`}>
                    {w.discipline.charAt(0).toUpperCase() + w.discipline.slice(1)}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-sm font-medium text-slate-800 capitalize mt-1">{w.intensity.replace('_', ' ')}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">{formatDate(w.date)}</span>
                  <span className="text-xs font-semibold text-slate-700">{fmt(w.actual_duration_minutes ?? w.duration_minutes)}</span>
                </div>
                {w.tss > 0 && <div className="text-xs text-slate-400 mt-0.5">TSS {w.actual_tss ?? w.tss}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
