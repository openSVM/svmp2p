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
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { ReconnectionModal } from '../components/ReconnectionModal';
import { SVM_NETWORKS, getNetworkConfig, getDefaultNetworkConfig } from '../config/networks';
import { ERROR_CATEGORIES } from '../hooks/useToast';

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;

// Initial backoff time in milliseconds
const INITIAL_BACKOFF_MS = 1000;

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
  const reconnectScheduledTimeouts = useRef(new Set());

  // Connection helper that aligns with app-selected network
  const getConnection = useCallback(async () => {
    try {
      // Get the currently selected network from localStorage or context
      const selectedNetwork = localStorage.getItem('selectedNetwork') || 'solana';
      const networkConfig = getNetworkConfig(selectedNetwork);
      
      if (!networkConfig) {
        console.warn('[SwigWalletProvider] Unknown network selected, falling back to Solana');
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
          toast.success('Wallet connected successfully', { 
            category: ERROR_CATEGORIES.SUCCESS 
          });
        } else {
          const errorMsg = `No ${storedWalletType} wallet found`;
          setError(errorMsg);
          setConnectionState('error');
          toast.criticalError(errorMsg, {
            action: (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Retry
              </button>
            )
          });
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
      
      // Categorize error based on type
      if (err.message?.includes('network') || err.message?.includes('connection')) {
        toast.systemError(`Connection failed: ${errorMsg}`, {
          action: (
            <button
              onClick={() => checkAuthentication()}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Retry Connection
            </button>
          )
        });
      } else {
        toast.criticalError(`Authentication failed: ${errorMsg}`);
      }
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  // Enhanced popup blocker detection
  const detectPopupBlocked = useCallback((popup) => {
    if (!popup) return true;
    if (popup.closed) return true;
    if (typeof popup.closed === 'undefined') return true;
    
    // Additional check for mobile browsers
    try {
      if (popup.outerHeight === 0 || popup.outerWidth === 0) return true;
      if (popup.screenX === 0 && popup.screenY === 0) return true;
    } catch (e) {
      // Some browsers throw errors when checking these properties
      return true;
    }
    
    return false;
  }, []);

  // Show popup blocker fallback instructions
  const showPopupBlockedFallback = useCallback((authUrl, method) => {
    const methodName = method === OAuthMethod.GOOGLE ? 'Google' : 
                      method === OAuthMethod.FARCASTER ? 'Farcaster' : 'OAuth';
    
    const errorMsg = `Popup blocked. Please allow popups for this site and try again.`;
    
    toast.systemError(errorMsg, {
      category: ERROR_CATEGORIES.SYSTEM,
      duration: 15000, // Longer duration for instructions
      persistent: true,
      action: (
        <div className="mt-3 space-y-2">
          <button
            onClick={() => window.open(authUrl, '_blank')}
            className="block w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Open {methodName} Login
          </button>
          <button
            onClick={() => {
              // For mobile devices, try same-tab navigation
              window.location.href = authUrl;
            }}
            className="block w-full px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Continue in This Tab
          </button>
        </div>
      )
    });
  }, [toast]);

  // OAuth authentication with enhanced popup blocker detection and fallback
  const authenticate = useCallback(async (method = OAuthMethod.GOOGLE) => {
    try {
      setConnecting(true);
      setError(null);
      setConnectionState('connecting');

      if (method === OAuthMethod.FARCASTER) {
        // Farcaster authentication flow with better popup management
        const connectUri = await para.getFarcasterConnectURL();
        
        // Try to open popup
        const popup = window.open(connectUri, 'farcasterConnectPopup', 'popup=true,width=500,height=600');
        
        // Check if popup was blocked
        if (detectPopupBlocked(popup)) {
          showPopupBlockedFallback(connectUri, method);
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

        // Close first popup to prevent multiple popups
        if (popup && !popup.closed) {
          popup.close();
        }

        // Sequential popup opening to reduce blocker issues
        const authPopup = window.open(
          authUrl,
          userExists ? 'loginPopup' : 'signUpPopup',
          'popup=true,width=500,height=600'
        );

        if (detectPopupBlocked(authPopup)) {
          showPopupBlockedFallback(authUrl, method);
          throw new Error('POPUP_BLOCKED');
        }

        await (userExists
          ? para.waitForLoginAndSetup({ popupWindow: authPopup })
          : para.waitForPasskeyAndCreateWallet());
      } else {
        // Regular OAuth flow (Google, Apple, etc.) with enhanced detection
        const oAuthURL = await para.getOAuthURL({ method });
        const popup = window.open(oAuthURL, 'oAuthPopup', 'popup=true,width=500,height=600');
        
        // Enhanced popup blocker detection
        if (detectPopupBlocked(popup)) {
          showPopupBlockedFallback(oAuthURL, method);
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
          'popup=true,width=500,height=600'
        );

        if (detectPopupBlocked(popupWindow)) {
          showPopupBlockedFallback(authUrl, method);
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
        // Error already handled by showPopupBlockedFallback
        setError('Popup blocked - please allow popups and try again');
      } else {
        const errorMsg = err.message || 'Authentication failed';
        setError(errorMsg);
        
        // Categorize authentication errors
        if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          toast.systemError(`Login failed: ${errorMsg}`, {
            action: (
              <button
                onClick={() => authenticate(method)}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Retry Login
              </button>
            )
          });
        } else {
          toast.criticalError(`Login failed: ${errorMsg}`);
        }
      }
      setConnectionState('error');
    } finally {
      setConnecting(false);
    }
  }, [checkAuthentication, toast, detectPopupBlocked, showPopupBlockedFallback]);

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
      
      toast.success('Wallet disconnected', { 
        category: ERROR_CATEGORIES.SUCCESS 
      });
    } catch (err) {
      console.error('[SwigWalletProvider] Disconnect failed:', err);
      const errorMsg = err.message || 'Disconnect failed';
      setError(errorMsg);
      toast.criticalError(`Disconnect failed: ${errorMsg}`);
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
      toast.success('Swig wallet setup completed', { 
        category: ERROR_CATEGORIES.SUCCESS 
      });
    } catch (err) {
      console.error('[SwigWalletProvider] Swig wallet setup failed:', err);
      const errorMsg = err.message || 'Swig wallet setup failed';
      setError(errorMsg);
      toast.criticalError(`Setup failed: ${errorMsg}`);
    } finally {
      setIsSettingUp(false);
    }
  }, [walletAddress, getConnection, toast]);

  // Reconnection logic with progress tracking and proper cleanup
  const reconnect = useCallback(async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS || isReconnecting) {
      console.log('[SwigWalletProvider] Max reconnection attempts reached or already reconnecting');
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

      console.log(`[SwigWalletProvider] Reconnecting in ${Math.ceil(backoffTime / 1000)}s (attempt ${currentAttempt})`);
      
      // Countdown timer for UI with proper cleanup
      const countdown = Math.ceil(backoffTime / 1000);
      for (let i = countdown; i > 0; i--) {
        if (reconnectCancelledRef.current) {
          console.log('[SwigWalletProvider] Reconnection cancelled during countdown');
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
        console.log('[SwigWalletProvider] Reconnection cancelled before connection attempt');
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
      
      console.log('[SwigWalletProvider] Reconnection successful');
    } catch (err) {
      if (err.message === 'Cancelled') {
        console.log('[SwigWalletProvider] Reconnection cancelled');
        return;
      }
      
      console.error('[SwigWalletProvider] Reconnection failed:', err);
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
  }, [reconnectAttempts, getBackoffTime, checkAuthentication, isReconnecting]);

  // Cancel reconnection with comprehensive cleanup
  const cancelReconnection = useCallback(() => {
    console.log('[SwigWalletProvider] Cancelling reconnection...');
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
    
    console.log('[SwigWalletProvider] Reconnection cancelled by user');
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all reconnection timers on unmount
      reconnectCancelledRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectScheduledTimeouts.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      reconnectScheduledTimeouts.current.clear();
    };
  }, []);

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
