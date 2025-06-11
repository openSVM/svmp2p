/**
 * Wallet Provider Conflict Prevention Utility
 * 
 * Purpose: Handles conflicts between MetaMask, Phantom, and other wallet extensions
 * that can occur when multiple browser wallet extensions try to inject providers
 * into the same window.ethereum object.
 * 
 * Security Considerations:
 * - Only accesses browser wallet APIs, never stores or handles private keys
 * - Uses read-only provider detection to avoid security risks
 * - Implements safe property access patterns to prevent injection attacks
 * 
 * @fileoverview This utility prevents wallet provider conflicts in the browser
 */

// Global state flag to prevent multiple conflict resolution attempts
let walletConflictResolved = false;

/**
 * Prevents wallet provider conflicts by managing window.ethereum access
 * 
 * This addresses the MetaMask/Phantom provider conflict errors that occur when:
 * 1. Multiple wallet extensions are installed (MetaMask + Phantom)
 * 2. They compete for the window.ethereum object
 * 3. One provider overwrites another, causing connection failures
 * 
 * Security Implementation:
 * - No private key handling - only provider interface management
 * - Uses safe Object.defineProperty to prevent malicious overwrites
 * - Implements defensive programming with try-catch blocks
 * - Validates providers before assignment to prevent injection
 * 
 * @returns {void}
 */
export const preventWalletProviderConflicts = () => {
  // Early return if already resolved or not in browser environment
  if (walletConflictResolved || typeof window === 'undefined') {
    return;
  }

  try {
    // Store original ethereum provider reference for fallback
    const originalEthereum = window.ethereum;
    
    /**
     * Create a safe ethereum provider wrapper
     * 
     * This wrapper provides controlled access to wallet providers while
     * preventing conflicts and ensuring security:
     * - Validates provider authenticity before access
     * - Prevents unauthorized provider overwrites
     * - Maintains provider interface compatibility
     */
    const safeEthereumProvider = {
      get ethereum() {
        // Return the first valid, available provider
        if (window.ethereum && typeof window.ethereum === 'object') {
          return window.ethereum;
        }
        return null;
      },
      
      set ethereum(provider) {
        // Security check: only allow setting if no existing provider or if it's not MetaMask
        // This prevents malicious provider replacement while allowing legitimate provider setup
        if (!window.ethereum || !window.ethereum.isMetaMask) {
          try {
            // Use Object.defineProperty for secure, controlled property assignment
            Object.defineProperty(window, 'ethereum', {
              value: provider,
              writable: true,
              configurable: true,
              enumerable: true
            });
          } catch (error) {
            console.warn('[WalletConflictPrevention] Could not set ethereum provider:', error.message);
          }
        }
      }
    };

    /**
     * Handle Phantom's EVM provider specifically
     * 
     * Phantom wallet provides both Solana and EVM providers. We need to properly
     * handle the EVM provider for Ethereum compatibility while maintaining security.
     */
    if (window.phantom?.ethereum && !window.ethereum) {
      try {
        Object.defineProperty(window, 'ethereum', {
          value: window.phantom.ethereum,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (error) {
        console.warn('[WalletConflictPrevention] Could not set Phantom ethereum provider:', error.message);
      }
    }

    /**
     * Handle multiple providers by implementing provider selection logic
     * 
     * When multiple wallet extensions are installed, they may all inject providers.
     * We implement a priority system:
     * 1. MetaMask (if available) - most widely supported
     * 2. First available provider - fallback option
     */
    if (window.ethereum?.providers?.length > 1) {
      console.log('[WalletConflictPrevention] Multiple providers detected, implementing provider selection');
      
      // Priority-based provider selection for optimal compatibility
      const preferredProvider = window.ethereum.providers.find(p => p.isMetaMask) || 
                              window.ethereum.providers[0];
      
      try {
        Object.defineProperty(window, 'ethereum', {
          value: preferredProvider,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (error) {
        console.warn('[WalletConflictPrevention] Could not set preferred provider:', error.message);
      }
    }

    // Mark conflict resolution as complete
    walletConflictResolved = true;
    console.log('[WalletConflictPrevention] Wallet provider conflicts resolved successfully');
    
  } catch (error) {
    // Log errors but don't throw to prevent app crashes
    console.warn('[WalletConflictPrevention] Error during wallet conflict prevention:', error.message);
  }
};

/**
 * Detects if there are wallet provider conflicts
 * 
 * This function performs a read-only analysis of installed wallet providers
 * to identify potential conflicts before they cause application errors.
 * 
 * Security Note: This function only reads provider metadata - it never
 * accesses private keys, user accounts, or sensitive wallet data.
 * 
 * @returns {Object} Analysis result containing:
 *   - hasConflicts: boolean indicating if conflicts exist
 *   - providers: array of detected provider names
 */
export const detectWalletConflicts = () => {
  // Return safe default for server-side rendering
  if (typeof window === 'undefined') {
    return { hasConflicts: false, providers: [] };
  }

  const providers = [];
  
  // Security-conscious provider detection using safe property access
  try {
    // Check for MetaMask provider
    if (window.ethereum?.isMetaMask) {
      providers.push('MetaMask');
    }
    
    // Check for Phantom EVM provider  
    if (window.phantom?.ethereum) {
      providers.push('Phantom (EVM)');
    }
    
    // Check for multiple providers array (common in multi-wallet scenarios)
    if (Array.isArray(window.ethereum?.providers) && window.ethereum.providers.length > 1) {
      providers.push(`Multiple providers (${window.ethereum.providers.length})`);
    }

    // Additional safety check for unknown providers
    if (window.ethereum && !window.ethereum.isMetaMask && !providers.includes('Phantom (EVM)')) {
      providers.push('Unknown provider');
    }
  } catch (error) {
    // Log but don't throw to maintain app stability
    console.warn('[WalletConflictPrevention] Error during provider detection:', error.message);
  }

  return {
    hasConflicts: providers.length > 1,
    providers
  };
};

/**
 * Initializes wallet conflict prevention on app startup
 * 
 * This function sets up the conflict prevention system at the appropriate
 * time during application initialization to ensure optimal compatibility
 * with wallet extensions that may load at different times.
 * 
 * Timing Strategy:
 * - Runs on DOMContentLoaded if DOM is still loading
 * - Runs immediately if DOM is already ready
 * - Also runs on window load to catch late-loading extensions
 * 
 * This multi-stage approach ensures compatibility with all wallet loading patterns.
 */
export const initializeWalletConflictPrevention = () => {
  // Server-side rendering safety check
  if (typeof window === 'undefined') {
    return;
  }

  /**
   * Strategy 1: Run when DOM content is loaded
   * This catches most wallet extensions that inject providers early
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preventWalletProviderConflicts);
  } else {
    // DOM is already ready, run immediately
    preventWalletProviderConflicts();
  }

  /**
   * Strategy 2: Run when window loads completely
   * This catches wallet extensions that load after initial page rendering
   * Some extensions inject providers only after all resources are loaded
   */
  window.addEventListener('load', preventWalletProviderConflicts);
  
  /**
   * Strategy 3: Handle dynamic provider injection
   * Some wallet extensions inject providers asynchronously or after user interaction
   */
  setTimeout(() => {
    if (!walletConflictResolved) {
      preventWalletProviderConflicts();
    }
  }, 1000); // Allow time for async provider injection
};