import React, { useState } from 'react';
import { PhantomWalletButton } from './PhantomWalletButton';
import WalletConnectionGuide from './WalletConnectionGuide';

/**
 * Component to show when wallet is not connected
 * Enhanced with multi-step guidance and better error handling
 */
const WalletNotConnected = ({ message }) => {
  const [buttonError, setButtonError] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleShowGuide = () => {
    setShowGuide(true);
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
  };

  const handleConnectionSuccess = () => {
    // Guide will close automatically after success
    setTimeout(() => {
      setShowGuide(false);
    }, 2000);
  };

  // Fallback button when WalletMultiButton can't be used
  const FallbackButton = () => (
    <button 
      className="wallet-connect-fallback-button"
      onClick={() => {
        // Redirect to app home to ensure proper wallet context initialization
        window.location.href = '/';
      }}
    >
      Connect Wallet
    </button>
  );

  // Safely render Swig wallet button with error handling
  const WalletButtonSafe = () => {
    if (buttonError) {
      return <FallbackButton />;
    }

    try {
      return <PhantomWalletButton className="prominent-wallet-button" />;
    } catch (error) {
      console.error('Error rendering PhantomWalletButton:', error);
      setButtonError(true);
      return <FallbackButton />;
    }
  };

  return (
    <>
      <div className="wallet-not-connected">
        <div className="wallet-not-connected-content">
          <div className="wallet-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
              <circle cx="16" cy="12" r="1.5" />
            </svg>
          </div>
          <h3>Connect Your Wallet</h3>
          <p>{message || 'To access your profile and make transactions, connect your wallet now.'}</p>
          <div className="wallet-connect-button-wrapper">
            <WalletButtonSafe />
            <button 
              className="guided-setup-button"
              onClick={handleShowGuide}
            >
              🎯 Need Help? Use Guided Setup
            </button>
          </div>
          <div className="wallet-help">
            <p>New to cryptocurrency wallets or having trouble connecting?</p>
            <button 
              className="wallet-help-link"
              onClick={handleShowGuide}
            >
              Start Step-by-Step Guide
            </button>
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
};

export default WalletNotConnected;