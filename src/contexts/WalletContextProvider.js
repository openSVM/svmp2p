/**
 * Safe Wallet Context Provider
 * 
 * Security Implementation:
 * This provider enhances the Solana wallet adapter with additional security measures:
 * 
 * 1. **Null Safety**: Prevents null pointer exceptions from uninitialized wallet adapters
 * 2. **Error Boundary**: Catches and handles wallet connection errors gracefully  
 * 3. **State Isolation**: Isolates wallet state to prevent cross-component contamination
 * 4. **Safe Defaults**: Provides safe fallback values when wallet is unavailable
 * 5. **No Private Key Access**: Only accesses public wallet interface, never private keys
 * 6. **Retry Logic**: Implements exponential backoff for wallet connection attempts
 * 7. **Rate Limit Handling**: Properly handles RPC rate limiting errors
 * 
 * Privacy Considerations:
 * - Only reads public key and connection status
 * - Never accesses or stores private keys, mnemonics, or seed phrases
 * - All wallet interactions go through official Solana wallet adapter
 * - No sensitive data is logged or stored in browser memory
 * 
 * @fileoverview Enhanced wallet context with comprehensive security measures
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Create a safe wallet context that wraps the Solana wallet adapter
const SafeWalletContext = createContext({
  wallet: null,
  publicKey: null,
  connected: false,
  connecting: false,
  disconnect: () => {},
  connect: () => {},
  isReady: false,
  error: null,
  reconnect: () => {},
  connectionState: 'unknown' // 'unknown', 'connecting', 'connected', 'disconnected', 'error'
});

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;

// Initial backoff time in milliseconds
const INITIAL_BACKOFF_MS = 1000;

/**
 * Enhanced wallet context provider that adds safety checks and error handling
 * 
 * Security Features:
 * - Comprehensive null checks to prevent runtime errors
 * - Error event handling for wallet adapter failures
 * - Safe state management with defensive programming
 * - Clean error recovery without exposing sensitive information
 * - Automatic reconnection with exponential backoff
 * - Improved error handling for rate limits
 * 
 * Privacy Protection:
 * - Only accesses public wallet interface (no private key access)
 * - Uses read-only wallet adapter properties
 * - Implements secure error handling without data leakage
 */
