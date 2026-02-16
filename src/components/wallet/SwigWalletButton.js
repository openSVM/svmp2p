/**
 * Modern Swig Wallet Connection Component
 * 
 * Migrated from .legacy/SwigWalletButton.js with improvements:
 * - Better separation of UI and business logic
 * - Enhanced accessibility and user experience
 * - Cleaner modal implementation
 * - Improved error handling and loading states
 */

import React, { useState, useCallback } from 'react';
import { useSwigWallet } from '../../contexts/SwigWalletProvider';
import { OAuthButtons } from '../common/OAuthButtons';

/**
 * Modal component for authentication
 */
const AuthModal = ({ isOpen, onClose, onAuthenticate, connecting, error }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1"
          aria-label="Close authentication modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="p-6 pt-12">
          <h2 id="auth-modal-title" className="text-xl font-bold text-center mb-4">
            Connect Wallet
          </h2>
          
          <OAuthButtons
            onSelect={onAuthenticate}
            isLoading={connecting}
          />
          
          {error && (
            <div 
              className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Connected wallet display component
 */
const ConnectedWallet = ({ walletAddress, onDisconnect, disconnecting }) => {
  const truncatedAddress = walletAddress 
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-sm font-medium">
          Connected
        </span>
        <span className="text-sm font-mono">
          {truncatedAddress}
        </span>
      </div>
      
      <button
        onClick={onDisconnect}
        disabled={disconnecting}
        className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Disconnect wallet"
      >
        {disconnecting ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  );
};

/**
 * Modern Swig wallet connection button component
 * Provides a compatible interface with the original WalletMultiButton
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Button variant ('primary', 'secondary', 'outline')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {boolean} props.showAddress - Whether to show address when connected
 */
export const SwigWalletButton = ({ 
  className = '',
  variant = 'primary',
  size = 'md',
  showAddress = true
}) => {
  const {
    connected,
    connecting,
    walletAddress,
    authenticate,
    disconnect,
    error,
  } = useSwigWallet();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Handle authentication method selection
  const handleAuthenticate = useCallback(async (method) => {
    try {
      setShowAuthModal(false);
      await authenticate(method);
    } catch (err) {
      console.error('Authentication failed:', err);
      // Error is already handled by the context and shown via toast
    }
  }, [authenticate]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      setDisconnecting(true);
      await disconnect();
    } catch (err) {
      console.error('Disconnect failed:', err);
    } finally {
      setDisconnecting(false);
    }
  }, [disconnect]);

  // Handle connect button click
  const handleConnectClick = useCallback(() => {
    if (!connecting) {
      setShowAuthModal(true);
    }
  }, [connecting]);

  // Button size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Button variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600',
  };

  // If connected, show wallet info
  if (connected && walletAddress && showAddress) {
    return (
      <ConnectedWallet
        walletAddress={walletAddress}
        onDisconnect={handleDisconnect}
        disconnecting={disconnecting}
      />
    );
  }

  // Show connect button
  return (
    <>
      <button
        onClick={handleConnectClick}
        disabled={connecting}
        className={`
          border rounded-lg font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        aria-label={connecting ? 'Connecting to wallet...' : 'Connect wallet'}
      >
        {connecting ? (
          <span className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticate={handleAuthenticate}
        connecting={connecting}
        error={error}
      />
    </>
  );
};

/**
 * Backward compatibility component
 * DEPRECATED: WalletMultiButton is deprecated. Use SwigWalletButton instead.
 */
export const WalletMultiButton = (props) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION WARNING] WalletMultiButton is deprecated and will be removed in v2.0.0. ' +
      'Please migrate to SwigWalletButton for the same functionality.'
    );
  }
  return <SwigWalletButton {...props} />;
};

export default SwigWalletButton;