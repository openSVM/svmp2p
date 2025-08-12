import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload critical resources for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Optimized font loading with display=swap for better FCP */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
        />
        
        {/* Critical CSS will be handled by Next.js CSS imports */}
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//api.devnet.solana.com" />
        <link rel="dns-prefetch" href="//solana-devnet-rpc.allthatnode.com" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="OpenSVM P2P Exchange" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpenSVM P2P" />
        <meta name="description" content="A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Optimized Icons with proper sizing */}
        <link rel="icon" type="image/svg+xml" href="/images/opensvm-logo.svg" />
        <link rel="icon" type="image/svg+xml" sizes="192x192" href="/images/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="512x512" href="/images/icon-512x512.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/icon-512x512.png" />
        <link rel="apple-touch-icon" href="/images/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/images/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/images/icon-512x512.png" />

        {/* PWA Performance & Caching Hints */}
        <link rel="preload" href="/manifest.json" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/sw.js" as="script" />
        <link rel="prefetch" href="/images/icon-192x192.svg" />
        <link rel="prefetch" href="/images/icon-512x512.svg" />
        
        {/* Resource hints for critical assets */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Enhanced Security Headers for external script conflicts */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; worker-src 'self'; object-src 'none';" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Performance and PWA hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* PWA Status Bar Styling */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="msapplication-starturl" content="/" />
      </Head>
      <body>
        {/* Add loading state to prevent layout shift */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.style.setProperty('--loading-opacity', '0');
              window.addEventListener('load', function() {
                document.documentElement.style.setProperty('--loading-opacity', '1');
              });
            `,
          }}
        />
        <Main />
        <NextScript />
        
        {/* Service Worker registration for better caching */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced error handling for wallet extension conflicts
              window.addEventListener('error', function(event) {
                // Known external errors to suppress
                const externalErrors = [
                  'Cannot access \'m\' before initialization',
                  'Could not establish connection',
                  'custom element',
                  'already been defined',
                  'inpage.js',
                  'binanceInjectedProvider',
                  'webcomponents-ce.js'
                ];
                
                const shouldSuppress = externalErrors.some(pattern => 
                  event.message?.includes(pattern) || event.error?.message?.includes(pattern)
                );
                
                if (shouldSuppress) {
                  event.preventDefault();
                  event.stopPropagation();
                  return false;
                }
              });
              
              window.addEventListener('unhandledrejection', function(event) {
                const reason = event.reason?.message || event.reason?.toString() || '';
                const externalErrors = [
                  'Cannot access \'m\' before initialization',
                  'inpage.js',
                  'runtime.lastError'
                ];
                
                const shouldSuppress = externalErrors.some(pattern => reason.includes(pattern));
                
                if (shouldSuppress) {
                  event.preventDefault();
                  return false;
                }
              });
              
              // Service Worker registration
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {
                    // Silent fail for service worker
                  });
                });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}