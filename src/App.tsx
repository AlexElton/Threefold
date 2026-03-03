import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

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
