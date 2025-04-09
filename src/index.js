import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Create a loading component for Suspense fallback
const LoadingApp = () => (
  <div className="app-loading">
    <div className="loading-spinner"></div>
    <p>Loading application...</p>
  </div>
);

// Lazy load the App component for code splitting
const App = lazy(() => import('./App'));

// Create root and render app with Suspense for code splitting
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app with Suspense for code splitting
root.render(
  <Suspense fallback={<LoadingApp />}>
    <App />
  </Suspense>
);

// Import responsive styles
import './styles/responsive.css';
