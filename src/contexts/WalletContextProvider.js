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
 * 
 * Privacy Considerations:
 * - Only reads public key and connection status
 * - Never accesses or stores private keys, mnemonics, or seed phrases
 * - All wallet interactions go through official Solana wallet adapter
 * - No sensitive data is logged or stored in browser memory
 * 
 * @fileoverview Enhanced wallet context with comprehensive security measures
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  error: null
});

/**
 * Enhanced wallet context provider that adds safety checks and error handling
 * 
 * Security Features:
 * - Comprehensive null checks to prevent runtime errors
 * - Error event handling for wallet adapter failures
 * - Safe state management with defensive programming
 * - Clean error recovery without exposing sensitive information
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

  // Safely extract wallet properties with comprehensive null checks
  const safeWallet = useMemo(() => {
    try {
      return {
        wallet: walletAdapter?.wallet || null,
        publicKey: walletAdapter?.publicKey || null,
        connected: Boolean(walletAdapter?.connected && walletAdapter?.publicKey),
        connecting: Boolean(walletAdapter?.connecting),
        disconnect: walletAdapter?.disconnect || (() => Promise.resolve()),
        connect: walletAdapter?.connect || (() => Promise.resolve()),
        isReady: isReady,
        error: error
      };
    } catch (err) {
      console.warn('[SafeWalletProvider] Error creating safe wallet object:', err);
      return {
        wallet: null,
        publicKey: null,
        connected: false,
        connecting: false,
        disconnect: () => Promise.resolve(),
        connect: () => Promise.resolve(),
        isReady: false,
        error: err.message || 'Wallet initialization error'
      };
    }
  }, [walletAdapter, isReady, error]);

  // Monitor wallet adapter initialization
  useEffect(() => {
    try {
      // Set ready state when wallet adapter is available
      if (walletAdapter) {
        setIsReady(true);
        setError(null);
      }
    } catch (err) {
      console.error('[SafeWalletProvider] Wallet initialization error:', err);
      setError(err.message || 'Failed to initialize wallet');
      setIsReady(false);
    }
  }, [walletAdapter]);

  // Monitor wallet connection errors
  useEffect(() => {
    const handleWalletError = (error) => {
      console.error('[SafeWalletProvider] Wallet error:', error);
      setError(error?.message || 'Wallet connection error');
    };

    // Listen for wallet errors if available
    if (walletAdapter?.wallet?.adapter) {
      walletAdapter.wallet.adapter.on('error', handleWalletError);
      
      return () => {
        walletAdapter.wallet.adapter.off('error', handleWalletError);
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
      connect: () => Promise.resolve(),
      isReady: false,
      error: 'Wallet context not available'
    };
  }
  
  return context;
};

export default SafeWalletProvider;