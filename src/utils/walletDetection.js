/**
 * Solana Wallet Detection Utility
 * 
 * Detects available Solana wallets in the browser and provides
 * user-friendly information about installation and connection options.
 * 
 * Security Note: This utility only reads wallet metadata and availability.
 * It never accesses private keys, user accounts, or sensitive wallet data.
 */

/**
 * Detects available Solana wallets in the browser
 * @returns {Object} Object containing detected wallets and recommendations
 */
export const detectSolanaWallets = () => {
  // Return safe default for server-side rendering
  if (typeof window === 'undefined') {
    return {
      detected: [],
      recommended: [],
      hasAnyWallet: false,
      needsInstallation: true
    };
  }

  const detected = [];
  const available = [];

  try {
    // Check for Phantom wallet (Solana)
    if (window.phantom?.solana?.isPhantom) {
      detected.push({
        name: 'Phantom',
        type: 'solana',
        installed: true,
        icon: '👻',
        downloadUrl: 'https://phantom.app/',
        description: 'Popular Solana wallet with excellent mobile support'
      });
    } else {
      available.push({
        name: 'Phantom',
        type: 'solana',
        installed: false,
        icon: '👻',
        downloadUrl: 'https://phantom.app/',
        description: 'Popular Solana wallet with excellent mobile support'
      });
    }

    // Placeholder for Backpack wallet detection - to be implemented
    // Note: Backpack detection will be added once integration details are confirmed
    available.push({
      name: 'Backpack',
      type: 'solana',
      installed: false, // Will be updated with proper detection
      icon: '🎒',
      downloadUrl: 'https://backpack.app/',
      description: 'Feature-rich Solana wallet with social features'
    });

    // Determine recommendations based on detected wallets
    const recommended = getWalletRecommendations(detected, available);

    return {
      detected,
      available,
      recommended,
      hasAnyWallet: detected.length > 0,
      needsInstallation: detected.length === 0
    };

  } catch (error) {
    console.warn('[WalletDetection] Error during wallet detection:', error.message);
    
    // Return safe fallback with basic recommendations
    return {
      detected: [],
      available: [
        {
          name: 'Phantom',
          type: 'solana',
          installed: false,
          icon: '👻',
          downloadUrl: 'https://phantom.app/',
          description: 'Popular Solana wallet with excellent mobile support'
        }
      ],
      recommended: [{
        name: 'Phantom',
        type: 'solana',
        installed: false,
        icon: '👻',
        downloadUrl: 'https://phantom.app/',
        description: 'Popular Solana wallet with excellent mobile support',
        reason: 'Most popular Solana wallet for beginners'
      }],
      hasAnyWallet: false,
      needsInstallation: true
    };
  }
};

/**
 * Generate wallet recommendations based on detected wallets and user context
 * @param {Array} detected - List of detected/installed wallets
 * @param {Array} available - List of available wallets
 * @returns {Array} Recommended wallets with reasons
 */
const getWalletRecommendations = (detected, available) => {
  const recommendations = [];

  // If user has wallets installed, recommend using them
  if (detected.length > 0) {
    detected.forEach(wallet => {
      recommendations.push({
        ...wallet,
        reason: 'Already installed on your device'
      });
    });
  }

  // If no wallets are detected, recommend based on user type
  if (detected.length === 0) {
    // Recommend Phantom for beginners (most popular)
    const phantom = available.find(w => w.name === 'Phantom');
    if (phantom) {
      recommendations.push({
        ...phantom,
        reason: 'Most popular Solana wallet for beginners'
      });
    }

    // Recommend Backpack as an alternative
    const backpack = available.find(w => w.name === 'Backpack');
    if (backpack) {
      recommendations.push({
        ...backpack,
        reason: 'Modern wallet with social features'
      });
    }
  }

  return recommendations;
};

/**
 * Check if the user's device/browser supports wallet extensions
 * @returns {Object} Support information
 */
export const checkWalletSupport = () => {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server-side rendering' };
  }

  // Check if running in a browser that supports extensions
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
  
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    return {
      supported: true,
      reason: 'Mobile supported',
      recommendations: [
        'Use Phantom mobile app with built-in browser',
        'Or copy connection link to your mobile wallet'
      ]
    };
  }

  if (isChrome || isFirefox || isEdge) {
    return {
      supported: true,
      reason: 'Desktop browser with extension support',
      recommendations: ['Install wallet extension from official store']
    };
  }

  if (isSafari) {
    return {
      supported: false,
      reason: 'Safari has limited extension support',
      recommendations: [
        'Use Chrome, Firefox, or Edge for best wallet support',
        'Or use web-based wallet options when available'
      ]
    };
  }

  return {
    supported: false,
    reason: 'Unsupported browser',
    recommendations: [
      'Use Chrome, Firefox, or Edge for wallet support',
      'Or use web-based wallet options when available'
    ]
  };
};

/**
 * Get connection troubleshooting steps based on detected wallet state
 * @param {Object} walletState - Current wallet connection state
 * @returns {Array} Array of troubleshooting steps
 */
export const getConnectionTroubleshootingSteps = (walletState) => {
  const steps = [];

  if (!walletState.hasAnyWallet) {
    steps.push({
      title: 'Install a Solana Wallet',
      description: 'You need a Solana-compatible wallet to connect',
      action: 'install',
      priority: 'high'
    });
  }

  if (walletState.hasAnyWallet && !walletState.connected) {
    steps.push({
      title: 'Click Connect Wallet',
      description: 'Use the wallet connection button to start the process',
      action: 'connect',
      priority: 'high'
    });

    steps.push({
      title: 'Approve Connection',
      description: 'Your wallet will ask for permission to connect - click Approve',
      action: 'approve',
      priority: 'medium'
    });
  }

  if (walletState.error) {
    steps.push({
      title: 'Check Wallet Status',
      description: 'Make sure your wallet extension is unlocked and functioning',
      action: 'check',
      priority: 'high'
    });

    steps.push({
      title: 'Refresh and Retry',
      description: 'Sometimes a simple refresh resolves connection issues',
      action: 'refresh',
      priority: 'medium'
    });
  }

  // Always include network troubleshooting
  steps.push({
    title: 'Check Network Connection',
    description: 'Ensure you have a stable internet connection',
    action: 'network',
    priority: 'low'
  });

  return steps;
};