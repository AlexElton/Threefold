import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { exchangeStravaCode, syncStravaActivities } from './lib/strava';

// Detect whether the current URL contains a Strava OAuth callback
function extractStravaCode(): { code: string; scope: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const scope = params.get('scope');
  if (code && scope?.includes('activity')) return { code, scope };
  return null;
}

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [stravaCallbackPending, setStravaCallbackPending] = useState(() => !!extractStravaCode());

  useEffect(() => {
    if (!user || !stravaCallbackPending) return;

    const callback = extractStravaCode();
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

  if (user) return <Dashboard />;
  if (authMode) return <Auth onBack={() => setAuthMode(null)} initialMode={authMode} />;
  return <LandingPage onSignIn={() => setAuthMode('login')} onGetStarted={() => setAuthMode('signup')} />;
}

export default App;
