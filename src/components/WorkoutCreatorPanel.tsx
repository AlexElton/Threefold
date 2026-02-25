import { useState, useEffect } from 'react';
import { X, Bike, Droplets, Footprints, Dumbbell } from 'lucide-react';
import { Discipline, Intensity, DISCIPLINE_INTENSITY_MAP, INTENSITY_LABELS } from '../types';
import { Workout } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WorkoutCreatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onWorkoutCreated: () => void;
  existingWorkout?: Workout | null;
}

const DISCIPLINE_OPTIONS = [
  { value: 'swim', label: 'Swim', icon: Droplets },
  { value: 'bike', label: 'Bike', icon: Bike },
  { value: 'run', label: 'Run', icon: Footprints },
  { value: 'strength', label: 'Strength', icon: Dumbbell },
] as const;

export function WorkoutCreatorPanel({
  isOpen,
  onClose,
  selectedDate,
  onWorkoutCreated,
  existingWorkout,
}: WorkoutCreatorPanelProps) {
  const { user } = useAuth();

  const [discipline, setDiscipline] = useState<Discipline>('bike');
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState<Intensity>('endurance');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingWorkout) {
      setDiscipline(existingWorkout.discipline);
      setDuration(existingWorkout.duration_minutes);
      setIntensity(existingWorkout.intensity as Intensity);
    } else {
      setDiscipline('bike');
      setDuration(60);
      setIntensity('endurance');
    }
  }, [existingWorkout, isOpen]);

  const getIntensityOptions = () => {
    return DISCIPLINE_INTENSITY_MAP[discipline].map(value => ({
      value,
      label: INTENSITY_LABELS[value as Intensity],
    }));
  };

  const calculateTSS = () => {
    const baseFactors: Record<Intensity, number> = {
      recovery: 0.4,
      endurance: 0.7,
      threshold: 1.0,
      intervals: 1.2,
      technique: 0.6,
      upper_body: 0.8,
      lower_body: 0.9,
      core: 0.7,
    };
    return Math.round(duration * (baseFactors[intensity] || 0.7));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      if (existingWorkout) {
        const { error } = await supabase
          .from('workouts')
          .update({
            discipline,
            intensity,
            duration_minutes: duration,
            tss: calculateTSS(),
          })
          .eq('id', existingWorkout.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('workouts').insert({
          user_id: user.id,
          date: selectedDate,
          discipline,
          intensity,
          duration_minutes: duration,
          tss: calculateTSS(),
          completed: false,
        });

        if (error) throw error;
      }

      onWorkoutCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {existingWorkout ? 'Edit' : 'Create'} Workout
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{formatDate(selectedDate)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="font-medium text-sm sm:text-base mb-3 block text-slate-900">
              Discipline
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DISCIPLINE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setDiscipline(value);
                    const newOptions = DISCIPLINE_INTENSITY_MAP[value];
                    if (!newOptions.includes(intensity as any)) {
                      setIntensity(newOptions[0]);
                    }
                  }}
                  className={`p-2 sm:p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                    discipline === value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-medium text-sm sm:text-base block mb-2 text-slate-900">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              min={5}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2 sm:p-3 text-sm"
            />
          </div>

          <div>
            <label className="font-medium text-sm sm:text-base block mb-2 text-slate-900">
              Effort / Intensity
            </label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as Intensity)}
              className="w-full border border-slate-300 rounded-lg p-2 sm:p-3 text-sm"
            >
              {getIntensityOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg text-sm text-slate-700">
            Estimated TSS: <span className="font-bold text-slate-900">{calculateTSS()}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 sm:py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
