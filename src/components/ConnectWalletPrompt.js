import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Tooltip } from './common';
import WalletConnectionGuide from './WalletConnectionGuide';

/**
 * Component to show wallet connection prompt for actions requiring wallet
 * Enhanced with multi-step guidance and wallet detection
 */
const ConnectWalletPrompt = ({ 
  action = 'perform this action',
  message,
  showAsModal = false,
  onClose = () => {},
  className = ''
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const defaultMessage = `Connect your wallet to ${action}`;
  const displayMessage = message || defaultMessage;

  const handleShowGuide = () => {
    setShowGuide(true);
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
    onClose();
  };

  const handleConnectionSuccess = () => {
    // Guide will close automatically after success
    setTimeout(() => {
      setShowGuide(false);
      onClose();
    }, 2000);
  };

  if (showAsModal) {
    return (
      <>
        <div className="connect-wallet-modal-overlay" onClick={onClose}>
          <div className="connect-wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="connect-wallet-modal-header">
              <h3>Wallet Connection Required</h3>
              <button 
                className="modal-close-button"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="connect-wallet-modal-content">
              <div className="wallet-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                  <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
                  <circle cx="16" cy="12" r="1.5" />
                </svg>
              </div>
              <p>{displayMessage}</p>
              <div className="wallet-connect-actions">
                <WalletMultiButton />
                <button 
                  className="guided-connection-button"
                  onClick={handleShowGuide}
                >
                  🎯 Need Help? Use Guided Setup
                </button>
              </div>
              <div className="wallet-help">
                <p>New to crypto wallets or having trouble?</p>
                <button 
                  className="wallet-help-link"
                  onClick={handleShowGuide}
                >
                  Start Guided Wallet Setup
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {showGuide && (
          <WalletConnectionGuide
            onClose={handleCloseGuide}
            onConnectionSuccess={handleConnectionSuccess}
            showAsModal={true}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={`connect-wallet-prompt ${className}`}>
        <Tooltip 
          content={displayMessage}
          position="top"
        >
          <div className="connect-wallet-cta" onClick={handleShowGuide}>
            <div className="cta-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
                <circle cx="16" cy="12" r="1.5" />
              </svg>
            </div>
            <span className="cta-text">Connect Wallet</span>
          </div>
        </Tooltip>
      </div>

      {showGuide && (
        <WalletConnectionGuide
          onClose={handleCloseGuide}
          onConnectionSuccess={handleConnectionSuccess}
          showAsModal={true}
        />
      )}
    </>
  );
};

export default ConnectWalletPrompt;