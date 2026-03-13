import { useState, useEffect } from 'react';
import { X, Bike, Droplets, Footprints, Dumbbell, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { DISCIPLINE_INTENSITY_MAP, INTENSITY_LABELS } from '@/types';
import type { Discipline, Intensity, Workout } from '@/types';

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
  const [distanceInput, setDistanceInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('endurance');
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [increaseByTen, setIncreaseByTen] = useState(false);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (existingWorkout) {
      setDiscipline(existingWorkout.discipline);
      setDurationInput(String(existingWorkout.duration_minutes));
      setDistanceInput(existingWorkout.distance_km != null ? String(existingWorkout.distance_km) : '');
      setNotesInput(existingWorkout.notes ?? '');
      setIntensity(existingWorkout.intensity as Intensity);
    } else {
      setDiscipline('bike');
      setDurationInput('60');
      setDistanceInput('');
      setNotesInput('');
      setIntensity('endurance');
    }
    setIsRecurring(false);
    setIncreaseByTen(false);
    setEndDate('');
  }, [existingWorkout, isOpen]);

  const parsedDuration = Number.parseInt(durationInput, 10);
  const duration = Number.isNaN(parsedDuration) ? 0 : parsedDuration;
  const hasDistanceInput = distanceInput.trim() !== '';
  const parsedDistance = hasDistanceInput ? Number.parseFloat(distanceInput) : null;
  const distanceKm = hasDistanceInput && parsedDistance != null && !Number.isNaN(parsedDistance)
    ? parsedDistance
    : null;
  const notes = notesInput.trim();
  const isDurationValid = duration > 0;
  const isDistanceValid = !hasDistanceInput || (distanceKm !== null && distanceKm >= 0);

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
    if (!isDistanceValid) return;
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
            distance_km: distanceKm,
            notes,
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
            distance_km: distanceKm,
            notes,
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
          distance_km: distanceKm,
          notes,
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
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white border border-slate-300 shadow-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-4 flex items-start justify-between z-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-500">Workout Builder</p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5">
              {existingWorkout ? 'Edit Planned Workout' : 'Create Planned Workout'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{formatDate(selectedDate)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-5 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-5">
            <section className="border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-3">Workout Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    className={`px-3 py-3 border text-left transition ${
                      discipline === value
                        ? 'border-blue-700 bg-blue-50 text-blue-900'
                        : 'border-slate-300 bg-white hover:border-slate-400 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-slate-200 p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-3">Targets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
                    Distance (km)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={distanceInput}
                    onChange={(e) => {
                      const sanitized = e.target.value
                        .replace(/,/g, '.')
                        .replace(/[^0-9.]/g, '')
                        .replace(/\.(?=.*\.)/g, '');
                      setDistanceInput(sanitized);
                    }}
                    placeholder="Optional"
                    className="w-full border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Effort / Intensity
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getIntensityOptions().map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIntensity(opt.value as Intensity)}
                      className={`px-2.5 py-2 border text-sm font-medium transition ${
                        intensity === opt.value
                          ? 'border-blue-700 bg-blue-50 text-blue-900'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="border border-slate-200 p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-2">Comments</h3>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                rows={4}
                placeholder="Add workout notes, cues, objectives, or execution details"
                className="w-full border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 resize-y"
              />
            </section>

            {!existingWorkout && (
              <section className="border border-slate-200 p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Repeats</h3>

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
                        <p className="text-xs text-slate-500 mt-0.5">
                          Week 1: {duration} min | Week 2: {Math.round(duration * 1.1)} min | Week 3: {Math.round(duration * 1.21)} min
                        </p>
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
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
                        End date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={addWeeks(selectedDate, 1)}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                      />
                      {endDate && endDate > selectedDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          {Math.floor((new Date(endDate).getTime() - new Date(selectedDate + 'T00:00:00').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1} workout{Math.floor((new Date(endDate).getTime() - new Date(selectedDate + 'T00:00:00').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1 !== 1 ? 's' : ''} will be created
                        </p>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>

          <aside className="border border-slate-200 bg-slate-50 p-4 sm:p-5 h-fit lg:sticky lg:top-[92px]">
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-500 mb-2">Summary</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Discipline</span>
                <span className="font-semibold text-slate-900 capitalize">{discipline}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Intensity</span>
                <span className="font-semibold text-slate-900">{INTENSITY_LABELS[intensity]}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900">{duration > 0 ? `${duration} min` : 'Not set'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Distance</span>
                <span className="font-semibold text-slate-900">{distanceKm != null ? `${distanceKm} km` : 'Optional'}</span>
              </div>
            </div>

            <div className="mt-4 border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Load</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{calculateTSS()} TSS</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Comments Preview</p>
              <p className="text-sm text-slate-600 min-h-[40px] line-clamp-3">
                {notes || 'No comments added'}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !isDurationValid || !isDistanceValid || !isEndDateValid}
              className="w-full mt-5 bg-blue-700 hover:bg-blue-800 text-white py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading
                ? 'Saving...'
                : !isDurationValid
                ? 'Enter Duration'
                : !isDistanceValid
                ? 'Enter Valid Km'
                : isRecurring && !endDate
                ? 'Select an End Date'
                : 'Save Workout'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
