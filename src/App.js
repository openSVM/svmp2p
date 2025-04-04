import React, { useMemo, useState } from 'react';
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

// SVM Networks configuration
const SVM_NETWORKS = {
  'solana': {
    name: 'Solana',
    endpoint: clusterApiUrl('devnet'),
    programId: 'YOUR_SOLANA_PROGRAM_ID',
    icon: '/assets/images/solana-logo.svg',
    color: '#9945FF',
    explorerUrl: 'https://explorer.solana.com',
  },
  'sonic': {
    name: 'Sonic',
    endpoint: 'https://sonic-api.example.com',
    programId: 'YOUR_SONIC_PROGRAM_ID',
    icon: '/assets/images/sonic-logo.svg',
    color: '#00C2FF',
    explorerUrl: 'https://explorer.sonic.example.com',
  },
  'eclipse': {
    name: 'Eclipse',
    endpoint: 'https://eclipse-api.example.com',
    programId: 'YOUR_ECLIPSE_PROGRAM_ID',
    icon: '/assets/images/eclipse-logo.svg',
    color: '#0052FF',
    explorerUrl: 'https://explorer.eclipse.example.com',
  },
  'svmBNB': {
    name: 'svmBNB',
    endpoint: 'https://svmbnb-api.example.com',
    programId: 'YOUR_SVMBNB_PROGRAM_ID',
    icon: '/assets/images/svmbnb-logo.svg',
    color: '#F0B90B',
    explorerUrl: 'https://explorer.svmbnb.example.com',
  },
  's00n': {
    name: 's00n',
    endpoint: 'https://s00n-api.example.com',
    programId: 'YOUR_S00N_PROGRAM_ID',
    icon: '/assets/images/s00n-logo.svg',
    color: '#00FF9D',
    explorerUrl: 'https://explorer.s00n.example.com',
  }
};

const App = () => {
  // State for selected network
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'myoffers', 'disputes', 'profile'
  
  // Get network configuration
  const network = SVM_NETWORKS[selectedNetwork];
  
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
  
  // Context values
  const contextValue = useMemo(() => ({
    network,
    selectedNetwork,
    setSelectedNetwork,
    activeTab,
    setActiveTab,
  }), [network, selectedNetwork, activeTab]);
  
  return (
    <ConnectionProvider endpoint={network.endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContext.Provider value={contextValue}>
            <div className="app-container">
              <header className="app-header">
                <div className="logo-container">
                  <img src="/assets/images/opensvm-logo.svg" alt="OpenSVM P2P Exchange" />
                  <h1>OpenSVM P2P Exchange</h1>
                </div>
                
                <NetworkSelector 
                  networks={SVM_NETWORKS} 
                  selectedNetwork={selectedNetwork} 
                  onSelectNetwork={setSelectedNetwork} 
                />
                
                <div className="wallet-container">
                  <WalletMultiButton />
                  <WalletDisconnectButton />
                </div>
              </header>
              
              <nav className="app-nav">
                <ul>
                  <li className={activeTab === 'buy' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('buy')}>Buy</button>
                  </li>
                  <li className={activeTab === 'sell' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('sell')}>Sell</button>
                  </li>
                  <li className={activeTab === 'myoffers' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('myoffers')}>My Offers</button>
                  </li>
                  <li className={activeTab === 'disputes' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('disputes')}>Disputes</button>
                  </li>
                  <li className={activeTab === 'profile' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('profile')}>Profile</button>
                  </li>
                </ul>
              </nav>
              
              <main className="app-main">
                {activeTab === 'buy' && <OfferList type="buy" />}
                {activeTab === 'sell' && (
                  <>
                    <OfferCreation />
                    <OfferList type="sell" />
                  </>
                )}
                {activeTab === 'myoffers' && <OfferList type="my" />}
                {activeTab === 'disputes' && <DisputeResolution />}
                {activeTab === 'profile' && <UserProfile />}
              </main>
              
              <footer className="app-footer">
                <p>© 2025 OpenSVM P2P Exchange. All rights reserved.</p>
                <p>
                  <a href={network.explorerUrl} target="_blank" rel="noopener noreferrer">
                    {network.name} Explorer
                  </a>
                </p>
              </footer>
            </div>
          </AppContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
