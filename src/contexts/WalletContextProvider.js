/**
 * Legacy Wallet Context Provider - Deprecated
 * 
 * This file has been replaced with PhantomWalletProvider.
 * This is kept for backward compatibility only.
 */

import { PhantomWalletProvider, usePhantomWallet } from './PhantomWalletProvider';

// Re-export Phantom components for backward compatibility
export { PhantomWalletProvider as SafeWalletProvider, usePhantomWallet as useSafeWallet };

export default PhantomWalletProvider;
