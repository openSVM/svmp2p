/**
 * Phantom Wallet Context Provider
 * 
 * This provider replaces the Swig wallet with Phantom wallet functionality
 * providing direct browser extension connection for Solana wallet operations.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { ReconnectionModal } from '../components/ReconnectionModal';
import { SVM_NETWORKS, getNetworkConfig, getDefaultNetworkConfig } from '../config/networks';
import { ERROR_CATEGORIES } from '../hooks/useToast';

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;

// Initial backoff time in milliseconds
const INITIAL_BACKOFF_MS = 1000;

// Create Phantom wallet context
const PhantomWalletContext = createContext({
  // Wallet connection state
  wallet: null,
  publicKey: null,
  connected: false,
  connecting: false,
  
  // Authentication state
  isAuthenticated: false,
  walletAddress: '',
  
  // Reconnection state
  isReconnecting: false,
  reconnectionProgress: {
    attempt: 0,
    maxAttempts: 0,
    nextRetryIn: 0,
    canCancel: false
  },
  
  // Actions
  connect: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
  signTransaction: () => Promise.resolve(),
  signAllTransactions: () => Promise.resolve(),
  signMessage: () => Promise.resolve(),
  cancelReconnection: () => {},
  
  // Error handling
  error: null,
  isReady: true,
  connectionState: 'unknown' // 'unknown', 'connecting', 'connected', 'disconnected', 'error'
});

/**
 * Enhanced Phantom wallet context provider
 * 
 * Features:
 * - Direct Phantom browser extension connection
 * - Standard Solana wallet adapter interface
 * - Comprehensive error handling and retry logic
 * - User-facing error notifications via toasts
 * - Reconnection progress UI
 * - Compatible interface with existing components
 */
