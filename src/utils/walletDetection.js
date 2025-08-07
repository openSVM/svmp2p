/**
 * Phantom Wallet Detection Utility
 * 
 * Detects Phantom wallet availability and connection status, providing
 * user-friendly information about wallet availability and connection options.
 * 
 * Security Note: This utility only reads wallet availability and connection status.
 * It never accesses private keys, user accounts, or sensitive wallet data.
 */

/**
 * Detects Phantom wallet availability and connection status
 * @returns {Object} Object containing wallet state and recommendations
 */
export const detectPhantomWallet = async () => {
  // Return safe default for server-side rendering
  if (typeof window === 'undefined') {
    return {
      detected: [],
      recommended: [{
        name: 'Phantom Wallet',
        type: 'phantom',
        connected: false,
        icon: '👻',
        description: 'Secure Solana wallet browser extension'
      }],
      hasAnyWallet: false,
      needsConnection: true
    };
  }

  const detected = [];
  const available = [];

  try {
    // Check for Phantom wallet
    const phantomWallet = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
    
    if (phantomWallet) {
      // Phantom is installed
      const isConnected = phantomWallet.isConnected;
      
      if (isConnected && phantomWallet.publicKey) {
        detected.push({
          name: 'Phantom Wallet',
          type: 'phantom',
          address: phantomWallet.publicKey.toString(),
          connected: true,
          icon: '👻',
          description: 'Connected Phantom wallet'
        });
      }

      // Add to available wallets
      available.push({
        name: 'Phantom Wallet',
        type: 'phantom',
        connected: isConnected,
        icon: '👻',
        description: 'Secure Solana wallet browser extension',
        installed: true
      });
    } else {
      // Phantom is not installed
      available.push({
        name: 'Phantom Wallet',
        type: 'phantom',
        connected: false,
        icon: '👻',
        description: 'Secure Solana wallet browser extension',
        installed: false,
        installUrl: 'https://phantom.app/'
      });
    }

    // Determine recommendations based on connection status
    const recommended = getPhantomWalletRecommendations(detected, available, phantomWallet);

    return {
      detected,
      available,
      recommended,
      hasAnyWallet: detected.length > 0,
      needsConnection: !detected.length > 0,
      isPhantomInstalled: !!phantomWallet,
      isConnected: phantomWallet ? phantomWallet.isConnected : false
    };
  } catch (error) {
    console.error('[detectPhantomWallet] Error detecting wallet:', error);
    
    // Return safe fallback
    return {
      detected: [],
      available: [{
        name: 'Phantom Wallet',
        type: 'phantom',
        connected: false,
        icon: '👻',
        description: 'Secure Solana wallet browser extension',
        installed: false,
        installUrl: 'https://phantom.app/'
      }],
      recommended: [{
        name: 'Phantom Wallet',
        type: 'phantom',
        connected: false,
        icon: '👻',
        description: 'Install Phantom wallet to get started',
        reason: 'Phantom wallet is required to use this application'
      }],
      hasAnyWallet: false,
      needsConnection: true,
      isPhantomInstalled: false,
      isConnected: false
    };
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use detectPhantomWallet instead
 */
export const detectSolanaWallets = detectPhantomWallet;

/**
 * Generate wallet recommendations based on detection results
 * @param {Array} detected - Array of detected wallets
 * @param {Array} available - Array of available wallet options
 * @param {Object} phantomWallet - Phantom wallet instance
 * @returns {Array} Array of wallet recommendations
 */
const getPhantomWalletRecommendations = (detected, available, phantomWallet) => {
  const recommendations = [];

  if (!phantomWallet) {
    // Phantom not installed
    recommendations.push({
      name: 'Phantom Wallet',
      type: 'phantom',
      connected: false,
      icon: '👻',
      description: 'Install Phantom wallet to get started',
      reason: 'Phantom wallet extension is required to use this application',
      priority: 'high',
      action: 'install',
      installUrl: 'https://phantom.app/'
    });
  } else if (!phantomWallet.isConnected) {
    // Phantom installed but not connected
    recommendations.push({
      name: 'Phantom Wallet',
      type: 'phantom',
      connected: false,
      icon: '👻',
      description: 'Connect your Phantom wallet to get started',
      reason: 'Click the connect button to link your Phantom wallet',
      priority: 'high',
      action: 'connect'
    });
  } else if (detected.length > 0) {
    // Phantom connected
    detected.forEach(wallet => {
      recommendations.push({
        ...wallet,
        reason: 'Ready to use - wallet is connected and available',
        priority: 'low',
        action: 'ready'
      });
    });
  }

  return recommendations;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getPhantomWalletRecommendations instead
 */
const getWalletRecommendations = getPhantomWalletRecommendations;

/**
 * Check if current environment supports Phantom wallet
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

  // Check for basic browser capabilities needed for Phantom wallet
  const hasLocalStorage = typeof Storage !== 'undefined';
  const hasWebCrypto = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
  const supportsExtensions = typeof window.chrome !== 'undefined' || typeof window.browser !== 'undefined';

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

  if (!supportsExtensions) {
    return {
      supported: false,
      reason: 'Browser extensions not supported',
      recommendations: ['Use Chrome, Firefox, or other extension-capable browsers']
    };
  }

  return {
    supported: true,
    reason: 'All required features are available',
    recommendations: []
  };
};

/**
 * Get troubleshooting steps for Phantom wallet connection issues
 * @param {Object} walletState - Current wallet state
 * @returns {Array} Array of troubleshooting steps
 */
export const getConnectionTroubleshootingSteps = (walletState) => {
  const steps = [];

  if (!walletState.isPhantomInstalled) {
    steps.push({
      title: 'Install Phantom Wallet',
      description: 'You need to install the Phantom browser extension to use this application',
      action: 'install_phantom',
      priority: 'high',
      url: 'https://phantom.app/'
    });
  }

  if (walletState.isPhantomInstalled && !walletState.isConnected) {
    steps.push({
      title: 'Connect Phantom Wallet',
      description: 'Click the connect button to link your Phantom wallet to this application',
      action: 'connect',
      priority: 'high'
    });
  }

  if (walletState.isConnected && walletState.error) {
    steps.push({
      title: 'Refresh Connection',
      description: 'Try refreshing the page to re-establish the connection',
      action: 'refresh',
      priority: 'high'
    });

    steps.push({
      title: 'Check Phantom Extension',
      description: 'Make sure Phantom extension is enabled and unlocked',
      action: 'check_extension',
      priority: 'high'
    });
  }

  if (walletState.error) {
    steps.push({
      title: 'Clear Browser Data',
      description: 'Clear cookies and local storage, then try connecting again',
      action: 'clear_data',
      priority: 'medium'
    });

    steps.push({
      title: 'Check Network Connection',
      description: 'Ensure you have a stable internet connection',
      action: 'check_network',
      priority: 'medium'
    });

    steps.push({
      title: 'Restart Browser',
      description: 'Close and restart your browser, then try connecting again',
      action: 'restart_browser',
      priority: 'medium'
    });
  }

  // Add general troubleshooting steps
  steps.push({
    title: 'Disable Ad Blockers',
    description: 'Ad blockers may interfere with wallet extensions',
    action: 'disable_adblocker',
    priority: 'low'
  });

  steps.push({
    title: 'Use Incognito Mode',
    description: 'Try using private/incognito browsing mode to isolate issues',
    action: 'incognito',
    priority: 'low'
  });

  steps.push({
    title: 'Update Browser',
    description: 'Ensure you are using the latest version of your browser',
    action: 'update_browser',
    priority: 'low'
  });

  return steps;
};

/**
 * Legacy browser support check
 * @deprecated Use checkWalletSupport instead
 */
export const checkBrowserSupport = checkWalletSupport;