import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Workout } from '@/types';

export function AnalyticsView({ workouts }: { workouts: Workout[] }) {

  const [selectedSport, setSelectedSport] = useState<'swim' | 'bike' | 'run' | 'strength' | 'all'>('all');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(11);
  const TOTAL_WEEKS = 12;

  const disciplineColors: Record<string, string> = {
    swim: '#0284c7',
    bike: '#d97706',
    run: '#16a34a',
    strength: '#7c3aed',
  };

  const sportOptions: { key: 'swim' | 'bike' | 'run' | 'strength' | 'all'; label: string }[] = [
    { key: 'all', label: 'All Sports' },
    { key: 'swim', label: 'Swim' },
    { key: 'bike', label: 'Bike' },
    { key: 'run', label: 'Run' },
    { key: 'strength', label: 'Strength' },
  ];

  const fmt = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getWeeklyData = () => {
    const result = [];
    const now = new Date();
    for (let i = TOTAL_WEEKS - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - now.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const wEnd = new Date(weekEnd.getTime() - 86400000);

      const wws = workouts.filter(w => {
        const d = new Date(w.date + 'T00:00:00');
        return d >= weekStart && d < weekEnd;
      });

      const swim = wws.filter(w => w.discipline === 'swim').reduce((s, w) => s + w.duration_minutes, 0);
      const bike = wws.filter(w => w.discipline === 'bike').reduce((s, w) => s + w.duration_minutes, 0);
      const run = wws.filter(w => w.discipline === 'run').reduce((s, w) => s + w.duration_minutes, 0);
      const strength = wws.filter(w => w.discipline === 'strength').reduce((s, w) => s + w.duration_minutes, 0);
      const tss = wws.reduce((s, w) => s + (w.tss || 0), 0);

      result.push({
        weekStart,
        weekRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${wEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        monthLabel: weekStart.toLocaleDateString('en-US', { month: 'short' }),
        swim, bike, run, strength, tss,
        total: swim + bike + run + strength,
        workoutCount: wws.length,
      });
    }
    return result;
  };

  const weeks = getWeeklyData();
  const safeIndex = Math.min(Math.max(selectedWeekIndex, 0), weeks.length - 1);
  const selectedWeek = weeks[safeIndex];

  const totalMinutes = weeks.reduce((s, w) => s + w.total, 0);
  const totalWorkouts = weeks.reduce((s, w) => s + w.workoutCount, 0);
  const avgWeekly = Math.round(totalMinutes / TOTAL_WEEKS);
  const lastWeek = weeks[TOTAL_WEEKS - 1].total;
  const prevWeek = weeks[TOTAL_WEEKS - 2]?.total ?? 0;
  const trend = prevWeek > 0 ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100) : 0;

  const series = weeks.map(w => selectedSport === 'all' ? w.total : w[selectedSport]);
  const maxVal = Math.max(...series, 1);
  const yMax = Math.max(Math.ceil(maxVal / 60) * 60, 60);

  const chartW = 960, chartH = 300;
  const padX = 68, padTop = 16, padBot = 44;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padTop - padBot;

  const getX = (i: number) => padX + (i / (TOTAL_WEEKS - 1)) * plotW;
  const getY = (val: number) => padTop + (1 - val / yMax) * plotH;

  const makePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(2)} ${getY(v).toFixed(2)}`).join(' ');

  const makeArea = (vals: number[]) =>
    `M ${getX(0).toFixed(2)} ${(padTop + plotH).toFixed(2)} ` +
    vals.map((v, i) => `L ${getX(i).toFixed(2)} ${getY(v).toFixed(2)}`).join(' ') +
    ` L ${getX(vals.length - 1).toFixed(2)} ${(padTop + plotH).toFixed(2)} Z`;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Total Volume (12w)</div>
          <div className="text-2xl font-bold text-slate-900">{fmt(totalMinutes)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Total Workouts</div>
          <div className="text-2xl font-bold text-slate-900">{totalWorkouts}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Weekly Average</div>
          <div className="text-2xl font-bold text-slate-900">{fmt(avgWeekly)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">vs Previous Week</div>
          <div className={`text-2xl font-bold flex items-center gap-1 mt-0.5 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-slate-900'}`}>
            {trend > 0 ? <TrendingUp className="w-5 h-5" /> : trend < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5 text-slate-400" />}
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        </div>
      </div>

      {/* Main chart card */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-slate-900">Weekly Volume</h2>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {sportOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelectedSport(opt.key)}
                className={`px-3 py-1.5 text-xs font-semibold border transition shrink-0 ${
                  selectedSport === opt.key
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-[200px] sm:h-[clamp(180px,26vw,340px)]"
        >
          {[0, 0.5, 1].map(r => {
            const y = padTop + (1 - r) * plotH;
            const val = yMax * r;
            return (
              <g key={r}>
                <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={8} y={y + 4} fontSize="22" fill="#94a3b8" textAnchor="start">
                  {val === 0 ? '0' : `${Math.round(val / 60)}h`}
                </text>
              </g>
            );
          })}

          {weeks.map((week, i) => {
            const isFirst = i === 0;
            const monthChanged = week.monthLabel !== weeks[i - 1]?.monthLabel;
            if (!isFirst && !monthChanged) return null;
            return (
              <text key={i} x={getX(i)} y={chartH - 10} fontSize="22" fill="#94a3b8" textAnchor="middle">
                {week.monthLabel}
              </text>
            );
          })}

          <line
            x1={getX(safeIndex)} y1={padTop}
            x2={getX(safeIndex)} y2={padTop + plotH}
            stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3"
          />

          {(() => {
            const color = selectedSport === 'all' ? '#1d4ed8' : (disciplineColors[selectedSport] ?? '#1d4ed8');
            return (
              <g>
                <path d={makeArea(series)} fill={color} opacity={0.12} />
                <path d={makePath(series)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })()}

          {weeks.map((week, i) => {
            const x = getX(i);
            const isSelected = safeIndex === i;
            const hitW = plotW / TOTAL_WEEKS;
            const val = series[i];
            const color = selectedSport === 'all' ? '#1d4ed8' : (disciplineColors[selectedSport] ?? '#1d4ed8');
            return (
              <g key={i} className="cursor-pointer" onClick={() => setSelectedWeekIndex(i)}>
                <rect x={x - hitW / 2} y={padTop} width={hitW} height={plotH} fill="transparent" />
                {val > 0 && (
                  <circle cx={x} cy={getY(val)} r={isSelected ? 6 : 4}
                    fill={isSelected ? color : 'white'} stroke={color} strokeWidth="2.5">
                    <title>{`${week.weekRange}: ${fmt(val)}`}</title>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {selectedWeek && (
          <div className="pt-4 border-t border-slate-100 mt-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-slate-400">Selected week</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{selectedWeek.weekRange}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Volume</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedSport === 'all' ? fmt(selectedWeek.total) : fmt(selectedWeek[selectedSport])}
                </div>
              </div>
            </div>

            {selectedSport === 'all' && selectedWeek.total > 0 && (
              <div className="space-y-1.5 mb-3">
                {(['swim', 'bike', 'run', 'strength'] as const).map(d => {
                  const val = selectedWeek[d];
                  if (val === 0) return null;
                  const pct = Math.round((val / selectedWeek.total) * 100);
                  return (
                    <div key={d} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 capitalize w-14">{d}</span>
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: disciplineColors[d] }} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-14 text-right">{fmt(val)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-xs text-slate-400">
              <span className="font-medium text-slate-600">{selectedWeek.workoutCount}</span> workout{selectedWeek.workoutCount !== 1 ? 's' : ''}
              <span className="mx-2">·</span>
              TSS <span className="font-medium text-slate-600">{selectedWeek.tss}</span>
            </div>
          </div>
        )}
      </div>

      {/* Per-discipline totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['swim', 'bike', 'run', 'strength'] as const).map(d => {
          const total = weeks.reduce((s, w) => s + w[d], 0);
          const count = workouts.filter(w => w.discipline === d).length;
          const best = Math.max(...weeks.map(w => w[d]));
          return (
            <div key={d} className="bg-white border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: disciplineColors[d] }} />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{d}</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{fmt(total)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{count} session{count !== 1 ? 's' : ''}</div>
              {best > 0 && <div className="text-xs text-slate-400 mt-0.5">Best week: {fmt(best)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
