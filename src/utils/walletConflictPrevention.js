/**
 * Wallet provider conflict prevention utility
 * Handles conflicts between MetaMask, Phantom, and other wallet extensions
 */

let walletConflictResolved = false;

/**
 * Prevents wallet provider conflicts by managing window.ethereum access
 * This addresses the MetaMask/Phantom provider conflict errors
 */
export const preventWalletProviderConflicts = () => {
  if (walletConflictResolved || typeof window === 'undefined') {
    return;
  }

  try {
    // Store original ethereum provider if it exists
    const originalEthereum = window.ethereum;
    
    // Create a safe ethereum provider wrapper
    const safeEthereumProvider = {
      get ethereum() {
        // Return the first available provider
        if (window.ethereum) {
          return window.ethereum;
        }
        return null;
      },
      
      set ethereum(provider) {
        // Prevent overwriting if already set and it's a valid provider
        if (!window.ethereum || !window.ethereum.isMetaMask) {
          try {
            Object.defineProperty(window, 'ethereum', {
              value: provider,
              writable: true,
              configurable: true
            });
          } catch (error) {
            console.warn('[WalletConflictPrevention] Could not set ethereum provider:', error.message);
          }
        }
      }
    };

    // Handle Phantom's EVM provider specifically
    if (window.phantom?.ethereum && !window.ethereum) {
      try {
        Object.defineProperty(window, 'ethereum', {
          value: window.phantom.ethereum,
          writable: true,
          configurable: true
        });
      } catch (error) {
        console.warn('[WalletConflictPrevention] Could not set Phantom ethereum provider:', error.message);
      }
    }

    // Handle multiple providers by creating a provider selector
    if (window.ethereum?.providers?.length > 1) {
      console.log('[WalletConflictPrevention] Multiple providers detected, using first available');
      
      // Use MetaMask if available, otherwise use first provider
      const preferredProvider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
      
      try {
        Object.defineProperty(window, 'ethereum', {
          value: preferredProvider,
          writable: true,
          configurable: true
        });
      } catch (error) {
        console.warn('[WalletConflictPrevention] Could not set preferred provider:', error.message);
      }
    }

    walletConflictResolved = true;
    console.log('[WalletConflictPrevention] Wallet provider conflicts resolved');
    
  } catch (error) {
    console.warn('[WalletConflictPrevention] Error preventing wallet conflicts:', error.message);
  }
};

/**
 * Detects if there are wallet provider conflicts
 */
export const detectWalletConflicts = () => {
  if (typeof window === 'undefined') {
    return { hasConflicts: false, providers: [] };
  }

  const providers = [];
  
  // Check for MetaMask
  if (window.ethereum?.isMetaMask) {
    providers.push('MetaMask');
  }
  
  // Check for Phantom EVM
  if (window.phantom?.ethereum) {
    providers.push('Phantom (EVM)');
  }
  
  // Check for multiple providers
  if (window.ethereum?.providers?.length > 1) {
    providers.push(`Multiple providers (${window.ethereum.providers.length})`);
  }

  return {
    hasConflicts: providers.length > 1,
    providers
  };
};

/**
 * Initializes wallet conflict prevention on app startup
 */
export const initializeWalletConflictPrevention = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Run immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preventWalletProviderConflicts);
  } else {
    preventWalletProviderConflicts();
  }

  // Also run when window loads to catch late-loading wallet extensions
  window.addEventListener('load', preventWalletProviderConflicts);
};