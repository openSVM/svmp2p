import React, { createContext, useState, useMemo, useContext, useEffect, useCallback, useRef } from 'react';
import { Connection } from '@solana/web3.js';
import { SVM_NETWORKS, getNetworkConfig, getDefaultNetworkConfig } from '../config/networks';
import { useProgram } from '../hooks/useProgram';
import { usePhantomWallet } from './PhantomWalletProvider';

// Connection status enum
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  FAILED: 'failed',
  RETRYING: 'retrying'
};

// Create a context for global app state
export const AppContext = createContext({
  network: null,
  networks: {},
  selectedNetwork: 'solana',
  setSelectedNetwork: () => {},
  connection: null,
  program: null,
  connectionStatus: CONNECTION_STATUS.DISCONNECTED,
  connectionError: null,
  retryConnection: () => {},
  connectionAttempts: 0,
});

export const AppContextProvider = ({ children }) => {
  // Get wallet from PhantomWalletProvider
  const wallet = usePhantomWallet();
  
  // State for selected network and connection
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Refs for managing retries
  const retryTimeoutRef = useRef(null);
  const maxRetries = 5;
  const baseRetryDelay = 2000; // 2 seconds
  
  // Get network configuration
  const network = SVM_NETWORKS[selectedNetwork];
  
  // Enhanced connection creation with retry logic and development fallback
  const createConnection = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setConnectionStatus(CONNECTION_STATUS.CONNECTING);
      setConnectionError(null);
      setConnectionAttempts(0);
      console.log('[AppContext] Starting connection creation for network:', selectedNetwork);
    } else {
      setConnectionStatus(CONNECTION_STATUS.RETRYING);
      console.log('[AppContext] Retrying connection, attempt:', connectionAttempts + 1);
    }
    
    try {
      const networkConfig = getNetworkConfig(selectedNetwork);
      if (!networkConfig) {
        console.warn('[AppContext] Unknown network selected, falling back to Solana');
        const defaultConfig = getDefaultNetworkConfig();
        console.log('[AppContext] Using default endpoint:', defaultConfig.endpoint);
        const conn = new Connection(defaultConfig.endpoint, defaultConfig.connectionConfig);
        await testConnection(conn);
        setConnection(conn);
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        setConnectionError(null);
        console.log('[AppContext] Default connection successful');
        return conn;
      }
      
      // List of endpoints to try (primary + fallbacks)
      const endpoints = [networkConfig.endpoint, ...(networkConfig.fallbackEndpoints || [])];
      let lastError = null;
      
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        try {
          console.log(`[AppContext] Trying endpoint ${i + 1}/${endpoints.length}: ${endpoint}`);
          const conn = new Connection(endpoint, networkConfig.connectionConfig);
          
          // Test the connection with a timeout
          await testConnection(conn);
          
          setConnection(conn);
          setConnectionStatus(CONNECTION_STATUS.CONNECTED);
          setConnectionError(null);
          
          if (i > 0) {
            console.log(`[AppContext] Successfully connected using fallback endpoint: ${endpoint}`);
          } else {
            console.log(`[AppContext] Successfully connected to ${selectedNetwork} network`);
          }
          
          return conn;
        } catch (error) {
          lastError = error;
          console.warn(`[AppContext] Endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      // All endpoints failed
      const errorDetails = lastError?.message || 'Unknown error';
      const errorType = lastError?.message?.includes('CORS') ? 'CORS' :
                       lastError?.message?.includes('timeout') ? 'TIMEOUT' :
                       lastError?.message?.includes('fetch') ? 'NETWORK' : 'RPC';
      
      const errorMessage = `All ${endpoints.length} endpoints failed. Error type: ${errorType}. Last error: ${errorDetails}`;
      console.error('[AppContext] All endpoints failed:', errorMessage);
      throw new Error(errorMessage);
      
    } catch (error) {
      console.error('[AppContext] Connection creation failed:', error);
      setConnectionError(error.message);
      
      // If we haven't exceeded max retries and this is an auto-retry scenario
      if (connectionAttempts < maxRetries && (error.message.includes('network') || error.message.includes('timeout'))) {
        setConnectionStatus(CONNECTION_STATUS.RETRYING);
        const attempt = connectionAttempts + 1;
        setConnectionAttempts(attempt);
        
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const delay = baseRetryDelay * Math.pow(2, attempt - 1);
        console.log(`[AppContext] Scheduling retry ${attempt}/${maxRetries} in ${delay}ms`);
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          createConnection(true);
        }, delay);
      } else {
        setConnectionStatus(CONNECTION_STATUS.FAILED);
        // Create a minimal connection for development/testing purposes
        try {
          const defaultConfig = getDefaultNetworkConfig();
          console.log('[AppContext] Creating fallback connection for UI testing');
          const conn = new Connection(defaultConfig.endpoint, 'confirmed');
          setConnection(conn);
        } catch (fallbackError) {
          console.error('[AppContext] Even fallback connection failed:', fallbackError);
          // Create a null connection to at least allow UI testing
          setConnection(null);
        }
      }
    }
  }, [selectedNetwork, connectionAttempts]);
  
  // Test connection health with improved error diagnostics
  const testConnection = async (conn) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      // Test basic connectivity with a simpler method first
      const version = await Promise.race([
        conn.getVersion(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
      
      if (!version) {
        throw new Error('Unable to get RPC version - endpoint may be down');
      }
      
      // If version check passes, try blockhash
      const blockhash = await Promise.race([
        conn.getLatestBlockhash('confirmed'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Blockhash timeout')), 3000)
        )
      ]);
      
      clearTimeout(timeoutId);
      
      if (!blockhash?.blockhash) {
        throw new Error('Invalid blockhash response from RPC endpoint');
      }
      
      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout - RPC endpoint is not responding');
      }
      
      if (error.message.includes('fetch')) {
        throw new Error('Network error - unable to reach RPC endpoint (CORS or connectivity issue)');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('RPC endpoint timeout - server is responding slowly');
      }
      
      throw new Error(`RPC connection test failed: ${error.message}`);
    }
  };
  
  // Manual retry function
  const retryConnection = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setConnectionAttempts(0);
    createConnection(false);
  }, [createConnection]);
  
  // Create connection when network changes
  useEffect(() => {
    createConnection(false);
    
    // Cleanup timeout on unmount or network change
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [selectedNetwork, createConnection]);
  
  // Create program using the useProgram hook
  const program = useProgram(connection, wallet);
  
  // Debug program creation
  useEffect(() => {
    console.log('[AppContext] Program creation debug:', {
      hasConnection: !!connection,
      hasWallet: !!wallet,
      hasWalletPublicKey: !!(wallet && wallet.publicKey),
      walletConnected: wallet ? wallet.connected : false,
      hasProgram: !!program,
      connectionStatus,
      selectedNetwork
    });
    
    if (connection && wallet && wallet.publicKey && wallet.connected && !program) {
      console.warn('[AppContext] All requirements met but program is null - possible useProgram hook issue');
    }
  }, [connection, wallet, program, connectionStatus, selectedNetwork]);
  
  // Context values
  const contextValue = useMemo(() => ({
    network,
    networks: SVM_NETWORKS,
    selectedNetwork,
    setSelectedNetwork,
    connection,
    program,
    connectionStatus,
    connectionError,
    retryConnection,
    connectionAttempts,
  }), [network, selectedNetwork, connection, program, connectionStatus, connectionError, retryConnection, connectionAttempts]);
  
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