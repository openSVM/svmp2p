/**
 * Swig Wallet Connection Component
 * 
 * Replaces WalletMultiButton with Swig-specific authentication UI
 */

import React, { useState } from 'react';
import { useSwigWallet } from '../contexts/SwigWalletProvider';
import { OAuthButtons } from './OAuthButtons';

/**
 * Swig wallet connection button component
 * Provides a compatible interface with the original WalletMultiButton
 */
export const SwigWalletButton = ({ className = '' }) => {
  const {
    connected,
    connecting,
    walletAddress,
    authenticate,
    disconnect,
    error,
  } = useSwigWallet();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleConnect = async (method) => {
    try {
      setShowAuthModal(false);
      await authenticate(method);
    } catch (err) {
      console.error('Authentication failed:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  // If connected, show disconnect button
  if (connected && walletAddress) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <div className="w-2 h-2 bg-green-300 rounded-full"></div>
          <span className="hidden sm:inline">
            {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
          </span>
          <span className="sm:hidden">Connected</span>
        </button>
      </div>
    );
  }

  // If connecting, show loading state
  if (connecting) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg opacity-50 cursor-not-allowed ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>Connecting...</span>
      </button>
    );
  }

  // Default state - show connect button
  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
        className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      >
        Connect Wallet
      </button>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
            {/* Close button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal content */}
            <div className="pt-4">
              <h2 className="text-xl font-bold text-center mb-4">Connect Wallet</h2>
              <OAuthButtons
                onSelect={handleConnect}
                isLoading={connecting}
              />
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// For compatibility with existing code
export const WalletMultiButton = SwigWalletButton;

export default SwigWalletButton;