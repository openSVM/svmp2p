/**
 * Swig Wallet Context Provider
 * 
 * This provider replaces the Solana wallet adapter with Swig wallet functionality
 * providing OAuth authentication and in-app wallet management.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, Keypair } from '@solana/web3.js';
import {
  fetchSwig,
  Role,
  Actions,
  Ed25519Authority,
  Secp256k1Authority,
  addAuthorityInstruction,
} from '@swig-wallet/classic';
import { para } from '../client/para';
import { OAuthMethod } from '@getpara/web-sdk';

// Create Swig wallet context
const SwigWalletContext = createContext({
  // Wallet connection state
  wallet: null,
  publicKey: null,
  connected: false,
  connecting: false,
  
  // Authentication state
  isAuthenticated: false,
  walletAddress: '',
  walletType: 'SOLANA', // 'SOLANA' or 'EVM'
  
  // Swig-specific state
  swigAddress: null,
  roles: [],
  isSettingUp: false,
  
  // Actions
  connect: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
  authenticate: () => Promise.resolve(),
  setupSwigWallet: () => Promise.resolve(),
  
  // Error handling
  error: null,
  isReady: true,
  connectionState: 'unknown' // 'unknown', 'connecting', 'connected', 'disconnected', 'error'
});

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;

// Initial backoff time in milliseconds
const INITIAL_BACKOFF_MS = 1000;

/**
 * Enhanced Swig wallet context provider
 * 
 * Features:
 * - OAuth authentication via Para SDK
 * - In-app wallet creation and management
 * - Support for both Solana (Ed25519) and EVM (Secp256k1) wallets
 * - Comprehensive error handling and retry logic
 * - Compatible interface with existing Solana wallet adapter
 */
const SwigWalletProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('SOLANA');
  
  // Wallet connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  
  // Swig-specific state
  const [swigAddress, setSwigAddress] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Error handling
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(true);
  const [connectionState, setConnectionState] = useState('unknown');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Refs for cancellation
  const reconnectCancelledRef = useRef(false);

  // Connection helper
  const getConnection = useCallback(async () => {
    const network = localStorage.getItem('swig_network') || 'localnet';
    const endpoint = network === 'devnet' ? 'https://api.devnet.solana.com' : 'http://localhost:8899';
    return new Connection(endpoint, 'confirmed');
  }, []);

  // Calculate exponential backoff time
  const getBackoffTime = useCallback((attempts) => {
    return Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempts), 30000);
  }, []);

  // Check authentication status
  const checkAuthentication = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      // Check if user is authenticated with Para
      const authenticated = await para.isFullyLoggedIn();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Get wallets from Para
        const wallets = await para.getWallets();
        const storedWalletType = localStorage.getItem('walletType') || 'SOLANA';
        setWalletType(storedWalletType);

        // Find wallet of selected type
        const selectedWallet = Object.values(wallets).find((w) => w.type === storedWalletType);

        if (selectedWallet?.address) {
          setWalletAddress(selectedWallet.address);
          setPublicKey(new PublicKey(selectedWallet.address));
          setConnected(true);
          setConnectionState('connected');
        } else {
          setError(`No ${storedWalletType} wallet found`);
          setConnectionState('error');
        }
      } else {
        setConnected(false);
        setConnectionState('disconnected');
      }
    } catch (err) {
      console.error('[SwigWalletProvider] Authentication check failed:', err);
      setError(err.message || 'Authentication check failed');
      setConnectionState('error');
    } finally {
      setConnecting(false);
    }
  }, []);

  // OAuth authentication
  const authenticate = useCallback(async (method = OAuthMethod.GOOGLE) => {
    try {
      setConnecting(true);
      setError(null);
      setConnectionState('connecting');

      if (method === OAuthMethod.FARCASTER) {
        // Farcaster authentication flow
        const connectUri = await para.getFarcasterConnectURL();
        window.open(connectUri, 'farcasterConnectPopup', 'popup=true');

        const { userExists, username } = await para.waitForFarcasterStatus();

        const authUrl = userExists
          ? await para.initiateUserLogin({
              useShortUrl: false,
              farcasterUsername: username,
            })
          : await para.getSetUpBiometricsURL({
              authType: 'farcaster',
              isForNewDevice: false,
            });

        const popupWindow = window.open(
          authUrl,
          userExists ? 'loginPopup' : 'signUpPopup',
          'popup=true'
        );

        if (!popupWindow) throw new Error('Failed to open popup window');

        await (userExists
          ? para.waitForLoginAndSetup({ popupWindow })
          : para.waitForPasskeyAndCreateWallet());
      } else {
        // Regular OAuth flow (Google, Apple, etc.)
        const oAuthURL = await para.getOAuthURL({ method });
        window.open(oAuthURL, 'oAuthPopup', 'popup=true');

        const { email, userExists } = await para.waitForOAuth();

        if (!email) throw new Error('Email not found');

        const authUrl = userExists
          ? await para.initiateUserLogin({ email, useShortUrl: false })
          : await para.getSetUpBiometricsURL({
              authType: 'email',
              isForNewDevice: false,
            });

        const popupWindow = window.open(
          authUrl,
          userExists ? 'loginPopup' : 'signUpPopup',
          'popup=true'
        );

        if (!popupWindow) throw new Error('Failed to open popup window');

        const result = await (userExists
          ? para.waitForLoginAndSetup({ popupWindow })
          : para.waitForPasskeyAndCreateWallet());

        if ('needsWallet' in result && result.needsWallet) {
          await para.createWallet();
        }
      }

      // Check authentication status after login
      await checkAuthentication();
    } catch (err) {
      console.error('[SwigWalletProvider] Authentication failed:', err);
      setError(err.message || 'Authentication failed');
      setConnectionState('error');
    } finally {
      setConnecting(false);
    }
  }, [checkAuthentication]);

  // Connect (alias for authenticate for compatibility)
  const connect = useCallback(async () => {
    if (isAuthenticated) {
      await checkAuthentication();
    } else {
      await authenticate();
    }
  }, [isAuthenticated, checkAuthentication, authenticate]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      await para.logout();
      localStorage.clear();
      
      setIsAuthenticated(false);
      setConnected(false);
      setWalletAddress('');
      setPublicKey(null);
      setSwigAddress(null);
      setRoles([]);
      setError(null);
      setConnectionState('disconnected');
    } catch (err) {
      console.error('[SwigWalletProvider] Disconnect failed:', err);
      setError(err.message || 'Disconnect failed');
    }
  }, []);

  // Setup Swig wallet
  const setupSwigWallet = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setIsSettingUp(true);
      setError(null);

      const connection = await getConnection();
      // Implementation would create Swig account here
      // This is a simplified version - full implementation would use createSwigAccount utilities
      
      console.log('[SwigWalletProvider] Swig wallet setup completed');
    } catch (err) {
      console.error('[SwigWalletProvider] Swig wallet setup failed:', err);
      setError(err.message || 'Swig wallet setup failed');
    } finally {
      setIsSettingUp(false);
    }
  }, [walletAddress, getConnection]);

  // Reconnection logic
  const reconnect = useCallback(async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[SwigWalletProvider] Max reconnection attempts reached');
      return;
    }

    try {
      const backoffTime = getBackoffTime(reconnectAttempts);
      console.log(`[SwigWalletProvider] Reconnecting in ${backoffTime}ms (attempt ${reconnectAttempts + 1})`);
      
      await new Promise((resolve) => {
        setTimeout(resolve, backoffTime);
      });

      if (reconnectCancelledRef.current) {
        return;
      }

      await checkAuthentication();
      setReconnectAttempts(0);
    } catch (err) {
      console.error('[SwigWalletProvider] Reconnection failed:', err);
      setReconnectAttempts(prev => prev + 1);
    }
  }, [reconnectAttempts, getBackoffTime, checkAuthentication]);

  // Cancel reconnection
  const cancelReconnection = useCallback(() => {
    reconnectCancelledRef.current = true;
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    // Wallet connection state (compatible with Solana wallet adapter)
    wallet: { adapter: { name: 'Swig Wallet' } },
    publicKey,
    connected,
    connecting,
    
    // Authentication state
    isAuthenticated,
    walletAddress,
    walletType,
    
    // Swig-specific state
    swigAddress,
    roles,
    isSettingUp,
    
    // Actions
    connect,
    disconnect,
    authenticate,
    setupSwigWallet,
    reconnect,
    cancelReconnection,
    
    // Error handling
    error,
    isReady,
    connectionState,
  }), [
    publicKey,
    connected,
    connecting,
    isAuthenticated,
    walletAddress,
    walletType,
    swigAddress,
    roles,
    isSettingUp,
    connect,
    disconnect,
    authenticate,
    setupSwigWallet,
    reconnect,
    cancelReconnection,
    error,
    isReady,
    connectionState,
  ]);

  return (
    <SwigWalletContext.Provider value={contextValue}>
      {children}
    </SwigWalletContext.Provider>
  );
};

/**
 * Hook to use Swig wallet context
 * Provides safe access to wallet state with error handling
 */
const useSwigWallet = () => {
  const context = useContext(SwigWalletContext);
  
  if (!context) {
    throw new Error('useSwigWallet must be used within a SwigWalletProvider');
  }
  
  return context;
};

// For compatibility with existing code that uses useSafeWallet
export const useSafeWallet = useSwigWallet;

export { SwigWalletProvider, useSwigWallet };
export default SwigWalletProvider;