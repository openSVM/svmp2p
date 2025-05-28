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
 * This helps prevent the "Cannot read properties of null" errors
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