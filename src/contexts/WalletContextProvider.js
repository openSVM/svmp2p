/**
 * Legacy Wallet Context Provider - Deprecated
 * 
 * This file has been replaced with SwigWalletProvider.
 * This is kept for backward compatibility only.
 */

import { SwigWalletProvider, useSwigWallet } from './SwigWalletProvider';

// Re-export SwigWallet components for backward compatibility
export { SwigWalletProvider as SafeWalletProvider, useSwigWallet as useSafeWallet };

export default SwigWalletProvider;
