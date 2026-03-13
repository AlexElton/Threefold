import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LandingPage } from '@/pages/LandingPage';
import { exchangeStravaCode, syncStravaActivities } from '@/services/strava';
import { extractStravaCallback } from '@/utils/strava';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [stravaCallbackPending, setStravaCallbackPending] = useState(() => !!extractStravaCallback());

  useEffect(() => {
    if (!user || !stravaCallbackPending) return;

    const callback = extractStravaCallback();
    if (!callback) { setStravaCallbackPending(false); return; }

    // Clear the OAuth params from the URL immediately
    window.history.replaceState({}, '', window.location.pathname);
    setStravaCallbackPending(false);

    (async () => {
      try {
        const connection = await exchangeStravaCode(callback.code, user.id);
        // Import the last 3 months of activities right after connecting
        await syncStravaActivities(user.id, connection, true);
      } catch {
        // Errors will surface on the next manual sync; connection is non-critical
      }
    })();
  }, [user, stravaCallbackPending]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600 text-sm font-medium">Loading workspace...</div>
      </div>
    );
  }

  if (user) return <DashboardPage />;
  if (authMode) return <AuthPage onBack={() => setAuthMode(null)} initialMode={authMode} />;
  return <LandingPage onSignIn={() => setAuthMode('login')} onGetStarted={() => setAuthMode('signup')} />;
}

export default App;
