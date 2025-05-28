import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * Component to show when wallet is not connected
 */
const WalletNotConnected = ({ message }) => {
  return (
    <div className="wallet-not-connected">
      <div className="wallet-not-connected-content">
        <div className="wallet-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
            <circle cx="16" cy="12" r="1.5" />
          </svg>
        </div>
        <h3>Wallet Not Connected</h3>
        <p>{message || 'Connect your wallet to access your profile and make transactions.'}</p>
        <div className="wallet-connect-button-wrapper">
          <WalletMultiButton />
        </div>
        <div className="wallet-help">
          <p>New to cryptocurrency wallets?</p>
          <a 
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="wallet-help-link"
          >
            Get a Phantom Wallet
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletNotConnected;