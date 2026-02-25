import { AlertTriangle, X } from 'lucide-react';

interface VolumeAlertProps {
  increase: number;
  onClose: () => void;
}

export function VolumeAlert({ increase, onClose }: VolumeAlertProps) {
  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900">Run Volume Increase Detected</h3>
          <p className="text-sm text-amber-800 mt-1">
            Your running volume increased by <span className="font-bold">{increase}%</span> this week compared to last week. Monitor for injury risk and consider adding extra recovery days.
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-amber-600 hover:text-amber-900 flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
