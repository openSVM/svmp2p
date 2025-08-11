import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { clusterApiUrl } from '@solana/web3.js';

// Import styles
import './styles/guided-workflow.css';
import './styles/wallet-connection-guide.css';

// Import components
import { AppContext } from './AppContext';
import { NetworkSelector } from './components/NetworkSelector';
import { OfferCreation } from './components/OfferCreation';
import { OfferList } from './components/OfferList';
import { DisputeResolution } from './components/DisputeResolution';
import { UserProfile } from './components/UserProfile';
import TradingGuidedWorkflow from './components/guided-workflow/TradingGuidedWorkflow';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeSelector from './components/ThemeSelector';
import LanguageSelector from './components/LanguageSelector';
import ProgramDebugInfo from './components/ProgramDebugInfo';

// Import Phantom wallet utilities
import { PhantomWalletProvider, usePhantomWallet } from './contexts/PhantomWalletProvider';
import { PhantomWalletButton } from './components/PhantomWalletButton';
import { initializeWalletConflictPrevention } from './utils/walletConflictPrevention';
import { createConnection, getNetworkConnection } from './utils/rpcConnection';
import { useProgram } from './hooks/useProgram';

// SVM Networks configuration with resilient RPC endpoints
const SVM_NETWORKS = {
  'solana': {
    name: 'Solana',
    endpoint: clusterApiUrl('devnet'),
    programId: '4eLxPSpK6Qi1AyNx79Ns4DoVqodp85sEphzPtFqLKTRk',
    icon: '/images/solana-logo.svg',
    color: '#9945FF',
    explorerUrl: 'https://explorer.solana.com',
    // Fallback endpoints if primary fails
    fallbackEndpoints: [
      'https://api.devnet.solana.com',
      'https://solana-devnet-rpc.allthatnode.com',
    ],
    connectionConfig: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    }
  },
  'sonic': {
    name: 'Sonic',
    endpoint: 'https://sonic-api.example.com',
    programId: 'YOUR_SONIC_PROGRAM_ID',
    icon: '/images/sonic-logo.svg',
    color: '#00C2FF',
    explorerUrl: 'https://explorer.sonic.example.com',
    fallbackEndpoints: [],
  },
  'eclipse': {
    name: 'Eclipse',
    endpoint: 'https://eclipse-api.example.com',
    programId: 'YOUR_ECLIPSE_PROGRAM_ID',
    icon: '/images/eclipse-logo.svg',
    color: '#0052FF',
    explorerUrl: 'https://explorer.eclipse.example.com',
    fallbackEndpoints: [],
  },
  'svmBNB': {
    name: 'svmBNB',
    endpoint: 'https://svmbnb-api.example.com',
    programId: 'YOUR_SVMBNB_PROGRAM_ID',
    icon: '/images/svmbnb-logo.svg',
    color: '#F0B90B',
    explorerUrl: 'https://explorer.svmbnb.example.com',
    fallbackEndpoints: [],
  },
  's00n': {
    name: 's00n',
    endpoint: 'https://s00n-api.example.com',
    programId: 'YOUR_S00N_PROGRAM_ID',
    icon: '/images/s00n-logo.svg',
    color: '#00FF9D',
    explorerUrl: 'https://explorer.s00n.example.com',
    fallbackEndpoints: [],
  }
};

