import { useState, useEffect } from 'react';
import { User, Mail, Calendar, LogOut, Save, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileData {
  full_name: string | null;
  current_ctl: number;
  current_atl: number;
  created_at: string;
}

interface LifetimeStats {
  totalSessions: number;
  totalMinutes: number;
  totalTSS: number;
  disciplineCounts: Record<string, number>;
}

interface ProfileViewProps {
  profileData: ProfileData | null;
  onProfileUpdate: (name: string | null) => void;
}

export function ProfileView({ profileData, onProfileUpdate }: ProfileViewProps) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<LifetimeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profileData?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const workoutsRes = await supabase
        .from('workouts')
        .select('discipline, duration_minutes, tss')
        .eq('user_id', user.id);

      if (workoutsRes.data) {
        const ww = workoutsRes.data;
        const counts: Record<string, number> = {};
        ww.forEach(w => { counts[w.discipline] = (counts[w.discipline] || 0) + 1; });
        setStats({
          totalSessions: ww.length,
          totalMinutes: ww.reduce((s, w) => s + (w.duration_minutes || 0), 0),
          totalTSS: ww.reduce((s, w) => s + (w.tss || 0), 0),
          disciplineCounts: counts,
        });
      }
      setStatsLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nameInput.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      setSaveError('Failed to save. Please try again.');
    } else {
      onProfileUpdate(nameInput.trim() || null);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const fmt = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const initials = (profileData?.full_name ?? user?.email ?? '??')
    .split(/\s+/)
    .map(s => s[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const disciplineColors: Record<string, string> = {
    swim: 'bg-sky-100 text-sky-700',
    bike: 'bg-amber-100 text-amber-700',
    run: 'bg-green-100 text-green-700',
    strength: 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="max-w-2xl space-y-3 sm:space-y-5">

      {/* ── Profile card ─────────────────────────────── */}
      <div className="bg-white border border-slate-200">
        {/* Mobile: stacked centered layout */}
        <div className="flex flex-col items-center px-5 pt-7 pb-5 sm:hidden">
          <div className="w-20 h-20 rounded-full bg-blue-700 flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>

          {isEditing ? (
            <div className="w-full space-y-2 mt-1">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-slate-300 p-2.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                autoFocus
              />
              {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setNameInput(profileData?.full_name ?? ''); setSaveError(''); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-300 text-sm font-medium text-slate-600 hover:border-slate-400 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xl font-bold text-slate-900 text-center">
                {profileData?.full_name ?? <span className="text-slate-400 font-normal italic">No name set</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500 max-w-full">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              {memberSince && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  Member since {memberSince}
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 border border-slate-300 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </>
          )}
        </div>

        {/* Desktop: horizontal layout */}
        <div className="hidden sm:flex items-start gap-4 p-6">
          <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-slate-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                  autoFocus
                />
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setNameInput(profileData?.full_name ?? ''); setSaveError(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-xs font-medium text-slate-600 hover:border-slate-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {profileData?.full_name ?? <span className="text-slate-400 font-normal">No name set</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email}
                  </div>
                  {memberSince && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      Member since {memberSince}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-xs font-medium text-slate-600 hover:border-slate-400 transition shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lifetime stats ───────────────────────────── */}
      {statsLoading ? (
        <div className="bg-white border border-slate-200 p-5 sm:p-6">
          <div className="text-sm text-slate-400">Loading stats…</div>
        </div>
      ) : stats && (
        <div className="bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Lifetime Stats
          </h2>

          {/* Responsive stat grid: 2-col on mobile, 3-col on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div className="border border-slate-100 bg-slate-50 p-3 sm:p-0 sm:bg-transparent sm:border-0">
              <div className="text-2xl font-bold text-slate-900">{stats.totalSessions}</div>
              <div className="text-xs text-slate-400 mt-0.5">Sessions</div>
            </div>
            <div className="border border-slate-100 bg-slate-50 p-3 sm:p-0 sm:bg-transparent sm:border-0">
              <div className="text-2xl font-bold text-slate-900">{fmt(stats.totalMinutes)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Total Volume</div>
            </div>
          </div>

          {Object.keys(stats.disciplineCounts).length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">By Discipline</div>
              {/* Mobile: full-width rows; sm+: wrapping pills */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {Object.entries(stats.disciplineCounts).map(([d, count]) => (
                  <div
                    key={d}
                    className={`flex items-center justify-between sm:justify-start sm:gap-2 px-3 py-2.5 sm:py-1 text-sm sm:text-xs font-semibold rounded-sm ${disciplineColors[d] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    <span className="capitalize">{d}</span>
                    <span className="sm:hidden text-xs font-normal opacity-70">{count} {count === 1 ? 'session' : 'sessions'}</span>
                    <span className="hidden sm:inline">— {count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Account actions ──────────────────────────── */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Account</h2>
        <button
          onClick={signOut}
          className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
