import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { SVM_NETWORKS, getNetworkConfig, getDefaultNetworkConfig } from '../config/networks';
import { useProgram } from '../hooks/useProgram';
import { usePhantomWallet } from './PhantomWalletProvider';

// Create a context for global app state
export const AppContext = createContext({
  network: null,
  networks: {},
  selectedNetwork: 'solana',
  setSelectedNetwork: () => {},
  connection: null,
  program: null,
});

export const AppContextProvider = ({ children }) => {
  // Get wallet from PhantomWalletProvider
  const wallet = usePhantomWallet();
  
  // State for selected network
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [connection, setConnection] = useState(null);
  
  // Get network configuration
  const network = SVM_NETWORKS[selectedNetwork];
  
  // Create connection when network changes
  useEffect(() => {
    const createConnection = async () => {
      try {
        const networkConfig = getNetworkConfig(selectedNetwork);
        if (!networkConfig) {
          console.warn('[AppContext] Unknown network selected, falling back to Solana');
          const defaultConfig = getDefaultNetworkConfig();
          const conn = new Connection(defaultConfig.endpoint, defaultConfig.connectionConfig);
          setConnection(conn);
          return;
        }
        
        // Try primary endpoint first
        try {
          const conn = new Connection(networkConfig.endpoint, networkConfig.connectionConfig);
          // Test the connection
          await conn.getLatestBlockhash('confirmed');
          setConnection(conn);
          console.log(`[AppContext] Connected to ${selectedNetwork} network`);
        } catch (primaryError) {
          console.warn(`[AppContext] Primary endpoint failed for ${selectedNetwork}:`, primaryError);
          
          // Try fallback endpoints if available
          if (networkConfig.fallbackEndpoints?.length > 0) {
            for (const endpoint of networkConfig.fallbackEndpoints) {
              try {
                const conn = new Connection(endpoint, networkConfig.connectionConfig);
                await conn.getLatestBlockhash('confirmed');
                setConnection(conn);
                console.log(`[AppContext] Using fallback endpoint: ${endpoint}`);
                return;
              } catch (fallbackError) {
                console.warn('[AppContext] Fallback endpoint failed:', endpoint, fallbackError);
                continue;
              }
            }
          }
          
          // If all endpoints fail, throw the original error
          throw primaryError;
        }
      } catch (error) {
        console.error('[AppContext] Failed to create connection:', error);
        // Set a minimal connection for error recovery
        const defaultConfig = getDefaultNetworkConfig();
        const conn = new Connection(defaultConfig.endpoint, 'confirmed');
        setConnection(conn);
      }
    };
    
    createConnection();
  }, [selectedNetwork]);
  
  // Create program using the useProgram hook
  const program = useProgram(connection, wallet);
  
  // Context values
  const contextValue = useMemo(() => ({
    network,
    networks: SVM_NETWORKS,
    selectedNetwork,
    setSelectedNetwork,
    connection,
    program,
  }), [network, selectedNetwork, connection, program]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  
  return context;
};