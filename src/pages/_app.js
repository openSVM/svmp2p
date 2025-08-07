import React, { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import performance monitoring
import { initWebVitals } from '@/utils/webVitals';
import { analyzeBundleSize } from '@/utils/lazyLoading';

// Import styles - order matters for CSS
// IMPORTANT: In CSS files, all @import statements must be at the top of the file
// with proper formatting and line breaks between them and the first CSS rule.
// Next.js strictly enforces this CSS specification.
// 
// CSS Import Order:
// 1. First import index.css with Tailwind directives (@tailwind base, components, utilities)
//    This is critical as it establishes the Tailwind foundation for all other styles
// 2. Then import third-party component styles (no longer needed for Swig wallet)
// 3. Finally import global styles which may override Tailwind or third-party styles
//
// This specific order ensures proper CSS cascade and specificity
import '../index.css'; // Main CSS file with Tailwind directives (must be first)
import '@/styles/globals.css'; // Global styles and overrides
import '@/styles/EnhancedNotification.css'; // Enhanced Notification component styles
import '@/styles/TransactionAnalytics.css'; // Transaction Analytics component styles
import '@/styles/TransactionProgressIndicator.css'; // Transaction Progress Indicator component styles
import '@/styles/AnalyticsDashboard.css'; // Analytics Dashboard component styles
import '@/styles/pwa.css'; // PWA-specific styles

// Import context
import { AppContextProvider } from '@/contexts/AppContext';
import { PhantomWalletProvider } from '@/contexts/PhantomWalletProvider';

// Import Layout
import Layout from '@/components/Layout';

// Dynamically import ErrorBoundary to prevent SSR issues
const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), { ssr: false });

export default function App({ Component, pageProps }) {

  // Initialize performance monitoring
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals();
    
    // Analyze bundle size in development
    if (process.env.NODE_ENV === 'development') {
      analyzeBundleSize();
    }

    // Preload critical resources
    if (typeof window !== 'undefined') {
      // Preload important fonts
      const linkPreload = document.createElement('link');
      linkPreload.rel = 'preload';
      linkPreload.as = 'font';
      linkPreload.type = 'font/woff2';
      linkPreload.crossOrigin = 'anonymous';
      linkPreload.href = '/fonts/inter-var-latin.woff2';
      document.head.appendChild(linkPreload);
    }
  }, []);

  return (
    <ErrorBoundary
      fallback={
        <div className="app-error-boundary">
          <h1>Something went wrong</h1>
          <p>The application encountered an unexpected error.</p>
          <button 
            className="button button-primary" 
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      }
    >
      <AppContextProvider>
        {({ network }) => (
          <PhantomWalletProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </PhantomWalletProvider>
        )}
      </AppContextProvider>
    </ErrorBoundary>
  );
}
