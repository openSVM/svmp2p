/**
 * Para SDK Client Configuration
 * 
 * This module initializes the Para SDK client for OAuth authentication
 * and wallet management functionality.
 */

import { Environment, ParaWeb } from '@getpara/web-sdk';

// Para API key - in production, this should be set via environment variables
const API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY || process.env.PARA_API_KEY;

if (!API_KEY) {
  console.warn('Para API key not found. Please set NEXT_PUBLIC_PARA_API_KEY in your environment variables.');
  // For development, we'll create a mock client
}

/**
 * Para Web SDK client instance
 * Uses Beta environment by default
 */
export const para = API_KEY 
  ? new ParaWeb(Environment.BETA, API_KEY)
  : {
    // Mock client for development when API key is not available
    isFullyLoggedIn: () => Promise.resolve(false),
    getWallets: () => Promise.resolve({}),
    logout: () => Promise.resolve(),
    getFarcasterConnectURL: () => Promise.resolve(''),
    waitForFarcasterStatus: () => Promise.resolve({ userExists: false, username: '' }),
    initiateUserLogin: () => Promise.resolve(''),
    getSetUpBiometricsURL: () => Promise.resolve(''),
    waitForLoginAndSetup: () => Promise.resolve({}),
    waitForPasskeyAndCreateWallet: () => Promise.resolve({}),
    getOAuthURL: () => Promise.resolve(''),
    waitForOAuth: () => Promise.resolve({ email: '', userExists: false }),
    createWallet: () => Promise.resolve({}),
    findWalletByAddress: () => Promise.resolve(null),
    signMessage: () => Promise.resolve({ signature: '' })
  };

export default para;