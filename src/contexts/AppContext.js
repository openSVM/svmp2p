import { createContext, useState, useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';

// Create a context for global app state
export const AppContext = createContext({
  network: null,
  networks: {},
  selectedNetwork: 'solana',
  setSelectedNetwork: () => {},
  activeTab: 'buy',
  setActiveTab: () => {},
});

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

export const AppContextProvider = ({ children }) => {
  // State for selected network
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'myoffers', 'disputes', 'profile'
  
  // Get network configuration
  const network = SVM_NETWORKS[selectedNetwork];
  
  // Context values
  const contextValue = useMemo(() => ({
    network,
    networks: SVM_NETWORKS,
    selectedNetwork,
    setSelectedNetwork,
    activeTab,
    setActiveTab,
  }), [network, selectedNetwork, activeTab]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </AppContext.Provider>
  );
};