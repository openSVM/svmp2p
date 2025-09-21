/**
 * Modern Swig Wallet Context Provider
 * 
 * Migrated from .legacy/SwigWalletProvider.js with improved:
 * - Modular hook-based architecture
 * - Better error handling and state management
 * - Separation of concerns
 * - Enhanced TypeScript support preparation
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { OAuthMethod } from '@getpara/web-sdk';
import { useToast } from '../hooks/useToast';
import { SVM_NETWORKS, getNetworkConfig, getDefaultNetworkConfig } from '../config/networks';
import { ERROR_CATEGORIES } from '../hooks/useToast';

// Enhanced configuration with better defaults
const SWIG_CONFIG = {
  MAX_RECONNECTION_ATTEMPTS: 3,
  RECONNECTION_DELAY: 2000,
  POPUP_TIMEOUT: 30000,
  STORAGE_KEYS: {
    AUTO_RECONNECT: 'swigWallet_autoReconnect',
    LAST_AUTH_METHOD: 'swigWallet_lastAuthMethod',
    USER_PREFERENCES: 'swigWallet_userPreferences',
  },
};

// Create the context with proper typing preparation
const SwigWalletContext = createContext(null);

/**
 * Custom hook for using Swig wallet functionality
 * Provides a clean interface for components to interact with wallet
 */
export const useSwigWallet = () => {
  const context = useContext(SwigWalletContext);
  if (!context) {
    throw new Error('useSwigWallet must be used within a SwigWalletProvider');
  }
  return context;
};

/**
 * Modern Swig Wallet Provider Component
 * Replaces legacy implementation with improved architecture
 */
