/**
 * Swig Wallet Detection Utility
 * 
 * Detects Swig wallet authentication status and provides
 * user-friendly information about authentication and connection options.
 * 
 * Security Note: This utility only reads authentication status and availability.
 * It never accesses private keys, user accounts, or sensitive wallet data.
 */

import { para } from '../client/para';

/**
 * Detects Swig wallet authentication status and available options
 * @returns {Object} Object containing authentication state and recommendations
 */
export const detectSwigWallet = async () => {
  // Return safe default for server-side rendering
  if (typeof window === 'undefined') {
    return {
      detected: [],
      recommended: [{
        name: 'Swig Wallet',
        type: 'swig',
        authenticated: false,
        icon: '🔐',
        description: 'OAuth-based in-app wallet with multi-chain support'
      }],
      hasAnyWallet: false,
      needsAuthentication: true
    };
  }

  const detected = [];
  const available = [];

  try {
    // Check Swig wallet authentication status
    const isAuthenticated = await para.isFullyLoggedIn();
    
    if (isAuthenticated) {
      const wallets = await para.getWallets();
      const walletEntries = Object.values(wallets);
      
      walletEntries.forEach(wallet => {
        detected.push({
          name: 'Swig Wallet',
          type: 'swig',
          walletType: wallet.type, // 'SOLANA' or 'EVM'
          address: wallet.address,
          authenticated: true,
          icon: wallet.type === 'SOLANA' ? '◉' : '⬢',
          description: `${wallet.type} wallet via Swig`
        });
      });
    }

    // Add available authentication methods
    available.push({
      name: 'Swig Wallet',
      type: 'swig',
      authenticated: isAuthenticated,
      icon: '🔐',
      description: 'OAuth-based in-app wallet with multi-chain support',
      authMethods: ['Google', 'Apple', 'Farcaster']
    });

    // Determine recommendations based on authentication status
    const recommended = getSwigWalletRecommendations(detected, available, isAuthenticated);

    return {
      detected,
      available,
      recommended,
      hasAnyWallet: detected.length > 0,
      needsAuthentication: !isAuthenticated,
      isAuthenticated
    };
  } catch (error) {
    console.error('[detectSwigWallet] Error detecting wallet:', error);
    
    // Return safe fallback
    return {
      detected: [],
      available: [{
        name: 'Swig Wallet',
        type: 'swig',
        authenticated: false,
        icon: '🔐',
        description: 'OAuth-based in-app wallet with multi-chain support',
        authMethods: ['Google', 'Apple', 'Farcaster']
      }],
      recommended: [{
        name: 'Swig Wallet',
        type: 'swig',
        authenticated: false,
        icon: '🔐',
        description: 'OAuth-based in-app wallet with multi-chain support',
        reason: 'Sign in with OAuth to access your wallet'
      }],
      hasAnyWallet: false,
      needsAuthentication: true,
      isAuthenticated: false
    };
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use detectSwigWallet instead
 */
export const detectSolanaWallets = detectSwigWallet;

/**
 * Generate wallet recommendations based on detection results
 * @param {Array} detected - Array of detected wallets
 * @param {Array} available - Array of available wallet options
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Array} Array of wallet recommendations
 */
const getSwigWalletRecommendations = (detected, available, isAuthenticated) => {
  const recommendations = [];

  if (!isAuthenticated) {
    recommendations.push({
      name: 'Swig Wallet',
      type: 'swig',
      authenticated: false,
      icon: '🔐',
      description: 'OAuth-based in-app wallet with multi-chain support',
      reason: 'Sign in with your preferred OAuth provider to get started',
      priority: 'high'
    });
  } else if (detected.length > 0) {
    detected.forEach(wallet => {
      recommendations.push({
        ...wallet,
        reason: 'Ready to use - wallet is authenticated and available',
        priority: 'low'
      });
    });
  }

  return recommendations;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getSwigWalletRecommendations instead
 */
const getWalletRecommendations = getSwigWalletRecommendations;

/**
 * Check if current environment supports Swig wallet
 * @returns {Object} Browser support information
 */
export const checkWalletSupport = () => {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      reason: 'Server-side rendering environment',
      recommendations: ['Enable JavaScript and use a modern browser']
    };
  }

  // Check for basic browser capabilities needed for Swig wallet
  const hasLocalStorage = typeof Storage !== 'undefined';
  const hasWebCrypto = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
  const hasPopupSupport = typeof window.open === 'function';

  if (!hasLocalStorage) {
    return {
      supported: false,
      reason: 'LocalStorage not available',
      recommendations: ['Use a modern browser with LocalStorage support']
    };
  }

  if (!hasWebCrypto) {
    return {
      supported: false,
      reason: 'Web Crypto API not available',
      recommendations: ['Use a modern browser with Web Crypto API support']
    };
  }

  if (!hasPopupSupport) {
    return {
      supported: false,
      reason: 'Popup windows not supported',
      recommendations: ['Enable popups for OAuth authentication']
    };
  }

  return {
    supported: true,
    reason: 'All required features are available',
    recommendations: []
  };
};

/**
 * Get troubleshooting steps for Swig wallet connection issues
 * @param {Object} walletState - Current wallet state
 * @returns {Array} Array of troubleshooting steps
 */
export const getConnectionTroubleshootingSteps = (walletState) => {
  const steps = [];

  if (!walletState.isAuthenticated) {
    steps.push({
      title: 'Sign in with OAuth',
      description: 'You need to authenticate with an OAuth provider to access your wallet',
      action: 'authenticate',
      priority: 'high'
    });
  }

  if (walletState.isAuthenticated && !walletState.connected) {
    steps.push({
      title: 'Check Authentication Status',
      description: 'Verify that your authentication session is still valid',
      action: 'check_auth',
      priority: 'high'
    });

    steps.push({
      title: 'Refresh Connection',
      description: 'Try refreshing the page to re-establish the connection',
      action: 'refresh',
      priority: 'medium'
    });
  }

  if (walletState.error) {
    steps.push({
      title: 'Clear Browser Data',
      description: 'Clear cookies and local storage, then try authenticating again',
      action: 'clear_data',
      priority: 'high'
    });

    steps.push({
      title: 'Check Network Connection',
      description: 'Ensure you have a stable internet connection',
      action: 'check_network',
      priority: 'medium'
    });

    steps.push({
      title: 'Try Different OAuth Provider',
      description: 'If one OAuth method fails, try signing in with a different provider',
      action: 'try_different_oauth',
      priority: 'medium'
    });
  }

  // Add general troubleshooting steps
  steps.push({
    title: 'Disable Ad Blockers',
    description: 'Ad blockers may interfere with OAuth popup windows',
    action: 'disable_adblocker',
    priority: 'low'
  });

  steps.push({
    title: 'Use Incognito Mode',
    description: 'Try using private/incognito browsing mode to isolate issues',
    action: 'incognito',
    priority: 'low'
  });

  return steps;
};

/**
 * Legacy browser support check
 * @deprecated Use checkWalletSupport instead
 */
export const checkBrowserSupport = checkWalletSupport;