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

  const navigationItems = [
    { key: 'buy', label: 'Buy', icon: '💰' },
    { key: 'sell', label: 'Sell', icon: '💸' },
    { key: 'myoffers', label: 'My Offers', icon: '📋' },
    { key: 'disputes', label: 'Disputes', icon: '⚖️' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app-layout">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            {/* Logo Section */}
            <div className="logo-section">
              <Image 
                src="/images/opensvm-logo.svg" 
                alt="OpenSVM P2P Exchange" 
                className="logo-image"
                width={32}
                height={32}
                priority
              />
              <h1 className="logo-text">OpenSVM P2P</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="header-nav">
              <div className="nav-tabs">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    className={`nav-tab ${activeTab === item.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <span className="nav-icon hidden sm:inline">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
            
            {/* Header Actions */}
            <div className="header-actions">
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
              
              <div className="wallet-container">
                <WalletMultiButton />
                {connected && <WalletDisconnectButton />}
              </div>
              
              {/* Mobile Menu Button */}
              <button
                className="mobile-menu-button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open mobile menu"
              >
                ☰
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${mobileNavOpen ? 'open' : ''}`}>
          <div className="mobile-nav-header">
            <div className="logo-section">
              <Image 
                src="/images/opensvm-logo.svg" 
                alt="OpenSVM P2P Exchange" 
                className="logo-image"
                width={32}
                height={32}
              />
              <h2 className="logo-text">OpenSVM P2P</h2>
            </div>
            <button
              className="mobile-nav-close"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close mobile menu"
            >
              ✕
            </button>
          </div>
          
          <div className="mobile-nav-content">
            <div className="mobile-nav-section">
              <h3>Navigation</h3>
              <div className="mobile-nav-links">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    className={`mobile-nav-link ${activeTab === item.key ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.key);
                      setMobileNavOpen(false);
                    }}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mobile-nav-section">
              <h3>Wallet</h3>
              <div className="mobile-nav-links">
                <div className="wallet-container">
                  <WalletMultiButton />
                  {connected && <WalletDisconnectButton />}
                </div>
              </div>
            </div>
            
            <div className="mobile-nav-section">
              <h3>Settings</h3>
              <div className="mobile-nav-links">
                <div className="flex gap-3">
                  <LanguageSelector
                    currentLocale={currentLocale}
                    onLanguageChange={handleLanguageChange}
                  />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="app-main">
          <div className="container">
            {children}
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
                <a 
                  href={network.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-muted hover:text-primary transition-colors"
                >
                  {network.name} Explorer
                </a>
                <span className="text-sm text-foreground-muted">
                  {connected && publicKey && (
                    <>Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</>
                  )}
                </span>
              </div>
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
    </>
  );
}
