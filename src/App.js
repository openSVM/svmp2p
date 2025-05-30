import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Import components
import { AppContext } from './AppContext';
import { NetworkSelector } from './components/NetworkSelector';
import { OfferCreation } from './components/OfferCreation';
import { OfferList } from './components/OfferList';
import { DisputeResolution } from './components/DisputeResolution';
import { UserProfile } from './components/UserProfile';
import ErrorBoundary from './components/ErrorBoundary';

// Import wallet safety utilities
import { SafeWalletProvider, useSafeWallet } from './contexts/WalletContextProvider';
import { initializeWalletConflictPrevention } from './utils/walletConflictPrevention';

// SVM Networks configuration
const SVM_NETWORKS = {
  'solana': {
    name: 'Solana',
    endpoint: clusterApiUrl('devnet'),
    programId: 'YOUR_SOLANA_PROGRAM_ID',
    icon: '/images/solana-logo.svg',
    color: '#9945FF',
    explorerUrl: 'https://explorer.solana.com',
  },
  'sonic': {
    name: 'Sonic',
    endpoint: 'https://sonic-api.example.com',
    programId: 'YOUR_SONIC_PROGRAM_ID',
    icon: '/images/sonic-logo.svg',
    color: '#00C2FF',
    explorerUrl: 'https://explorer.sonic.example.com',
  },
  'eclipse': {
    name: 'Eclipse',
    endpoint: 'https://eclipse-api.example.com',
    programId: 'YOUR_ECLIPSE_PROGRAM_ID',
    icon: '/images/eclipse-logo.svg',
    color: '#0052FF',
    explorerUrl: 'https://explorer.eclipse.example.com',
  },
  'svmBNB': {
    name: 'svmBNB',
    endpoint: 'https://svmbnb-api.example.com',
    programId: 'YOUR_SVMBNB_PROGRAM_ID',
    icon: '/images/svmbnb-logo.svg',
    color: '#F0B90B',
    explorerUrl: 'https://explorer.svmbnb.example.com',
  },
  's00n': {
    name: 's00n',
    endpoint: 'https://s00n-api.example.com',
    programId: 'YOUR_S00N_PROGRAM_ID',
    icon: '/images/s00n-logo.svg',
    color: '#00FF9D',
    explorerUrl: 'https://explorer.s00n.example.com',
  }
};

// Inner component that can use the wallet hook
const AppContent = () => {
  // Use safe wallet context instead of direct wallet adapter
  const wallet = useSafeWallet();
  
  // State for selected network
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'myoffers', 'disputes', 'profile'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get network configuration
  const network = SVM_NETWORKS[selectedNetwork];
  
  // Context values
  const contextValue = useMemo(() => ({
    network,
    selectedNetwork,
    setSelectedNetwork,
    activeTab,
    setActiveTab,
  }), [network, selectedNetwork, activeTab]);
  
  // Initialize wallet conflict prevention
  useEffect(() => {
    initializeWalletConflictPrevention();
  }, []);

  // Handle navigation click
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Handle sidebar backdrop click
  const handleBackdropClick = () => {
    setSidebarOpen(false);
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ≡
            </button>
            <Image 
              src="/images/opensvm-logo.svg" 
              alt="OpenSVM P2P Exchange"
              width={24}
              height={24}
              priority
            />
            <h1>OpenSVM P2P</h1>
          </div>
          
          <div className="wallet-container">
            <NetworkSelector 
              networks={SVM_NETWORKS} 
              selectedNetwork={selectedNetwork} 
              onSelectNetwork={setSelectedNetwork} 
            />
            <ErrorBoundary fallback={
              <div className="wallet-error">
                <p>Wallet Error</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            }>
              <WalletMultiButton style={{ 
                backgroundColor: 'var(--ascii-neutral-700)',
                color: 'var(--ascii-white)',
                border: '1px solid var(--ascii-neutral-900)',
                padding: '6px 12px',
                fontSize: '12px',
                fontFamily: 'Courier New, Courier, monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }} />
            </ErrorBoundary>
          </div>
        </header>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={handleBackdropClick}>
            <nav className="sidebar-nav" onClick={(e) => e.stopPropagation()}>
              <div className="sidebar-header">
                <h2>MENU</h2>
                <button 
                  className="sidebar-close"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <div className="sidebar-content">
                <button 
                  className={`sidebar-nav-button ${activeTab === 'buy' ? 'active' : ''}`}
                  onClick={() => handleNavClick('buy')}
                >
                  <span className="nav-icon">B</span>
                  <span className="nav-label">BUY OFFERS</span>
                </button>
                <button 
                  className={`sidebar-nav-button ${activeTab === 'sell' ? 'active' : ''}`}
                  onClick={() => handleNavClick('sell')}
                >
                  <span className="nav-icon">S</span>
                  <span className="nav-label">SELL OFFERS</span>
                </button>
                <button 
                  className={`sidebar-nav-button ${activeTab === 'myoffers' ? 'active' : ''}`}
                  onClick={() => handleNavClick('myoffers')}
                >
                  <span className="nav-icon">M</span>
                  <span className="nav-label">MY OFFERS</span>
                </button>
                <button 
                  className={`sidebar-nav-button ${activeTab === 'disputes' ? 'active' : ''}`}
                  onClick={() => handleNavClick('disputes')}
                >
                  <span className="nav-icon">D</span>
                  <span className="nav-label">DISPUTES</span>
                </button>
                <button 
                  className={`sidebar-nav-button ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleNavClick('profile')}
                >
                  <span className="nav-icon">P</span>
                  <span className="nav-label">PROFILE</span>
                </button>
              </div>
            </nav>
          </div>
        )}
        
        <main className="app-main">
          <ErrorBoundary>
            <div key={activeTab} className="content-wrapper fade-in">
              {activeTab === 'buy' && <OfferList type="buy" />}
              {activeTab === 'sell' && (
                <>
                  <OfferCreation />
                  <OfferList type="sell" />
                </>
              )}
              {activeTab === 'myoffers' && <OfferList type="my" />}
              {activeTab === 'disputes' && <DisputeResolution />}
              {activeTab === 'profile' && (
                <UserProfile wallet={wallet} network={network} />
              )}
            </div>
          </ErrorBoundary>
        </main>
        
        <footer className="app-footer">
          <p style={{ margin: 0, fontSize: '10px' }}>© 2025 OpenSVM P2P | <a href={network.explorerUrl} target="_blank" rel="noopener noreferrer">{network.name}</a></p>
        </footer>
      </div>
    </AppContext.Provider>
  );
};

const App = () => {
  // Set up wallet adapters - updated for latest wallet adapter versions
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );
  
  // Define network for connection provider
  const network = SVM_NETWORKS['solana'];

  // Use ErrorBoundary at the root level to catch any rendering errors
  return (
    <ErrorBoundary fallback={
      <div className="global-error-container">
        <h1>OpenSVM P2P Exchange</h1>
        <div className="global-error-content">
          <h2>Something went wrong</h2>
          <p>We're sorry, but the application couldn't be loaded properly.</p>
          <button 
            className="button" 
            onClick={() => window.location.reload()}
          >
            Refresh Application
          </button>
        </div>
      </div>
    }>
      <ConnectionProvider endpoint={network.endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <SafeWalletProvider>
            <WalletModalProvider>
              <AppContent />
            </WalletModalProvider>
          </SafeWalletProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
};

export default App;
