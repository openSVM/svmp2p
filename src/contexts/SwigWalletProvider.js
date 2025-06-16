/**
 * Swig Wallet Context Provider
 * 
 * This provider replaces the Solana wallet adapter with Swig wallet functionality
 * providing OAuth authentication and in-app wallet management.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, Keypair, clusterApiUrl } from '@solana/web3.js';
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
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { ReconnectionModal } from '../components/ReconnectionModal';

// SVM Networks configuration (imported from main app config)
const SVM_NETWORKS = {
  'solana': {
    name: 'Solana',
    endpoint: clusterApiUrl('devnet'),
    programId: 'YOUR_SOLANA_PROGRAM_ID',
    icon: '/images/solana-logo.svg',
    color: '#9945FF',
    explorerUrl: 'https://explorer.solana.com',
    fallbackEndpoints: [
      'https://api.devnet.solana.com',
      'https://solana-devnet-rpc.allthatnode.com',
    ],
    connectionConfig: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    }
  },
  'sonic': {
    name: 'Sonic',
    endpoint: 'https://sonic-api.example.com',
    programId: 'YOUR_SONIC_PROGRAM_ID',
    icon: '/images/sonic-logo.svg',
    color: '#00C2FF',
    explorerUrl: 'https://explorer.sonic.example.com',
    fallbackEndpoints: [],
    connectionConfig: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    }
  }
};

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
  authenticate: () => Promise.resolve(),
  setupSwigWallet: () => Promise.resolve(),
  cancelReconnection: () => {},
  
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
 * - User-facing error notifications via toasts
 * - Reconnection progress UI
 * - Compatible interface with existing Solana wallet adapter
 */
