import { createContext, useState, useEffect } from 'react';

// Network configurations
const networkConfigs = {
  solana: {
    name: 'Solana',
    icon: '/assets/images/solana-logo.svg',
    color: '#9945FF',
    programId: 'YOUR_SOLANA_PROGRAM_ID',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    tokens: [
      { symbol: 'SOL', name: 'Solana', icon: '/assets/images/sol-icon.svg' },
      { symbol: 'USDC', name: 'USD Coin', icon: '/assets/images/usdc-icon.svg' },
      { symbol: 'BONK', name: 'Bonk', icon: '/assets/images/bonk-icon.svg' },
      { symbol: 'JTO', name: 'Jito', icon: '/assets/images/jto-icon.svg' },
    ]
  },
  sonic: {
    name: 'Sonic',
    icon: '/assets/images/sonic-logo.svg',
    color: '#00FFFF',
    programId: 'YOUR_SONIC_PROGRAM_ID',
    rpcUrl: 'https://mainnet.sonic.org',
    tokens: [
      { symbol: 'SONIC', name: 'Sonic', icon: '/assets/images/sonic-icon.svg' },
      { symbol: 'USDC', name: 'USD Coin', icon: '/assets/images/usdc-icon.svg' },
    ]
  },
  eclipse: {
    name: 'Eclipse',
    icon: '/assets/images/eclipse-logo.svg',
    color: '#FF5733',
    programId: 'YOUR_ECLIPSE_PROGRAM_ID',
    rpcUrl: 'https://mainnet.eclipse.org',
    tokens: [
      { symbol: 'ECL', name: 'Eclipse', icon: '/assets/images/eclipse-logo.svg' },
      { symbol: 'USDC', name: 'USD Coin', icon: '/assets/images/usdc-icon.svg' },
    ]
  },
  svmbnb: {
    name: 'svmBNB',
    icon: '/assets/images/svmbnb-logo.svg',
    color: '#F3BA2F',
    programId: 'YOUR_SVMBNB_PROGRAM_ID',
    rpcUrl: 'https://mainnet.svmbnb.org',
    tokens: [
      { symbol: 'BNB', name: 'BNB', icon: '/assets/images/bnb-icon.svg' },
      { symbol: 'USDT', name: 'Tether', icon: '/assets/images/usdt-icon.svg' },
    ]
  },
  soon: {
    name: 'S00N',
    icon: '/assets/images/soon-logo.svg',
    color: '#00FF00',
    programId: 'YOUR_SOON_PROGRAM_ID',
    rpcUrl: 'https://mainnet.soon.org',
    tokens: [
      { symbol: 'SOON', name: 'Soon', icon: '/assets/images/soon-logo.svg' },
      { symbol: 'USDC', name: 'USD Coin', icon: '/assets/images/usdc-icon.svg' },
    ]
  }
};

export const AppContext = createContext({
  networks: networkConfigs,
  selectedNetwork: 'solana',
  setSelectedNetwork: () => {},
  activeTab: 'buy',
  setActiveTab: () => {},
});

export const AppProvider = ({ children }) => {
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [activeTab, setActiveTab] = useState('buy');

  // Get current network configuration
  const network = networkConfigs[selectedNetwork];

  const contextValue = {
    networks: networkConfigs,
    selectedNetwork,
    setSelectedNetwork,
    network,
    activeTab,
    setActiveTab,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
