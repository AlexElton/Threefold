import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import App from './App.tsx';
import 'leaflet/dist/leaflet.css';
import '@/styles/index.css';
import { AuthProvider } from '@/features/auth/context/AuthContext';

// Initialize Application Insights
export const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
  },
});

if (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING) {
  appInsights.loadAppInsights();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