// Inner component that can use the Phantom wallet hook
const AppContent = () => {
  // Use Phantom wallet context instead of Swig wallet
  const wallet = usePhantomWallet();
  
  // Create enhanced connection with retry logic for rate limits
  const connection = useMemo(() => {
    return createConnection(network.endpoint, network.connectionConfig || {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }, [network]);

  // Initialize the Anchor program
  const program = useProgram(connection, wallet);
  
  // State for selected network
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'myoffers', 'disputes', 'profile'
  const [isGuidedWorkflow, setIsGuidedWorkflow] = useState(false);
  const [guidedWorkflowType, setGuidedWorkflowType] = useState(null); // 'buy' or 'sell'
  
  // Get network configuration
  const network = SVM_NETWORKS[selectedNetwork];
  
  // Context values
  const contextValue = useMemo(() => ({
    network,
    selectedNetwork,
    setSelectedNetwork,
    activeTab,
    setActiveTab,
    networks: SVM_NETWORKS,
    program, // Add program to context
    connection, // Add connection to context
  }), [network, selectedNetwork, activeTab, program, connection]);
  
  // Handle starting guided workflow
  const handleStartGuidedWorkflow = (type) => {
    setGuidedWorkflowType(type);
    setIsGuidedWorkflow(true);
  };
  
  // Handle completing guided workflow
  const handleCompleteGuidedWorkflow = () => {
    setIsGuidedWorkflow(false);
    setGuidedWorkflowType(null);
  };
  // Initialize wallet conflict prevention
  useEffect(() => {
    initializeWalletConflictPrevention();
  }, []);

  // Handle navigation click
  const handleNavClick = (tab) => {
    setActiveTab(tab);
  };

  // Status indicator for Phantom wallet connection
  const renderWalletStatus = () => {
    if (wallet.error) {
      return (
        <div className="ascii-wallet-status ascii-wallet-error" title={wallet.error}>
          <span className="ascii-status-dot ascii-status-error"></span>
          <span>ERROR</span>
        </div>
      );
    }

    if (wallet.connecting || wallet.connectionState === 'connecting') {
      return (
        <div className="ascii-wallet-status ascii-wallet-connecting">
          <span className="ascii-status-dot ascii-status-connecting"></span>
          <span>CONNECTING...</span>
        </div>
      );
    }

    if (wallet.connected) {
      return (
        <div className="ascii-wallet-status ascii-wallet-connected">
          <span className="ascii-status-dot ascii-status-connected"></span>
          <span>CONNECTED</span>
        </div>
      );
    }

    return (
      <div className="ascii-wallet-status ascii-wallet-disconnected">
        <span className="ascii-status-dot ascii-status-disconnected"></span>
        <span>DISCONNECTED</span>
      </div>
    );
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        <header className="ascii-header">
          <div className="ascii-header-content">
            <div className="ascii-logo-section">
              <Image 
                src="/images/opensvm-logo.svg" 
                alt="OpenSVM P2P Exchange"
                className="ascii-logo-image"
                width={24}
                height={24}
                priority
              />
              <h1 className="ascii-logo-text">OPENSVM P2P</h1>
            </div>
            
            {/* Consolidated Navigation */}
            <nav className="ascii-nav-desktop">
              <div className="ascii-nav-tabs">
                <button
                  className={`ascii-nav-tab ${activeTab === 'buy' ? 'active' : ''}`}
                  onClick={() => handleNavClick('buy')}
                >
                  BUY
                </button>
                <button
                  className={`ascii-nav-tab ${activeTab === 'sell' ? 'active' : ''}`}
                  onClick={() => handleNavClick('sell')}
                >
                  SELL
                </button>
                <button
                  className={`ascii-nav-tab ${activeTab === 'myoffers' ? 'active' : ''}`}
                  onClick={() => handleNavClick('myoffers')}
                >
                  MY OFFERS
                </button>
                <button
                  className={`ascii-nav-tab ${activeTab === 'disputes' ? 'active' : ''}`}
                  onClick={() => handleNavClick('disputes')}
                >
                  DISPUTES
                </button>
                <button
                  className={`ascii-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleNavClick('profile')}
                >
                  PROFILE
                </button>
              </div>
            </nav>
            
            {/* Header Controls */}
            <div className="ascii-header-controls">
              {/* Theme selector */}
              <ThemeSelector />
              
              {/* Language selector */}
              <LanguageSelector
                languages={[
                  { code: 'en', name: 'English' },
                  { code: 'es', name: 'Español' },
                ]}
                currentLocale="en"
                onLanguageChange={(locale) => console.log('Language changed:', locale)}
              />
              
              {/* Solana Explorer link */}
              <a 
                href={network.explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ascii-header-control ascii-explorer-link"
              >
                {network.name.toUpperCase()} EXPLORER
              </a>
              
              <NetworkSelector 
                networks={SVM_NETWORKS} 
                selectedNetwork={selectedNetwork} 
                onSelectNetwork={setSelectedNetwork} 
              />
              
              <ErrorBoundary fallback={
                <div className="ascii-error-container">
                  <p>WALLET ERROR</p>
                  <button onClick={() => wallet.reconnect()} className="ascii-retry-button">RETRY</button>
                </div>
              }>
                <div className="ascii-wallet-wrapper">
                  {renderWalletStatus()}
                  <PhantomWalletButton />
                  {wallet.error && (
                    <button 
                      className="ascii-wallet-retry" 
                      onClick={() => wallet.reconnect()}
                      title="Retry connection"
                    >
                      ↻
                    </button>
                  )}
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </header>

        {/* Mobile Navigation - ASCII Styled */}
        <nav className="ascii-nav-mobile">
          <div className="ascii-nav-grid">
            <button
              className={`ascii-nav-button ${activeTab === 'buy' ? 'active' : ''}`}
              onClick={() => handleNavClick('buy')}
            >
              BUY
            </button>
            <button
              className={`ascii-nav-button ${activeTab === 'sell' ? 'active' : ''}`}
              onClick={() => handleNavClick('sell')}
            >
              SELL
            </button>
            <button
              className={`ascii-nav-button ${activeTab === 'myoffers' ? 'active' : ''}`}
              onClick={() => handleNavClick('myoffers')}
            >
              MY OFFERS
            </button>
            <button
              className={`ascii-nav-button ${activeTab === 'disputes' ? 'active' : ''}`}
              onClick={() => handleNavClick('disputes')}
            >
              DISPUTES
            </button>
            <button
              className={`ascii-nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavClick('profile')}
            >
              PROFILE
            </button>
          </div>
        </nav>

        <main className="app-main">
          {isGuidedWorkflow ? (
            <ErrorBoundary fallback={
              <div className="ascii-guided-workflow-error">
                <h2>GUIDED WORKFLOW ERROR</h2>
                <p>Something went wrong with the guided workflow. Please try again or use the manual interface.</p>
                <button 
                  className="ascii-error-recovery-button"
                  onClick={handleCompleteGuidedWorkflow}
                >
                  EXIT TO MANUAL INTERFACE
                </button>
              </div>
            }>
              <div 
                className="ascii-guided-workflow-container"
                role="region" 
                aria-label="Guided trading workflow"
                tabIndex="-1"
                ref={(el) => {
                  // Focus management: focus the container when workflow starts
                  if (el && isGuidedWorkflow) {
                    setTimeout(() => el.focus(), 100);
                  }
                }}
              >
                <div className="ascii-guided-workflow-header">
                  <h2>{guidedWorkflowType === 'buy' ? 'BUY SOL' : 'SELL SOL'} - GUIDED WORKFLOW</h2>
                  <button 
                    className="ascii-exit-workflow-button"
                    onClick={handleCompleteGuidedWorkflow}
                    aria-label="Exit guided workflow and return to manual interface"
                  >
                    EXIT WORKFLOW
                  </button>
                </div>
                <TradingGuidedWorkflow 
                  tradingType={guidedWorkflowType} 
                  onComplete={handleCompleteGuidedWorkflow}
                />
              </div>
            </ErrorBoundary>
          ) : (
            <div className="ascii-content-container">
              <ErrorBoundary>
                <div key={activeTab} className="ascii-content-transition-wrapper ascii-fade-in">
                  {activeTab === 'buy' && (
                    <OfferList 
                      type="buy" 
                      onStartGuidedWorkflow={handleStartGuidedWorkflow} 
                    />
                  )}
                  {activeTab === 'sell' && (
                    <>
                      <OfferCreation onStartGuidedWorkflow={handleStartGuidedWorkflow} />
                      <OfferList type="sell" onStartGuidedWorkflow={handleStartGuidedWorkflow} />
                    </>
                  )}
                  {activeTab === 'myoffers' && <OfferList type="my" />}
                  {activeTab === 'disputes' && <DisputeResolution />}
                  {activeTab === 'profile' && (
                    <UserProfile wallet={wallet} network={network} />
                  )}
                </div>
              </ErrorBoundary>
            </div>
          )}
        </main>
        
        <footer className="ascii-footer">
          <div className="ascii-footer-content">
            {/* Desktop layout */}
            <div className="ascii-footer-desktop">
              {/* Left: Network info */}
              <div className="ascii-footer-section">
                <p className="ascii-footer-network">NETWORK: {network.name.toUpperCase()}</p>
                <p className="ascii-footer-description">SMART CONTRACT SECURED TRADES WITH DECENTRALIZED DISPUTE RESOLUTION.</p>
              </div>
              
              {/* Right: Copyright */}
              <div className="ascii-footer-section ascii-footer-copyright">
                <p className="ascii-footer-text">© 2025 OPENSVM P2P EXCHANGE. ALL RIGHTS RESERVED.</p>
              </div>
            </div>
            
            {/* Mobile layout */}
            <div className="ascii-footer-mobile">
              {/* Network info */}
              <div className="ascii-footer-section">
                <p className="ascii-footer-network">NETWORK: {network.name.toUpperCase()}</p>
                <p className="ascii-footer-description">SMART CONTRACT SECURED TRADES WITH DECENTRALIZED DISPUTE RESOLUTION.</p>
              </div>
              
              {/* Copyright */}
              <div className="ascii-footer-section ascii-footer-copyright">
                <p className="ascii-footer-text">© 2025 OPENSVM P2P EXCHANGE. ALL RIGHTS RESERVED.</p>
              </div>
            </div>
          </div>
        </footer>
        
        {/* Debug info for development */}
        <ProgramDebugInfo />
      </div>
    </AppContext.Provider>
  );
};

const App = () => {
  // Use ErrorBoundary at the root level to catch any rendering errors
  return (
    <ErrorBoundary fallback={
      <div className="ascii-global-error-container">
        <h1>OPENSVM P2P EXCHANGE</h1>
        <div className="ascii-global-error-content">
          <h2>SOMETHING WENT WRONG</h2>
          <p>We're sorry, but the application couldn't be loaded properly.</p>
          <button 
            className="ascii-button" 
            onClick={() => window.location.reload()}
          >
            REFRESH APPLICATION
          </button>
        </div>
      </div>
    }>
      <PhantomWalletProvider>
        <AppContent />
      </PhantomWalletProvider>
    </ErrorBoundary>
  );
};

export default App;
