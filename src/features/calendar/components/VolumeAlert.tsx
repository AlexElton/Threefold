import { AlertTriangle, X } from 'lucide-react';

interface VolumeAlertProps {
  increase: number;
  onClose: () => void;
}

export function VolumeAlert({ increase, onClose }: VolumeAlertProps) {
  return (
    <div className="mb-4 bg-orange-50 border border-orange-200 p-3 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-orange-900">Run Load Alert</h3>
          <p className="text-sm text-orange-800 mt-1">
            Running volume is <span className="font-semibold">{increase}%</span> above last week. Review fatigue signals and adjust recovery if needed.
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-orange-600 hover:text-orange-900 flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
