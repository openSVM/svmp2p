import React, { useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Import styles - order matters for CSS
// IMPORTANT: In CSS files, all @import statements must be at the top of the file
// with proper formatting and line breaks between them and the first CSS rule.
// Next.js strictly enforces this CSS specification.
// 
// CSS Import Order:
// 1. First import index.css with Tailwind directives (@tailwind base, components, utilities)
//    This is critical as it establishes the Tailwind foundation for all other styles
// 2. Then import third-party component styles (wallet adapter)
// 3. Finally import global styles which may override Tailwind or third-party styles
//
// This specific order ensures proper CSS cascade and specificity
import '../index.css'; // Main CSS file with Tailwind directives (must be first)
import '@solana/wallet-adapter-react-ui/styles.css'; // Third-party component styles
import '@/styles/globals.css'; // Global styles and overrides
import '@/styles/header-mobile-improvements.css'; // Header mobile improvements
import '@/styles/dropdown-fixes.css'; // Dropdown functionality fixes
import '@/styles/hamburger-improvements.css'; // Hamburger menu line differentiation
import '@/styles/tech-debt-fixes.css'; // Tech debt fixes and improvements
import '@/styles/language-selector.css'; // Language selector styles

// Import context
import { AppContextProvider } from '@/contexts/AppContext';

// Import Layout
import Layout from '@/components/Layout';

// Import ErrorBoundary directly instead of dynamically to avoid initialization issues
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }) {
  // Set up wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  // Initialize basic performance monitoring
  useEffect(() => {
    // Simple font preloading without complex utilities
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
          <ConnectionProvider endpoint={network.endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        )}
      </AppContextProvider>
    </ErrorBoundary>
  );
}
