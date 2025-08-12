import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PhantomWalletButton } from './PhantomWalletButton';
import { usePhantomWallet } from '@/contexts/PhantomWalletProvider';
import { createLogger } from '@/utils/logger';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Import components
import { NetworkSelector } from '@/components/NetworkSelector';
import LanguageSelector from '@/components/LanguageSelector';
import OnboardingModal from '@/components/OnboardingModal';
import PWAInstallButton from '@/components/PWAInstallButton';
import OfflineIndicator from '@/components/OfflineIndicator';
import ProfileDropdown from '@/components/ProfileDropdown';

const logger = createLogger('Layout');

export default function Layout({ children, title = 'OpenSVM P2P Exchange' }) {
  const { 
    network, 
    selectedNetwork, 
    setSelectedNetwork, 
    networks 
  } = useContext(AppContext);
  
  const router = useRouter();
  const { connected, publicKey } = usePhantomWallet();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Language selector state
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // Available languages
  const languages = [
    { code: 'en', name: 'English', country: '🇺🇸' },
    { code: 'es', name: 'Español', country: '🇪🇸' },
    { code: 'fr', name: 'Français', country: '🇫🇷' },
    { code: 'de', name: 'Deutsch', country: '🇩🇪' },
    { code: 'ja', name: '日本語', country: '🇯🇵' },
    { code: 'ko', name: '한국어', country: '🇰🇷' },
    { code: 'zh', name: '中文', country: '🇨🇳' }
  ];
  
  // Load language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);
  
  // Handle language change
  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('preferred-language', languageCode);
  };

  // Check if user needs onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
    if (!hasCompletedOnboarding && !connected) {
      // Show onboarding after a short delay for better UX
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connected]);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('Service Worker registered successfully', { registration });
        })
        .catch((registrationError) => {
          logger.error('Service Worker registration failed', { error: registrationError.message });
        });
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  // Top navbar items (main navigation sections)
  const topNavItems = [
    { key: 'buy', label: 'BUY', icon: 'B', href: '/buy' },
    { key: 'sell', label: 'SELL', icon: 'S', href: '/sell' },
    { key: 'analytics', label: 'ANALYTICS', icon: '📊', href: '/analytics' },
    { key: 'help', label: 'HELP', icon: '?', href: '/help' },
  ];

  // Mobile navigation items (includes profile items for mobile grid)
  const mobileNavItems = [
    { key: 'buy', label: 'BUY', icon: 'B', href: '/buy' },
    { key: 'sell', label: 'SELL', icon: 'S', href: '/sell' },
    { key: 'analytics', label: 'ANALYTICS', icon: '📊', href: '/analytics' },
    { key: 'help', label: 'HELP', icon: '?', href: '/help' },
    { key: 'profile', label: 'PROFILE', icon: 'P', href: '/profile' },
    { key: 'myoffers', label: 'MY OFFERS', icon: 'M', href: '/myoffers' },
    { key: 'disputes', label: 'DISPUTES', icon: 'D', href: '/disputes' },
    { key: 'rewards', label: 'REWARDS', icon: '🎁', href: '/rewards' },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Accessibility: Skip to main content link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <div className="app-layout">
        {/* ASCII Header with proper responsive design */}
        <header className="ascii-header">
          <div className="ascii-header-content">
            {/* Logo Section */}
            <div className="ascii-logo-section">
              <Image 
                src="/images/opensvm-logo.svg" 
                alt="OpenSVM P2P Exchange" 
                className="ascii-logo-image"
                width={20}
                height={20}
                priority
              />
              <h1 className="ascii-logo-text">OPENSVM P2P</h1>
            </div>
            
            {/* Desktop Navigation - ASCII Styled with Full Width */}
            <nav className="ascii-nav-desktop">
              <div className="ascii-nav-tabs">
                {/* Primary navigation items */}
                {topNavItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`ascii-nav-tab ${router.pathname === item.href ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {/* Profile dropdown for secondary navigation */}
                <ProfileDropdown />
              </div>
            </nav>
            
            {/* Header Controls - Simplified */}
            <div className="ascii-header-controls">
              {/* Language selector */}
              <LanguageSelector
                languages={languages}
                currentLocale={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
              
              {/* Network selector */}
              <NetworkSelector 
                networks={networks} 
                selectedNetwork={selectedNetwork} 
                onSelectNetwork={setSelectedNetwork} 
              />
              
              {/* Connected wallet info */}
              {connected && publicKey && (
                <span className="ascii-wallet-status">
                  {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
                </span>
              )}
              
              {/* Phantom wallet connection button */}
              <div className="ascii-wallet-container">
                <PhantomWalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation - ASCII Grid Layout */}
        <nav className="ascii-nav-mobile">
          <div className="ascii-nav-grid">
            {/* All navigation items in mobile grid */}
            {mobileNavItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`ascii-nav-button ${router.pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        
        {/* Main Content */}
        <main id="main-content" className="app-main">
          <div className="container content-container">
            <div className="content-transition-wrapper fade-in">
              {children}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="app-footer">
          <div className="container">
            <div className="text-center">
              <p className="text-sm text-foreground-muted">
                © 2025 OpenSVM P2P Exchange. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </>
  );
}
