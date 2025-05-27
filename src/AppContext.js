import React, { createContext } from 'react';

// Create a context for global app state
export const AppContext = createContext({
  network: null,
  selectedNetwork: 'solana',
  setSelectedNetwork: () => {},
  activeTab: 'buy',
  setActiveTab: () => {},
});