const PhantomWalletProvider = ({ children }) => {
  // Toast notifications
  const toast = useToast();
  
  // Wallet connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Phantom wallet instance
  const [wallet, setWallet] = useState(null);
  
  // Error handling
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(true);
  const [connectionState, setConnectionState] = useState('unknown');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionProgress, setReconnectionProgress] = useState({
    attempt: 0,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    nextRetryIn: 0,
    canCancel: false
  });
  
  // Refs for cancellation
  const reconnectCancelledRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectScheduledTimeouts = useRef(new Set());

  // Connection helper that aligns with app-selected network
  const getConnection = useCallback(async () => {
    try {
      // Get the currently selected network from localStorage or context
      const selectedNetwork = localStorage.getItem('selectedNetwork') || 'solana';
      const networkConfig = getNetworkConfig(selectedNetwork);
      
      if (!networkConfig) {
        console.warn('[PhantomWalletProvider] Unknown network selected, falling back to Solana');
        const defaultConfig = getDefaultNetworkConfig();
        return new Connection(defaultConfig.endpoint, defaultConfig.connectionConfig);
      }
      
      // Try primary endpoint first
      try {
        const connection = new Connection(networkConfig.endpoint, networkConfig.connectionConfig);
        // Test the connection
        await connection.getLatestBlockhash('confirmed');
        return connection;
      } catch (primaryError) {
        console.warn(`[PhantomWalletProvider] Primary endpoint failed for ${selectedNetwork}:`, primaryError);
        
        // Try fallback endpoints if available
        if (networkConfig.fallbackEndpoints?.length > 0) {
          for (const endpoint of networkConfig.fallbackEndpoints) {
            try {
              const connection = new Connection(endpoint, networkConfig.connectionConfig);
              await connection.getLatestBlockhash('confirmed');
              console.log(`[PhantomWalletProvider] Using fallback endpoint: ${endpoint}`);
              return connection;
            } catch (fallbackError) {
              console.warn('[PhantomWalletProvider] Fallback endpoint failed:', endpoint, fallbackError);
              continue;
            }
          }
        }
        
        // If all endpoints fail, throw the original error
        throw primaryError;
      }
    } catch (error) {
      // Ultimate fallback to local development endpoint
      console.error('[PhantomWalletProvider] All network endpoints failed, using local fallback:', error);
      return new Connection('http://localhost:8899', 'confirmed');
    }
  }, []);

  // Calculate exponential backoff time with jitter
  const getBackoffTime = useCallback((attempts) => {
    const baseDelay = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempts), 30000);
    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * 0.3; // 30% jitter
    return baseDelay + (baseDelay * jitter);
  }, []);

  // Detect Phantom wallet
  const detectPhantomWallet = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    // Check for Phantom's Solana provider
    if (window.phantom?.solana) {
      return window.phantom.solana;
    }
    
    // Check for legacy solana provider
    if (window.solana?.isPhantom) {
      return window.solana;
    }
    
    return null;
  }, []);

  // Connect to Phantom wallet
  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);
      setConnectionState('connecting');

      const phantomWallet = detectPhantomWallet();
      
      if (!phantomWallet) {
        throw new Error('Phantom wallet not found. Please install Phantom browser extension.');
      }

      // Connect to Phantom
      const response = await phantomWallet.connect();
      
      if (response.publicKey) {
        const pubKey = new PublicKey(response.publicKey.toString());
        const address = pubKey.toString();
        
        setWallet(phantomWallet);
        setPublicKey(pubKey);
        setWalletAddress(address);
        setConnected(true);
        setConnectionState('connected');
        
        // Store connection state
        localStorage.setItem('phantomConnected', 'true');
        localStorage.setItem('phantomAddress', address);
        
        toast.success('Phantom wallet connected successfully', { 
          category: ERROR_CATEGORIES.SUCCESS 
        });
        
        console.log('[PhantomWalletProvider] Connected to Phantom wallet:', address);
      } else {
        throw new Error('Failed to get public key from Phantom wallet');
      }
    } catch (err) {
      console.error('[PhantomWalletProvider] Connection failed:', err);
      const errorMsg = err.message || 'Failed to connect to Phantom wallet';
      setError(errorMsg);
      setConnectionState('error');
      
      // Categorize error based on type
      if (errorMsg.includes('not found') || errorMsg.includes('install')) {
        toast.systemError(errorMsg, {
          action: (
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Install Phantom
            </a>
          )
        });
      } else if (errorMsg.includes('rejected') || errorMsg.includes('cancelled')) {
        toast.userError('Connection was cancelled');
      } else {
        toast.systemError(`Connection failed: ${errorMsg}`, {
          action: (
            <button
              onClick={() => connect()}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Retry Connection
            </button>
          )
        });
      }
    } finally {
      setConnecting(false);
    }
  }, [detectPhantomWallet, toast]);

  // Disconnect from Phantom wallet
  const disconnect = useCallback(async () => {
    try {
      if (wallet && wallet.disconnect) {
        await wallet.disconnect();
      }
      
      setWallet(null);
      setPublicKey(null);
      setWalletAddress('');
      setConnected(false);
      setError(null);
      setConnectionState('disconnected');
      
      // Clear stored connection state
      localStorage.removeItem('phantomConnected');
      localStorage.removeItem('phantomAddress');
      
      toast.success('Phantom wallet disconnected', { 
        category: ERROR_CATEGORIES.SUCCESS 
      });
      
      console.log('[PhantomWalletProvider] Disconnected from Phantom wallet');
    } catch (err) {
      console.error('[PhantomWalletProvider] Disconnect failed:', err);
      const errorMsg = err.message || 'Disconnect failed';
      setError(errorMsg);
      toast.criticalError(`Disconnect failed: ${errorMsg}`);
    }
  }, [wallet, toast]);

  // Sign transaction
  const signTransaction = useCallback(async (transaction) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const signedTransaction = await wallet.signTransaction(transaction);
      return signedTransaction;
    } catch (err) {
      console.error('[PhantomWalletProvider] Transaction signing failed:', err);
      const errorMsg = err.message || 'Transaction signing failed';
      
      if (errorMsg.includes('rejected') || errorMsg.includes('cancelled')) {
        toast.userError('Transaction was cancelled');
      } else {
        toast.systemError(`Transaction signing failed: ${errorMsg}`);
      }
      
      throw err;
    }
  }, [wallet, connected, toast]);

  // Sign multiple transactions
  const signAllTransactions = useCallback(async (transactions) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const signedTransactions = await wallet.signAllTransactions(transactions);
      return signedTransactions;
    } catch (err) {
      console.error('[PhantomWalletProvider] Batch transaction signing failed:', err);
      const errorMsg = err.message || 'Batch transaction signing failed';
      
      if (errorMsg.includes('rejected') || errorMsg.includes('cancelled')) {
        toast.userError('Transaction batch was cancelled');
      } else {
        toast.systemError(`Batch signing failed: ${errorMsg}`);
      }
      
      throw err;
    }
  }, [wallet, connected, toast]);

  // Sign message
  const signMessage = useCallback(async (message) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await wallet.signMessage(encodedMessage);
      return signedMessage;
    } catch (err) {
      console.error('[PhantomWalletProvider] Message signing failed:', err);
      const errorMsg = err.message || 'Message signing failed';
      
      if (errorMsg.includes('rejected') || errorMsg.includes('cancelled')) {
        toast.userError('Message signing was cancelled');
      } else {
        toast.systemError(`Message signing failed: ${errorMsg}`);
      }
      
      throw err;
    }
  }, [wallet, connected, toast]);

  // Reconnection logic with progress tracking and proper cleanup
  const reconnect = useCallback(async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS || isReconnecting) {
      console.log('[PhantomWalletProvider] Max reconnection attempts reached or already reconnecting');
      return;
    }

    try {
      setIsReconnecting(true);
      reconnectCancelledRef.current = false;
      const currentAttempt = reconnectAttempts + 1;
      const backoffTime = getBackoffTime(reconnectAttempts);
      
      // Update progress state
      setReconnectionProgress({
        attempt: currentAttempt,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        nextRetryIn: Math.ceil(backoffTime / 1000),
        canCancel: true
      });

      console.log(`[PhantomWalletProvider] Reconnecting in ${Math.ceil(backoffTime / 1000)}s (attempt ${currentAttempt})`);
      
      // Countdown timer for UI with proper cleanup
      const countdown = Math.ceil(backoffTime / 1000);
      for (let i = countdown; i > 0; i--) {
        if (reconnectCancelledRef.current) {
          console.log('[PhantomWalletProvider] Reconnection cancelled during countdown');
          return;
        }
        
        setReconnectionProgress(prev => ({
          ...prev,
          nextRetryIn: i
        }));
        
        // Create a new promise for each second with proper timeout tracking
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reconnectScheduledTimeouts.current.delete(timeoutId);
            resolve();
          }, 1000);
          
          // Track timeout for cancellation
          reconnectScheduledTimeouts.current.add(timeoutId);
          
          // Check if cancelled during timeout
          if (reconnectCancelledRef.current) {
            clearTimeout(timeoutId);
            reconnectScheduledTimeouts.current.delete(timeoutId);
            reject(new Error('Cancelled'));
          }
        }).catch((error) => {
          if (error.message === 'Cancelled') {
            return Promise.reject(error);
          }
        });
      }

      if (reconnectCancelledRef.current) {
        console.log('[PhantomWalletProvider] Reconnection cancelled before connection attempt');
        return;
      }

      // Update progress to show attempting
      setReconnectionProgress(prev => ({
        ...prev,
        nextRetryIn: 0,
        canCancel: false
      }));

      await connect();
      
      // Success - reset attempts
      setReconnectAttempts(0);
      setReconnectionProgress({
        attempt: 0,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        nextRetryIn: 0,
        canCancel: false
      });
      
      console.log('[PhantomWalletProvider] Reconnection successful');
    } catch (err) {
      if (err.message === 'Cancelled') {
        console.log('[PhantomWalletProvider] Reconnection cancelled');
        return;
      }
      
      console.error('[PhantomWalletProvider] Reconnection failed:', err);
      setReconnectAttempts(prev => prev + 1);
      
      // If we haven't reached max attempts, schedule next retry with proper cleanup
      if (reconnectAttempts + 1 < MAX_RECONNECT_ATTEMPTS && !reconnectCancelledRef.current) {
        const timeoutId = setTimeout(() => {
          reconnectScheduledTimeouts.current.delete(timeoutId);
          if (!reconnectCancelledRef.current) {
            reconnect();
          }
        }, 1000);
        
        reconnectScheduledTimeouts.current.add(timeoutId);
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [reconnectAttempts, getBackoffTime, connect, isReconnecting]);

  // Cancel reconnection with comprehensive cleanup
  const cancelReconnection = useCallback(() => {
    console.log('[PhantomWalletProvider] Cancelling reconnection...');
    reconnectCancelledRef.current = true;
    setIsReconnecting(false);
    
    // Clear individual timeout if it exists
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Clear all scheduled timeouts
    reconnectScheduledTimeouts.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    reconnectScheduledTimeouts.current.clear();
    
    // Reset progress state
    setReconnectionProgress({
      attempt: 0,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
      nextRetryIn: 0,
      canCancel: false
    });
    
    console.log('[PhantomWalletProvider] Reconnection cancelled by user');
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const phantomWallet = detectPhantomWallet();
        const wasConnected = localStorage.getItem('phantomConnected') === 'true';
        
        if (phantomWallet && wasConnected) {
          // Try to reconnect if phantom is available and was previously connected
          if (phantomWallet.isConnected) {
            const pubKey = new PublicKey(phantomWallet.publicKey.toString());
            const address = pubKey.toString();
            
            setWallet(phantomWallet);
            setPublicKey(pubKey);
            setWalletAddress(address);
            setConnected(true);
            setConnectionState('connected');
            
            console.log('[PhantomWalletProvider] Restored existing connection:', address);
          } else {
            // Clear stale connection state
            localStorage.removeItem('phantomConnected');
            localStorage.removeItem('phantomAddress');
          }
        }
      } catch (error) {
        console.warn('[PhantomWalletProvider] Failed to restore connection:', error);
        localStorage.removeItem('phantomConnected');
        localStorage.removeItem('phantomAddress');
      }
    };
    
    checkExistingConnection();
  }, [detectPhantomWallet]);

  // Listen for account changes
  useEffect(() => {
    if (wallet && connected) {
      const handleAccountChanged = (publicKey) => {
        if (publicKey) {
          const pubKey = new PublicKey(publicKey.toString());
          const address = pubKey.toString();
          
          setPublicKey(pubKey);
          setWalletAddress(address);
          localStorage.setItem('phantomAddress', address);
          
          toast.info('Phantom wallet account changed', { 
            category: ERROR_CATEGORIES.SUCCESS 
          });
        } else {
          // Account disconnected
          disconnect();
        }
      };
      
      wallet.on('accountChanged', handleAccountChanged);
      
      return () => {
        wallet.off('accountChanged', handleAccountChanged);
      };
    }
  }, [wallet, connected, disconnect, toast]);

  // Cleanup on unmount
  useEffect(() => {
    const timeouts = reconnectScheduledTimeouts.current;
    
    return () => {
      // Cancel all reconnection timers on unmount
      reconnectCancelledRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      timeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeouts.clear();
    };
  }, []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    // Wallet connection state (compatible with Solana wallet adapter)
    wallet: wallet ? { adapter: { name: 'Phantom' } } : null,
    publicKey,
    connected,
    connecting,
    
    // Authentication state (for compatibility)
    isAuthenticated: connected,
    walletAddress,
    
    // Reconnection state
    isReconnecting,
    reconnectionProgress,
    
    // Actions
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    reconnect,
    cancelReconnection,
    
    // Error handling
    error,
    isReady,
    connectionState,
  }), [
    wallet,
    publicKey,
    connected,
    connecting,
    walletAddress,
    isReconnecting,
    reconnectionProgress,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    reconnect,
    cancelReconnection,
    error,
    isReady,
    connectionState,
  ]);

  return (
    <PhantomWalletContext.Provider value={contextValue}>
      {children}
      
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
      
      {/* Reconnection progress modal */}
      <ReconnectionModal
        isVisible={isReconnecting}
        progress={reconnectionProgress}
        onCancel={cancelReconnection}
      />
    </PhantomWalletContext.Provider>
  );
};

/**
 * Hook to use Phantom wallet context
 * Provides safe access to wallet state with error handling
 */
const usePhantomWallet = () => {
  const context = useContext(PhantomWalletContext);
  
  if (!context) {
    throw new Error('usePhantomWallet must be used within a PhantomWalletProvider');
  }
  
  return context;
};

// For compatibility with existing code that uses useSwigWallet
export const useSwigWallet = () => {
  console.warn(
    '[MIGRATION WARNING] useSwigWallet is now an alias for usePhantomWallet. ' +
    'Please update your code to use usePhantomWallet directly.'
  );
  return usePhantomWallet();
};

// For compatibility with existing code that uses useSafeWallet
export const useSafeWallet = () => {
  console.warn(
    '[MIGRATION WARNING] useSafeWallet is now an alias for usePhantomWallet. ' +
    'Please update your code to use usePhantomWallet directly.'
  );
  return usePhantomWallet();
};

export { PhantomWalletProvider, usePhantomWallet };
export default PhantomWalletProvider;