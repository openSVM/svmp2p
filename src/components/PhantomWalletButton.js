/**
 * Phantom Wallet Connection Component
 * 
 * Replaces SwigWalletButton with Phantom-specific connection UI
 */

import React, { useState } from 'react';
import { usePhantomWallet } from '../contexts/PhantomWalletProvider';

/**
 * Phantom wallet connection button component
 * Provides a compatible interface with the original SwigWalletButton
 */
export const PhantomWalletButton = ({ className = '' }) => {
  const {
    connected,
    connecting,
    walletAddress,
    connect,
    disconnect,
    error,
  } = usePhantomWallet();

  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
      // Check if Phantom is not installed
      if (err.message && err.message.includes('not found')) {
        setShowInstallModal(true);
      }
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
          title={`Connected to ${walletAddress}`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <img 
              src="/images/phantom-logo.svg" 
              alt="Phantom" 
              className="w-4 h-4"
            />
          </div>
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
        onClick={handleConnect}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <img 
            src="/images/phantom-logo.svg" 
            alt="Phantom" 
            className="w-4 h-4"
          />
        </div>
        <span>Connect Phantom</span>
      </button>

      {/* Install Phantom Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            {/* Close button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal content */}
            <div className="pt-4">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/images/phantom-logo.svg" 
                  alt="Phantom" 
                  className="w-16 h-16"
                />
              </div>
              
              <h2 className="text-xl font-bold text-center mb-4">Install Phantom Wallet</h2>
              
              <p className="text-gray-600 text-center mb-6">
                Phantom wallet is required to use this application. It's a secure and easy-to-use Solana wallet.
              </p>
              
              <div className="space-y-3">
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Download Phantom Wallet
                </a>
                
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="block w-full px-4 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After installing Phantom, refresh this page and try connecting again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm max-w-xs">
          {error}
        </div>
      )}
    </>
  );
};

// For compatibility with existing code
// DEPRECATED: SwigWalletButton is deprecated. Use PhantomWalletButton instead.
export const SwigWalletButton = (props) => {
  console.warn(
    '[MIGRATION WARNING] SwigWalletButton is now an alias for PhantomWalletButton. ' +
    'Please update your code to use PhantomWalletButton directly.'
  );
  return <PhantomWalletButton {...props} />;
};

// For compatibility with existing code
export const WalletMultiButton = (props) => {
  console.warn(
    '[MIGRATION WARNING] WalletMultiButton is now an alias for PhantomWalletButton. ' +
    'Please update your code to use PhantomWalletButton directly.'
  );
  return <PhantomWalletButton {...props} />;
};

export default PhantomWalletButton;