export const SafeWalletProvider = ({ children }) => {
  const walletAdapter = useWallet();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionState, setConnectionState] = useState('unknown');

  // Calculate exponential backoff time based on attempt number
  const getBackoffTime = useCallback((attempt) => {
    return Math.min(INITIAL_BACKOFF_MS * Math.pow(1.5, attempt) * (0.9 + Math.random() * 0.2), 30000);
  }, []);
  
  /**
   * Attempt to reconnect to wallet with exponential backoff
   */
  const reconnect = useCallback(async () => {
    if (!walletAdapter?.connect || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    setConnectionState('connecting');
    const attempt = reconnectAttempts + 1;
    setReconnectAttempts(attempt);
    
    const backoffTime = getBackoffTime(attempt);
    console.log(`[SafeWalletProvider] Reconnecting to wallet (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}) after ${Math.round(backoffTime)}ms`);
    
    try {
      // Wait for backoff time
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      // Try to connect
      await walletAdapter.connect();
      
      // Reset reconnect attempts on success
      setReconnectAttempts(0);
      setConnectionState('connected');
      setError(null);
    } catch (err) {
      console.error('[SafeWalletProvider] Reconnection attempt failed:', err);
      
      // Check for rate limit errors
      if (err.message && (
          err.message.includes('Retry after') || 
          err.message.includes('Too many requests') || 
          err.message.includes('429')
      )) {
        // Extract retry time if available, or default to exponential backoff
        const retryAfterMatch = err.message.match(/Retry after (\d+)/i);
        const retryTime = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : getBackoffTime(attempt + 2);
        console.warn(`[SafeWalletProvider] Rate limited. Will retry after ${retryTime}ms`);
        
        // Schedule next retry
        setTimeout(reconnect, retryTime);
      } else if (attempt < MAX_RECONNECT_ATTEMPTS) {
        // For other errors, try again if we haven't reached max attempts
        setTimeout(reconnect, getBackoffTime(attempt + 1));
      } else {
        // Give up after max attempts
        setConnectionState('error');
        setError(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts: ${err.message}`);
      }
    }
  }, [walletAdapter, reconnectAttempts, getBackoffTime]);

  // Safely extract wallet properties with comprehensive null checks
  const safeWallet = useMemo(() => {
    try {
      return {
        wallet: walletAdapter?.wallet || null,
        publicKey: walletAdapter?.publicKey || null,
        connected: Boolean(walletAdapter?.connected && walletAdapter?.publicKey),
        connecting: Boolean(walletAdapter?.connecting),
        disconnect: async () => {
          try {
            if (walletAdapter?.disconnect) {
              await walletAdapter.disconnect();
              setConnectionState('disconnected');
            }
            return Promise.resolve();
          } catch (err) {
            console.error('[SafeWalletProvider] Error during disconnect:', err);
            return Promise.resolve();
          }
        },
        connect: async () => {
          try {
            setConnectionState('connecting');
            if (walletAdapter?.connect) {
              await walletAdapter.connect();
              setConnectionState('connected');
              setReconnectAttempts(0);
              return Promise.resolve(true);
            }
            return Promise.resolve(false);
          } catch (err) {
            console.error('[SafeWalletProvider] Error during connect:', err);
            setError(err.message || 'Failed to connect wallet');
            setConnectionState('error');
            
            // Check for rate limit errors and handle appropriately
            if (err.message && (
                err.message.includes('Retry after') || 
                err.message.includes('Too many requests') || 
                err.message.includes('429')
            )) {
              // Schedule reconnection with appropriate backoff
              reconnect();
            }
            
            return Promise.resolve(false);
          }
        },
        isReady: isReady,
        error: error,
        reconnect: reconnect,
        connectionState: connectionState
      };
    } catch (err) {
      console.warn('[SafeWalletProvider] Error creating safe wallet object:', err);
      return {
        wallet: null,
        publicKey: null,
        connected: false,
        connecting: false,
        disconnect: () => Promise.resolve(),
        connect: () => Promise.resolve(false),
        isReady: false,
        error: err.message || 'Wallet initialization error',
        reconnect: () => {},
        connectionState: 'error'
      };
    }
  }, [walletAdapter, isReady, error, reconnect, connectionState]);

  // Monitor wallet adapter initialization
  useEffect(() => {
    try {
      // Set ready state when wallet adapter is available
      if (walletAdapter) {
        setIsReady(true);
        setError(null);
        
        // Update connection state based on wallet status
        if (walletAdapter.connected && walletAdapter.publicKey) {
          setConnectionState('connected');
        } else if (walletAdapter.connecting) {
          setConnectionState('connecting');
        } else {
          setConnectionState('disconnected');
        }
      } else {
        setConnectionState('unknown');
      }
    } catch (err) {
      console.error('[SafeWalletProvider] Wallet initialization error:', err);
      setError(err.message || 'Failed to initialize wallet');
      setIsReady(false);
      setConnectionState('error');
    }
  }, [walletAdapter, walletAdapter?.connected, walletAdapter?.connecting, walletAdapter?.publicKey]);

  // Monitor wallet connection errors
  useEffect(() => {
    const handleWalletError = (error) => {
      console.error('[SafeWalletProvider] Wallet error:', error);
      
      // Check if this is a rate limit or transient error that we should retry
      const errorMessage = error?.message || 'Wallet connection error';
      setError(errorMessage);
      
      // Set connection state to error but attempt reconnection for specific errors
      setConnectionState('error');
      
      // Attempt reconnection for specific transient errors
      if (errorMessage.includes('Retry after') || 
          errorMessage.includes('Too many requests') ||
          errorMessage.includes('429') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('disconnect') ||
          errorMessage.includes('Socket')) {
        reconnect();
      }
    };

    // Listen for wallet errors if available
    if (walletAdapter?.wallet?.adapter) {
      walletAdapter.wallet.adapter.on('error', handleWalletError);
      
      return () => {
        walletAdapter.wallet.adapter.off('error', handleWalletError);
      };
    }
  }, [walletAdapter?.wallet?.adapter, reconnect]);

  // Listen for wallet connection state changes
  useEffect(() => {
    const handleConnect = () => {
      setConnectionState('connected');
      setReconnectAttempts(0);
      setError(null);
    };
    
    const handleDisconnect = () => {
      setConnectionState('disconnected');
    };
    
    const handleReadyStateChange = (readyState) => {
      if (readyState) {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    };
    
    if (walletAdapter?.wallet?.adapter) {
      walletAdapter.wallet.adapter.on('connect', handleConnect);
      walletAdapter.wallet.adapter.on('disconnect', handleDisconnect);
      walletAdapter.wallet.adapter.on('readyStateChange', handleReadyStateChange);
      
      return () => {
        walletAdapter.wallet.adapter.off('connect', handleConnect);
        walletAdapter.wallet.adapter.off('disconnect', handleDisconnect);
        walletAdapter.wallet.adapter.off('readyStateChange', handleReadyStateChange);
      };
    }
  }, [walletAdapter?.wallet?.adapter]);

  return (
    <SafeWalletContext.Provider value={safeWallet}>
      {children}
    </SafeWalletContext.Provider>
  );
};

/**
 * Custom hook to safely access wallet context
 * This prevents the "Cannot read properties of null" errors
 */
export const useSafeWallet = () => {
  const context = useContext(SafeWalletContext);
  
  if (context === undefined) {
    console.warn('[useSafeWallet] Wallet context not found, returning safe defaults');
    return {
      wallet: null,
      publicKey: null,
      connected: false,
      connecting: false,
      disconnect: () => Promise.resolve(),
      connect: () => Promise.resolve(false),
      isReady: false,
      error: 'Wallet context not available',
      reconnect: () => {},
      connectionState: 'unknown'
    };
  }
  
  return context;
};

export default SafeWalletProvider;