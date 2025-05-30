import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useSafeWallet } from '@/contexts/WalletContextProvider';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Import components
import { NetworkSelector } from '@/components/NetworkSelector';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';
import OnboardingModal from '@/components/OnboardingModal';
import PWAInstallButton from '@/components/PWAInstallButton';

export default function Layout({ children, title = 'OpenSVM P2P Exchange' }) {
  const { 
    network, 
    selectedNetwork, 
    setSelectedNetwork, 
    activeTab, 
    setActiveTab,
    networks 
  } = useContext(AppContext);
  
  const { connected, publicKey } = useSafeWallet();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');

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
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
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

  const handleLanguageChange = (locale) => {
    setCurrentLocale(locale);
    localStorage.setItem('preferred-language', locale);
    // In a real app, you'd use next-i18next router here
    console.log('Language changed to:', locale);
  };

  // Top navbar items (most important sections)
  const topNavItems = [
    { key: 'buy', label: 'BUY', icon: 'B' },
    { key: 'sell', label: 'SELL', icon: 'S' },
    { key: 'help', label: 'HELP', icon: '?' },
  ];

  // Sidebar navigation items (secondary sections)
  const sidebarNavItems = [
    { key: 'myoffers', label: 'MY OFFERS', icon: 'M' },
    { key: 'disputes', label: 'DISPUTES', icon: 'D' },
    { key: 'profile', label: 'PROFILE', icon: 'P' },
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

      <div className="app-layout-sidebar">
        {/* Main Content Area */}
        <div className="app-content">
          {/* Top Header */}
          <header className="app-header-slim">
            <div className="header-content-slim">
              {/* Mobile Menu Button */}
              <button
                className="mobile-menu-button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open sidebar"
              >
                <span>≡</span>
              </button>
              
              <div className="logo-section">
                <Image 
                  src="/images/opensvm-logo.svg" 
                  alt="OpenSVM P2P Exchange" 
                  className="logo-image"
                  width={24}
                  height={24}
                  priority
                />
                <h1 className="logo-text">OpenSVM P2P</h1>
              </div>
              
              {/* Top Navigation - Desktop */}
              <nav className="header-nav">
                {topNavItems.map((item) => (
                  <button
                    key={item.key}
                    className={`nav-tab ${
                      activeTab === item.key ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <span className="nav-label">{item.label}</span>
                  </button>
                ))}
                
                {/* Added secondary navigation items to the horizontal nav */}
                {sidebarNavItems.map((item) => (
                  <button
                    key={item.key}
                    className={`nav-tab ${
                      activeTab === item.key ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <span className="nav-label">{item.label}</span>
                  </button>
                ))}
              </nav>
              
              {/* Header Info */}
              <div className="header-info">
                {connected && publicKey && (
                  <span className="connection-status">
                    Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                  </span>
                )}
                
                {/* Install App button - moved to header for better prominence */}
                <div className="header-actions">
                  <PWAInstallButton className="header-prominent-action" />
                </div>
                
                {/* Wallet button moved to header for better accessibility */}
                {!connected && (
                  <div className="header-wallet-container">
                    <WalletMultiButton />
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main id="main-content" className="app-main-content">
            <div className="container">
              <div className="content-transition-wrapper fade-in">
                {children}
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="app-footer">
            <div className="container">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-foreground-muted">
                  © 2025 OpenSVM P2P Exchange. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <NetworkSelector 
                    networks={networks} 
                    selectedNetwork={selectedNetwork} 
                    onSelectNetwork={setSelectedNetwork} 
                  />
                  <LanguageSelector
                    currentLocale={currentLocale}
                    onLanguageChange={handleLanguageChange}
                  />
                  <ThemeToggle />
                  <PWAInstallButton />
                  {connected && <WalletDisconnectButton />}
                  <a 
                    href={network.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-foreground-muted hover:text-primary transition-colors"
                  >
                    {network.name} Explorer
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
}
