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
import { createConnection, getNetworkConnection } from './utils/rpcConnection';

// SVM Networks configuration with resilient RPC endpoints
const SVM_NETWORKS = {
  'solana': {
    name: 'Solana',
    endpoint: clusterApiUrl('devnet'),
    programId: 'YOUR_SOLANA_PROGRAM_ID',
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

// Inner component that can use the wallet hook
const AppContent = () => {
  // Use safe wallet context instead of direct wallet adapter
  const wallet = useSafeWallet();
  
  // State for selected network
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'myoffers', 'disputes', 'profile'
  
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
  }), [network, selectedNetwork, activeTab]);
  
  // Initialize wallet conflict prevention
  useEffect(() => {
    initializeWalletConflictPrevention();
  }, []);

  // Handle navigation click
  const handleNavClick = (tab) => {
    setActiveTab(tab);
  };

  // Status indicator for wallet connection
  const renderWalletStatus = () => {
    if (wallet.error) {
      return (
        <div className="wallet-status error" title={wallet.error}>
          <span className="status-dot error"></span>
          <span>Error</span>
        </div>
      );
    }

    if (wallet.connecting || wallet.connectionState === 'connecting') {
      return (
        <div className="wallet-status connecting">
          <span className="status-dot connecting"></span>
          <span>Connecting...</span>
        </div>
      );
    }

    if (wallet.connected) {
      return (
        <div className="wallet-status connected">
          <span className="status-dot connected"></span>
          <span>Connected</span>
        </div>
      );
    }

    return (
      <div className="wallet-status disconnected">
        <span className="status-dot disconnected"></span>
        <span>Disconnected</span>
      </div>
    );
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
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
            
            {/* Consolidated Navigation */}
            <nav className="header-nav">
              <button
                className={`nav-tab ${activeTab === 'buy' ? 'active' : ''}`}
                onClick={() => handleNavClick('buy')}
              >
                <span className="nav-label">BUY</span>
              </button>
              <button
                className={`nav-tab ${activeTab === 'sell' ? 'active' : ''}`}
                onClick={() => handleNavClick('sell')}
              >
                <span className="nav-label">SELL</span>
              </button>
              <button
                className={`nav-tab ${activeTab === 'myoffers' ? 'active' : ''}`}
                onClick={() => handleNavClick('myoffers')}
              >
                <span className="nav-label">MY OFFERS</span>
              </button>
              <button
                className={`nav-tab ${activeTab === 'disputes' ? 'active' : ''}`}
                onClick={() => handleNavClick('disputes')}
              >
                <span className="nav-label">DISPUTES</span>
              </button>
              <button
                className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('profile')}
              >
                <span className="nav-label">PROFILE</span>
              </button>
            </nav>
            
            {/* Header Actions */}
            <div className="header-actions">
              {/* Language selector */}
              <div className="relative inline-block text-left">
                <button className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <span className="mr-2">EN</span>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
              
              {/* Solana Explorer link */}
              <a 
                href={network.explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                {network.name.toUpperCase()} EXPLORER
              </a>
              
              <NetworkSelector 
                networks={SVM_NETWORKS} 
                selectedNetwork={selectedNetwork} 
                onSelectNetwork={setSelectedNetwork} 
              />
              
              <ErrorBoundary fallback={
                <div className="wallet-error">
                  <p>Wallet Error</p>
                  <button onClick={() => wallet.reconnect()}>Retry</button>
                </div>
              }>
                <div className="wallet-wrapper">
                  {renderWalletStatus()}
                  <WalletMultiButton />
                  {wallet.error && (
                    <button 
                      className="wallet-retry-button" 
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

        <main className="app-main">
          <div className="container content-container">
            <ErrorBoundary>
              <div key={activeTab} className="content-transition-wrapper fade-in">
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
          </div>
        </main>
        
        <footer className="bg-gray-50 border-t border-gray-200 py-4">
          <div className="container mx-auto px-4 py-6">
            {/* Desktop layout */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-4 md:items-center">
              {/* Left: Network info */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Network: {network.name}</p>
                <p className="text-sm text-gray-600">Smart contract secured trades with decentralized dispute resolution.</p>
              </div>
              
              {/* Right: Copyright */}
              <div className="text-right">
                <p className="text-sm text-gray-500">© 2025 OPENSVM P2P EXCHANGE. ALL RIGHTS RESERVED.</p>
              </div>
            </div>
            
            {/* Mobile layout */}
            <div className="md:hidden space-y-4">
              {/* Network info */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Network: {network.name}</p>
                <p className="text-sm text-gray-600">Smart contract secured trades with decentralized dispute resolution.</p>
              </div>
              
              {/* Copyright */}
              <div className="text-center">
                <p className="text-sm text-gray-500">© 2025 OPENSVM P2P EXCHANGE. ALL RIGHTS RESERVED.</p>
              </div>
            </div>
          </div>
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
  
  // Create enhanced connection with retry logic for rate limits
  const connection = useMemo(() => {
    return createConnection(network.endpoint, network.connectionConfig || {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }, [network]);

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
      <ConnectionProvider endpoint={network.endpoint} config={network.connectionConfig} connection={connection}>
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