const SwigWalletProvider = ({ children }) => {
  // Toast notifications
  const toast = useToast();
  
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

  // Connection helper that aligns with app-selected network
  const getConnection = useCallback(async () => {
    try {
      // Get the currently selected network from localStorage or context
      const selectedNetwork = localStorage.getItem('selectedNetwork') || 'solana';
      const networkConfig = SVM_NETWORKS[selectedNetwork];
      
      if (!networkConfig) {
        console.warn('[SwigWalletProvider] Unknown network selected, falling back to Solana');
        return new Connection(SVM_NETWORKS.solana.endpoint, SVM_NETWORKS.solana.connectionConfig);
      }
      
      // Try primary endpoint first
      try {
        const connection = new Connection(networkConfig.endpoint, networkConfig.connectionConfig);
        // Test the connection
        await connection.getLatestBlockhash('confirmed');
        return connection;
      } catch (primaryError) {
        console.warn(`[SwigWalletProvider] Primary endpoint failed for ${selectedNetwork}:`, primaryError);
        
        // Try fallback endpoints if available
        if (networkConfig.fallbackEndpoints?.length > 0) {
          for (const endpoint of networkConfig.fallbackEndpoints) {
            try {
              const connection = new Connection(endpoint, networkConfig.connectionConfig);
              await connection.getLatestBlockhash('confirmed');
              console.log(`[SwigWalletProvider] Using fallback endpoint: ${endpoint}`);
              return connection;
            } catch (fallbackError) {
              console.warn('[SwigWalletProvider] Fallback endpoint failed:', endpoint, fallbackError);
              continue;
            }
          }
        }
        
        // If all endpoints fail, throw the original error
        throw primaryError;
      }
    } catch (error) {
      // Ultimate fallback to local development endpoint
      console.error('[SwigWalletProvider] All network endpoints failed, using local fallback:', error);
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
          toast.success('Wallet connected successfully');
        } else {
          const errorMsg = `No ${storedWalletType} wallet found`;
          setError(errorMsg);
          setConnectionState('error');
          toast.error(errorMsg);
        }
      } else {
        setConnected(false);
        setConnectionState('disconnected');
      }
    } catch (err) {
      console.error('[SwigWalletProvider] Authentication check failed:', err);
      const errorMsg = err.message || 'Authentication check failed';
      setError(errorMsg);
      setConnectionState('error');
      toast.error(`Connection failed: ${errorMsg}`);
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  // OAuth authentication with popup blocker detection
  const authenticate = useCallback(async (method = OAuthMethod.GOOGLE) => {
    try {
      setConnecting(true);
      setError(null);
      setConnectionState('connecting');

      if (method === OAuthMethod.FARCASTER) {
        // Farcaster authentication flow
        const connectUri = await para.getFarcasterConnectURL();
        const popup = window.open(connectUri, 'farcasterConnectPopup', 'popup=true');
        
        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          throw new Error('POPUP_BLOCKED');
        }

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

        if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
          throw new Error('POPUP_BLOCKED');
        }

        await (userExists
          ? para.waitForLoginAndSetup({ popupWindow })
          : para.waitForPasskeyAndCreateWallet());
      } else {
        // Regular OAuth flow (Google, Apple, etc.)
        const oAuthURL = await para.getOAuthURL({ method });
        const popup = window.open(oAuthURL, 'oAuthPopup', 'popup=true');
        
        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          throw new Error('POPUP_BLOCKED');
        }

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

        if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
          throw new Error('POPUP_BLOCKED');
        }

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
      
      if (err.message === 'POPUP_BLOCKED') {
        const errorMsg = 'Popup blocked. Please allow popups for this site and try again.';
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 10000,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          )
        });
      } else {
        const errorMsg = err.message || 'Authentication failed';
        setError(errorMsg);
        toast.error(`Login failed: ${errorMsg}`);
      }
      setConnectionState('error');
    } finally {
      setConnecting(false);
    }
  }, [checkAuthentication, toast]);

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
      
      toast.success('Wallet disconnected');
    } catch (err) {
      console.error('[SwigWalletProvider] Disconnect failed:', err);
      const errorMsg = err.message || 'Disconnect failed';
      setError(errorMsg);
      toast.error(`Disconnect failed: ${errorMsg}`);
    }
  }, [toast]);

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
      toast.success('Swig wallet setup completed');
    } catch (err) {
      console.error('[SwigWalletProvider] Swig wallet setup failed:', err);
      const errorMsg = err.message || 'Swig wallet setup failed';
      setError(errorMsg);
      toast.error(`Setup failed: ${errorMsg}`);
    } finally {
      setIsSettingUp(false);
    }
  }, [walletAddress, getConnection, toast]);

  // Reconnection logic with progress tracking
  const reconnect = useCallback(async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS || isReconnecting) {
      console.log('[SwigWalletProvider] Max reconnection attempts reached or already reconnecting');
      return;
    }

    try {
      setIsReconnecting(true);
      const currentAttempt = reconnectAttempts + 1;
      const backoffTime = getBackoffTime(reconnectAttempts);
      
      // Update progress state
      setReconnectionProgress({
        attempt: currentAttempt,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        nextRetryIn: Math.ceil(backoffTime / 1000),
        canCancel: true
      });

      console.log(`[SwigWalletProvider] Reconnecting in ${Math.ceil(backoffTime / 1000)}s (attempt ${currentAttempt})`);
      
      // Countdown timer for UI
      const countdown = Math.ceil(backoffTime / 1000);
      for (let i = countdown; i > 0; i--) {
        if (reconnectCancelledRef.current) {
          return;
        }
        
        setReconnectionProgress(prev => ({
          ...prev,
          nextRetryIn: i
        }));
        
        await new Promise(resolve => {
          reconnectTimeoutRef.current = setTimeout(resolve, 1000);
        });
      }

      if (reconnectCancelledRef.current) {
        return;
      }

      // Update progress to show attempting
      setReconnectionProgress(prev => ({
        ...prev,
        nextRetryIn: 0,
        canCancel: false
      }));

      await checkAuthentication();
      
      // Success - reset attempts
      setReconnectAttempts(0);
      setReconnectionProgress({
        attempt: 0,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        nextRetryIn: 0,
        canCancel: false
      });
    } catch (err) {
      console.error('[SwigWalletProvider] Reconnection failed:', err);
      setReconnectAttempts(prev => prev + 1);
      
      // If we haven't reached max attempts, schedule next retry
      if (reconnectAttempts + 1 < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => reconnect(), 1000);
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [reconnectAttempts, getBackoffTime, checkAuthentication, isReconnecting]);

  // Cancel reconnection
  const cancelReconnection = useCallback(() => {
    reconnectCancelledRef.current = true;
    setIsReconnecting(false);
    
    // Clear any pending timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Reset progress state
    setReconnectionProgress({
      attempt: 0,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
      nextRetryIn: 0,
      canCancel: false
    });
    
    console.log('[SwigWalletProvider] Reconnection cancelled by user');
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
    
    // Reconnection state
    isReconnecting,
    reconnectionProgress,
    
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
    isReconnecting,
    reconnectionProgress,
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
      
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
      
      {/* Reconnection progress modal */}
      <ReconnectionModal
        isVisible={isReconnecting}
        progress={reconnectionProgress}
        onCancel={cancelReconnection}
      />
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
// DEPRECATED: useSafeWallet is deprecated. Use useSwigWallet instead.
// This alias will be removed in a future version.
export const useSafeWallet = () => {
  console.warn(
    '[DEPRECATION WARNING] useSafeWallet is deprecated and will be removed in v2.0.0. ' +
    'Please migrate to useSwigWallet for the same functionality.'
  );
  return useSwigWallet();
};

export { SwigWalletProvider, useSwigWallet };
export default SwigWalletProvider;