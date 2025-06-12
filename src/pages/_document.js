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
        
        {/* Preload critical CSS */}
        <link rel="preload" href="/css/critical.css" as="style" onLoad="this.onload=null;this.rel='stylesheet'" />
        <noscript><link rel="stylesheet" href="/css/critical.css" /></noscript>
        
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
        <link rel="apple-touch-icon" href="/images/icon-192x192.svg" />

        {/* Optimized Security Headers */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
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