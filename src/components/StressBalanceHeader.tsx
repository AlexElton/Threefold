import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface StressBalanceHeaderProps {
  ctl: number;
  atl: number;
  tsb: number;
}

export function StressBalanceHeader({ ctl, atl, tsb }: StressBalanceHeaderProps) {
  const getStatus = () => {
    if (tsb < -10) return { label: 'Overreaching', color: 'text-orange-600', bg: 'bg-orange-50', icon: TrendingUp };
    if (tsb > 5) return { label: 'Recovering', color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingDown };
    return { label: 'Optimal', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Minus };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`${status.bg} p-3 rounded-xl`}>
            <Activity className={`w-6 h-6 ${status.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Training Load</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`w-4 h-4 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full sm:w-auto">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-slate-600 mb-1">CTL (Fitness)</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{ctl.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs sm:text-sm text-slate-600 mb-1">ATL (Fatigue)</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{atl.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs sm:text-sm text-slate-600 mb-1">TSB (Form)</div>
            <div className={`text-xl sm:text-2xl font-bold ${status.color}`}>{tsb > 0 ? '+' : ''}{tsb.toFixed(0)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-slate-600">CTL tracks long-term fitness</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-slate-600">ATL tracks recent fatigue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-600">TSB shows current form</span>
          </div>
        </div>
      </div>
    </div>
  );
}
