import React, { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import performance monitoring
import { initWebVitals } from '@/utils/webVitals';
import { analyzeBundleSize, useIdlePreloader } from '@/utils/lazyLoading';

// Import error handling for external script conflicts
import { setupGlobalErrorHandling } from '@/utils/errorHandling';

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
import '@/styles/routing.css'; // Routing and navigation styles

// Import context
import { AppContextProvider } from '@/contexts/AppContext';
import { PhantomWalletProvider } from '@/contexts/PhantomWalletProvider';

// Import Layout
import Layout from '@/components/Layout';

// Dynamically import EnhancedErrorBoundary to prevent SSR issues
const ErrorBoundary = dynamic(() => import('@/components/EnhancedErrorBoundary'), { ssr: false });

export default function App({ Component, pageProps }) {
  
  // Preload non-critical components during idle time
  useIdlePreloader([
    () => import('@/components/AnalyticsDashboard'),
    () => import('@/components/DisputeResolution'),
    () => import('@/components/RewardDashboard'),
    () => import('@/components/UserProfile'),
    () => import('@/components/analytics/VolumePerDayChart'),
    () => import('@/components/analytics/TopTraders')
  ]);

  // Initialize performance monitoring
  useEffect(() => {
    // Only setup error handling in browser environment
    if (typeof window !== 'undefined') {
      // Setup global error handling first to catch external script errors
      setupGlobalErrorHandling();
    }
    
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
        <div className="app-error-boundary min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  OpenSVM P2P Exchange
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Application temporarily unavailable
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              The application encountered an issue during startup. This is usually temporary and can be resolved by refreshing the page.
            </p>
            
            <div className="flex flex-col space-y-3">
              <button 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
                onClick={() => window.location.reload()}
              >
                Refresh Application
              </button>
              
              <button 
                className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Clear Cache & Refresh
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                If the problem persists, try disabling browser extensions or using an incognito window.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <AppContextProvider>
        <PhantomWalletProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </PhantomWalletProvider>
      </AppContextProvider>
    </ErrorBoundary>
  );
}
