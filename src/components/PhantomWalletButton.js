/**
 * Phantom Wallet Connection Component
 * 
 * Replaces SwigWalletButton with Phantom-specific connection UI
 */

import React, { useState } from 'react';
import Image from 'next/image';
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
      <div className={`ascii-wallet-button-container ${className}`}>
        <button
          onClick={handleDisconnect}
          className="ascii-wallet-button connected"
          title={`Connected to ${walletAddress}`}
        >
          <div className="ascii-wallet-icon">
            <Image 
              src="/images/phantom-logo.svg" 
              alt="Phantom" 
              width={12}
              height={12}
            />
          </div>
          <span className="ascii-wallet-status-indicator">●</span>
          <span className="ascii-wallet-text">
            CONNECT PHANTOM
          </span>
        </button>
      </div>
    );
  }

  // If connecting, show loading state
  if (connecting) {
    return (
      <button
        disabled
        className={`ascii-wallet-button connecting ${className}`}
      >
        <span className="ascii-wallet-spinner">⟳</span>
        <span className="ascii-wallet-text">CONNECTING...</span>
      </button>
    );
  }

  // Default state - show connect button
  return (
    <>
      <button
        onClick={handleConnect}
        className={`ascii-wallet-button ${className}`}
      >
        <div className="ascii-wallet-icon">
          <Image 
            src="/images/phantom-logo.svg" 
            alt="Phantom" 
            width={12}
            height={12}
          />
        </div>
        <span className="ascii-wallet-text">CONNECT PHANTOM</span>
      </button>

      {/* Install Phantom Modal */}
      {showInstallModal && (
        <div className="ascii-modal-backdrop">
          <div className="ascii-modal">
            {/* Close button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="ascii-modal-close"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Modal content */}
            <div className="ascii-modal-content">
              <div className="ascii-modal-icon">
                <Image 
                  src="/images/phantom-logo.svg" 
                  alt="Phantom" 
                  width={32}
                  height={32}
                />
              </div>
              
              <h2 className="ascii-modal-title">INSTALL PHANTOM WALLET</h2>
              
              <p className="ascii-modal-text">
                PHANTOM WALLET IS REQUIRED TO USE THIS APPLICATION. IT'S A SECURE AND EASY-TO-USE SOLANA WALLET.
              </p>
              
              <div className="ascii-modal-actions">
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-button primary"
                >
                  DOWNLOAD PHANTOM WALLET
                </a>
                
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="ascii-button secondary"
                >
                  CANCEL
                </button>
              </div>
              
              <div className="ascii-modal-note">
                <p className="ascii-modal-note-text">
                  NOTE: AFTER INSTALLING PHANTOM, REFRESH THIS PAGE AND TRY CONNECTING AGAIN.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="ascii-error-tooltip">
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