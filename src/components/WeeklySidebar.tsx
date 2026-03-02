import { Clock, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Workout } from '../types';

interface WeeklySidebarProps {
  workouts: Workout[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeeklySidebar({ 
  workouts, 
  weekStart, 
  onPrevWeek, 
  onNextWeek 
}: WeeklySidebarProps) {
  
  // Calculate the end of the week (Sunday night)
  const getWeekEnd = () => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // Filter workouts that fall within the specific Mon-Sun range
  const getWeekWorkouts = () => {
    const weekEnd = getWeekEnd();
    return workouts.filter((w) => {
      const workoutDate = new Date(w.date + 'T00:00:00');
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });
  };

  const weekWorkouts = getWeekWorkouts();

  // Calculations
  const totalDuration = weekWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0);
  const totalDistance = weekWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);
  const totalTSS = weekWorkouts.reduce((sum, w) => sum + w.tss, 0);
  
  // Triathlon Target Logic (Example target of 500)
  const plannedTSS = 500;
  const tssPercentage = Math.min((totalTSS / plannedTSS) * 100, 100);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const disciplineCounts = weekWorkouts.reduce((acc, w) => {
    acc[w.discipline] = (acc[w.discipline] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white border border-slate-200 p-4 sticky top-4">
      {/* Header with Navigation */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Weekly Summary</h3>
          <p className="text-xs text-slate-600 font-medium tracking-wide uppercase">
            {formatDateLabel(weekStart)} — {formatDateLabel(getWeekEnd())}
          </p>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={onPrevWeek} 
            className="p-1.5 border border-slate-300 hover:border-slate-400 transition"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button 
            onClick={onNextWeek} 
            className="p-1.5 border border-slate-300 hover:border-slate-400 transition"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Total Time Stat */}
        <div className="border border-slate-200 p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Total Time</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{formatDuration(totalDuration)}</div>
        </div>

        {/* Total Distance Stat */}
        <div className="border border-slate-200 p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Distance</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{totalDistance.toFixed(1)} km</div>
        </div>

        {/* TSS Progress Bar */}
        <div className="border border-slate-200 p-3 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">TSS Gauge</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {totalTSS} / {plannedTSS}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                tssPercentage < 50
                  ? 'bg-orange-500'
                  : tssPercentage < 85
                  ? 'bg-blue-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${tssPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">
            {tssPercentage < 50 && 'Under Target'}
            {tssPercentage >= 50 && tssPercentage < 85 && 'In Range'}
            {tssPercentage >= 85 && 'High Load'}
          </div>
        </div>

        {/* Discipline Breakdown Section */}
        <div className="border border-slate-200 p-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Discipline Split
          </h4>
          <div className="space-y-3">
            {Object.entries(disciplineCounts).map(([discipline, count]) => (
              <div key={discipline} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize font-medium">{discipline}</span>
                <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 text-xs font-semibold">
                  {count} {count === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            ))}
            {Object.keys(disciplineCounts).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-2">
                No activities logged for this week.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}