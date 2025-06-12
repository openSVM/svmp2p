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
  const wallet = useSafeWallet(); // Get the full wallet object for enhanced status
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      setCurrentLocale(savedLanguage);
    }
  }, [supportedLanguages]);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Enhanced wallet status renderer with better UX feedback
  const renderWalletStatus = () => {
    if (wallet.error) {
      return (
        <div className="wallet-status error" title={wallet.error}>
          <span className="status-dot error" aria-hidden="true"></span>
          <span>Error</span>
          {wallet.reconnect && (
            <button 
              className="wallet-retry-button" 
              onClick={() => wallet.reconnect()}
              title="Retry connection"
              aria-label="Retry wallet connection"
            >
              ↻
            </button>
          )}
        </div>
      );
    }

    if (wallet.connecting || wallet.connectionState === 'connecting') {
      return (
        <div className="wallet-status connecting">
          <span className="status-dot connecting pulsing" aria-hidden="true"></span>
          <span>Connecting...</span>
        </div>
      );
    }

    if (wallet.connected && wallet.publicKey) {
      return (
        <div className="wallet-status connected">
          <span className="status-dot connected" aria-hidden="true"></span>
          <span className="connection-address">
            {wallet.publicKey.toString().slice(0, 4)}...{wallet.publicKey.toString().slice(-4)}
          </span>
        </div>
      );
    }

    return (
      <div className="wallet-status disconnected">
        <span className="status-dot disconnected" aria-hidden="true"></span>
        <span>Not Connected</span>
      </div>
    );
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
  ];

  // Supported languages
  const supportedLanguages = [
    { code: 'en', name: 'English', country: '🇺🇸' },
    { code: 'es', name: 'Español', country: '🇪🇸' },
    { code: 'fr', name: 'Français', country: '🇫🇷' },
    { code: 'de', name: 'Deutsch', country: '🇩🇪' },
    { code: 'ja', name: '日本語', country: '🇯🇵' },
    { code: 'ko', name: '한국어', country: '🇰🇷' },
    { code: 'zh', name: '中文', country: '🇨🇳' },
    { code: 'pt', name: 'Português', country: '🇵🇹' },
    { code: 'ru', name: 'Русский', country: '🇷🇺' },
    { code: 'ar', name: 'العربية', country: '🇸🇦' },
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
        {/* Top Header */}
        <header className="app-header">
          <div className="header-content">
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
            
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
            </button>
            
            {/* Desktop Navigation - Horizontal layout for desktop */}
            <nav className="desktop-nav">
              {/* Primary navigation items */}
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
              
              {/* Secondary navigation items (previously in sidebar) */}
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
            
            {/* RIGHT SIDE: ALL HEADER CONTROLS */}
            <div className="header-controls">
              {/* PROFILE element - now properly in the flex container */}
              <div className="profile-nav">
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('profile');
                  }}
                >
                  PROFILE
                </a>
              </div>
              
              {/* Network selector */}
              <NetworkSelector 
                networks={networks} 
                selectedNetwork={selectedNetwork} 
                onSelectNetwork={setSelectedNetwork} 
              />
              
              {/* Language selector */}
              <LanguageSelector
                languages={supportedLanguages}
                currentLocale={currentLocale}
                onLanguageChange={handleLanguageChange}
              />
              
              {/* Theme toggle */}
              <ThemeToggle />
              
              {/* Explorer link */}
              <a 
                href={network.explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="explorer-link"
              >
                SOLANA EXPLORER
              </a>
              
              {/* Install App button with proper prominence */}
              <PWAInstallButton className="header-prominent-action" />
              
              {/* Wallet connection area with enhanced status */}
              <div className="wallet-connection-area">
                {renderWalletStatus()}
                
                {/* Wallet connection button */}
                {!connected && (
                  <div className="header-wallet-container">
                    <WalletMultiButton />
                  </div>
                )}
                
                {/* Disconnect button for connected users */}
                {connected && <WalletDisconnectButton />}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation - Collapsible below header */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
          <div className="mobile-nav-buttons">
            {/* Primary navigation items */}
            {topNavItems.map((item) => (
              <button
                key={item.key}
                className={`mobile-nav-btn ${
                  activeTab === item.key ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsMobileMenuOpen(false); // Close menu after selection
                }}
              >
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
            
            {/* Secondary navigation items */}
            {sidebarNavItems.map((item) => (
              <button
                key={item.key}
                className={`mobile-nav-btn ${
                  activeTab === item.key ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsMobileMenuOpen(false); // Close menu after selection
                }}
              >
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
            
            {/* Mobile wallet controls */}
            <div className="mobile-wallet-controls">
              {/* Enhanced wallet status for mobile */}
              <div className="mobile-wallet-status">
                {renderWalletStatus()}
              </div>
              
              {!connected && (
                <div className="mobile-wallet-container">
                  <WalletMultiButton />
                </div>
              )}
              {connected && (
                <div className="mobile-wallet-disconnect">
                  <WalletDisconnectButton />
                </div>
              )}
            </div>
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
    </>
  );
}
