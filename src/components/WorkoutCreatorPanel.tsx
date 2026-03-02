import { useState, useEffect } from 'react';
import { X, Bike, Droplets, Footprints, Dumbbell, RefreshCw } from 'lucide-react';
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
  const [durationInput, setDurationInput] = useState('60');
  const [intensity, setIntensity] = useState<Intensity>('endurance');
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [increaseByTen, setIncreaseByTen] = useState(false);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (existingWorkout) {
      setDiscipline(existingWorkout.discipline);
      setDurationInput(String(existingWorkout.duration_minutes));
      setIntensity(existingWorkout.intensity as Intensity);
    } else {
      setDiscipline('bike');
      setDurationInput('60');
      setIntensity('endurance');
    }
    setIsRecurring(false);
    setIncreaseByTen(false);
    setEndDate('');
  }, [existingWorkout, isOpen]);

  const parsedDuration = Number.parseInt(durationInput, 10);
  const duration = Number.isNaN(parsedDuration) ? 0 : parsedDuration;
  const isDurationValid = duration > 0;

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

  const addWeeks = (dateStr: string, weeks: number): string => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + weeks * 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isEndDateValid = !isRecurring || (endDate !== '' && endDate > selectedDate);

  const handleSave = async () => {
    if (!user) return;
    if (duration <= 0) return;
    if (!isEndDateValid) return;

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
      } else if (isRecurring && endDate) {
        const rows: object[] = [];
        let week = 0;
        let currentDate = selectedDate;
        while (currentDate <= endDate) {
          const factor = increaseByTen ? Math.pow(1.1, week) : 1;
          const weekDuration = Math.round(duration * factor);
          const baseFactor: Record<Intensity, number> = {
            recovery: 0.4, endurance: 0.7, threshold: 1.0, intervals: 1.2,
            technique: 0.6, upper_body: 0.8, lower_body: 0.9, core: 0.7,
          };
          const weekTSS = Math.round(weekDuration * (baseFactor[intensity] || 0.7));
          rows.push({
            user_id: user.id,
            date: currentDate,
            discipline,
            intensity,
            duration_minutes: weekDuration,
            tss: weekTSS,
            completed: false,
          });
          week++;
          currentDate = addWeeks(selectedDate, week);
        }
        const { error } = await supabase.from('workouts').insert(rows);
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
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-5 flex justify-between items-start">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              {existingWorkout ? 'Edit' : 'Create'} Workout
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{formatDate(selectedDate)}</p>
          </div>
          <button onClick={onClose} className="p-2 border border-slate-300 hover:border-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div>
            <label className="font-medium text-sm sm:text-base mb-2 block text-slate-900">
              Discipline
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DISCIPLINE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setDiscipline(value);
                    const newOptions = DISCIPLINE_INTENSITY_MAP[value];
                    if (!newOptions.includes(intensity)) {
                      setIntensity(newOptions[0]);
                    }
                  }}
                  className={`p-2 sm:p-3 border flex flex-col items-center gap-1 transition ${
                    discipline === value
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400'
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-slate-300 p-2 sm:p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>

          <div>
            <label className="font-medium text-sm sm:text-base block mb-2 text-slate-900">
              Effort / Intensity
            </label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as Intensity)}
              className="w-full border border-slate-300 p-2 sm:p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
            >
              {getIntensityOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 text-sm text-slate-700">
            Estimated TSS: <span className="font-semibold text-slate-900">{calculateTSS()}</span>
          </div>

          {!existingWorkout && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Repeat every week</span>
                </div>
                <button
                  onClick={() => setIsRecurring(v => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isRecurring ? 'bg-blue-700' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      isRecurring ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {isRecurring && (
                <>
                  <div className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50">
                    <div>
                      <span className="text-sm font-medium text-slate-900">Increase duration by 10% each week</span>
                      <p className="text-xs text-slate-500 mt-0.5">Week 1: {duration} min → Week 2: {Math.round(duration * 1.1)} min → Week 3: {Math.round(duration * 1.21)} min…</p>
                    </div>
                    <button
                      onClick={() => setIncreaseByTen(v => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        increaseByTen ? 'bg-blue-700' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          increaseByTen ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="font-medium text-sm block mb-1.5 text-slate-900">
                      End date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={addWeeks(selectedDate, 1)}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-slate-300 p-2 sm:p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                    />
                    {endDate && endDate > selectedDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        {Math.floor((new Date(endDate).getTime() - new Date(selectedDate + 'T00:00:00').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1} workout{Math.floor((new Date(endDate).getTime() - new Date(selectedDate + 'T00:00:00').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1 !== 1 ? 's' : ''} will be created
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !isDurationValid || !isEndDateValid}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 sm:py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading
              ? 'Saving...'
              : !isDurationValid
              ? 'Enter Duration'
              : isRecurring && !endDate
              ? 'Select an End Date'
              : 'Save Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