export const SwigWalletProvider = ({ children }) => {
  // Core wallet state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);
  
  // Network and configuration state
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  // Reconnection management
  const [showReconnectionModal, setShowReconnectionModal] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // References for cleanup and management
  const paraRef = useRef(null);
  const reconnectionTimeoutRef = useRef(null);
  const authPopupRef = useRef(null);
  
  const toast = useToast();

  /**
   * Initialize Para SDK with proper error handling
   */
  const initializePara = useCallback(async () => {
    try {
      if (paraRef.current) return paraRef.current;

      const apiKey = process.env.NEXT_PUBLIC_PARA_API_KEY || process.env.PARA_API_KEY;
      
      if (!apiKey) {
        console.warn('Para API key not found. Using mock wallet functions for development.');
        return createMockPara();
      }

      const { para } = await import('../client/para');
      paraRef.current = para;
      return para;
    } catch (error) {
      console.error('Failed to initialize Para SDK:', error);
      toast.systemError('Failed to initialize wallet SDK', {
        category: ERROR_CATEGORIES.SYSTEM,
      });
      return createMockPara();
    }
  }, [toast]);

  /**
   * Create mock Para instance for development
   */
  const createMockPara = () => ({
    getOAuthURL: async () => 'mock://oauth',
    waitForOAuthCompletion: async () => ({ success: true }),
    getWallets: async () => [{ address: 'mock-address' }],
    // Add other mock methods as needed
  });

  /**
   * Enhanced popup management with better blocking detection
   */
  const detectPopupBlocked = useCallback((popup) => {
    if (!popup) return true;
    
    try {
      // Check if popup was blocked
      if (popup.closed || popup.location?.href === 'about:blank') {
        return true;
      }
      
      // Additional check for some browsers
      setTimeout(() => {
        if (popup.closed || !popup.location) {
          return true;
        }
      }, 100);
      
      return false;
    } catch (error) {
      return true;
    }
  }, []);

  /**
   * Show fallback options when popup is blocked
   */
  const showPopupBlockedFallback = useCallback((authUrl, method) => {
    const methodName = method === OAuthMethod.GOOGLE ? 'Google' : 
                      method === OAuthMethod.FARCASTER ? 'Farcaster' : 'OAuth';
    
    toast.systemError('Popup blocked. Please allow popups for this site and try again.', {
      category: ERROR_CATEGORIES.SYSTEM,
      duration: 15000,
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
              window.location.href = authUrl;
            }}
            className="block w-full px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Continue in This Tab
          </button>
        </div>
      ),
    });
  }, [toast]);

  /**
   * Enhanced authentication with better error handling
   */
  const authenticate = useCallback(async (method) => {
    if (connecting) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      const para = await initializePara();
      
      // Enhanced OAuth flow with proper popup management
      const oAuthURL = await para.getOAuthURL({ method });
      const popup = window.open(oAuthURL, 'oAuthPopup', 'popup=true,width=500,height=600');
      
      if (detectPopupBlocked(popup)) {
        showPopupBlockedFallback(oAuthURL, method);
        throw new Error('POPUP_BLOCKED');
      }
      
      authPopupRef.current = popup;
      
      // Wait for OAuth completion with timeout
      const result = await Promise.race([
        para.waitForOAuthCompletion({ popupWindow: popup }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), SWIG_CONFIG.POPUP_TIMEOUT)
        ),
      ]);
      
      if (result.success) {
        const wallets = await para.getWallets();
        if (wallets && wallets.length > 0) {
          setWalletAddress(wallets[0].address);
          setConnected(true);
          
          // Store auth method for reconnection
          localStorage.setItem(SWIG_CONFIG.STORAGE_KEYS.LAST_AUTH_METHOD, method);
          
          toast.successToast('Wallet connected successfully');
        }
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.message === 'POPUP_BLOCKED') {
        return; // Already handled by fallback
      } else if (error.message === 'TIMEOUT') {
        errorMessage = 'Authentication timed out. Please try again.';
      }
      
      setError(errorMessage);
      toast.errorToast(errorMessage);
    } finally {
      setConnecting(false);
      authPopupRef.current = null;
    }
  }, [connecting, initializePara, detectPopupBlocked, showPopupBlockedFallback, toast]);

  /**
   * Enhanced disconnect with proper cleanup
   */
  const disconnect = useCallback(async () => {
    try {
      setConnected(false);
      setWalletAddress(null);
      setError(null);
      
      // Clear stored data
      localStorage.removeItem(SWIG_CONFIG.STORAGE_KEYS.LAST_AUTH_METHOD);
      
      // Close any open popups
      if (authPopupRef.current && !authPopupRef.current.closed) {
        authPopupRef.current.close();
      }
      
      toast.infoToast('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.errorToast('Failed to disconnect wallet');
    }
  }, [toast]);

  /**
   * Auto-reconnection logic with exponential backoff
   */
  const attemptReconnection = useCallback(async () => {
    if (!autoReconnect || isReconnecting || reconnectionAttempts >= SWIG_CONFIG.MAX_RECONNECTION_ATTEMPTS) {
      return;
    }
    
    setIsReconnecting(true);
    const lastAuthMethod = localStorage.getItem(SWIG_CONFIG.STORAGE_KEYS.LAST_AUTH_METHOD);
    
    if (lastAuthMethod) {
      try {
        await authenticate(lastAuthMethod);
        setReconnectionAttempts(0);
        setShowReconnectionModal(false);
      } catch (error) {
        const newAttempts = reconnectionAttempts + 1;
        setReconnectionAttempts(newAttempts);
        
        if (newAttempts < SWIG_CONFIG.MAX_RECONNECTION_ATTEMPTS) {
          const delay = SWIG_CONFIG.RECONNECTION_DELAY * Math.pow(2, newAttempts - 1);
          reconnectionTimeoutRef.current = setTimeout(attemptReconnection, delay);
        } else {
          setShowReconnectionModal(true);
        }
      }
    }
    
    setIsReconnecting(false);
  }, [autoReconnect, isReconnecting, reconnectionAttempts, authenticate]);

  /**
   * Network switching functionality
   */
  const switchNetwork = useCallback(async (networkId) => {
    try {
      const networkConfig = getNetworkConfig(networkId);
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${networkId}`);
      }
      
      setSelectedNetwork(networkId);
      toast.infoToast(`Switched to ${networkConfig.name}`);
    } catch (error) {
      console.error('Network switch failed:', error);
      toast.errorToast('Failed to switch network');
    }
  }, [toast]);

  /**
   * Get current network configuration
   */
  const getCurrentNetwork = useCallback(() => {
    return getNetworkConfig(selectedNetwork) || getDefaultNetworkConfig();
  }, [selectedNetwork]);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
      if (authPopupRef.current && !authPopupRef.current.closed) {
        authPopupRef.current.close();
      }
    };
  }, []);

  /**
   * Initialize auto-reconnection on mount
   */
  useEffect(() => {
    if (autoReconnect && !connected) {
      const lastAuthMethod = localStorage.getItem(SWIG_CONFIG.STORAGE_KEYS.LAST_AUTH_METHOD);
      if (lastAuthMethod) {
        setShowReconnectionModal(true);
      }
    }
  }, [autoReconnect, connected]);

  // Context value with all functionality
  const contextValue = {
    // Core state
    connected,
    connecting,
    walletAddress,
    error,
    
    // Network management
    selectedNetwork,
    getCurrentNetwork,
    switchNetwork,
    
    // Wallet actions
    authenticate,
    disconnect,
    
    // Reconnection state
    showReconnectionModal,
    setShowReconnectionModal,
    isReconnecting,
    reconnectionAttempts,
    attemptReconnection,
    
    // Configuration
    autoReconnect,
    setAutoReconnect,
  };

  return (
    <SwigWalletContext.Provider value={contextValue}>
      {children}
    </SwigWalletContext.Provider>
  );
};

export default SwigWalletProvider;