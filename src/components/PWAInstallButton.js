import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAInstallButton = ({ className = '' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      console.log('App installed successfully');
    }
  };

  return (
    <button
      onClick={handleInstall}
      className={`pwa-install-button ${className} pulse-attention`}
      aria-label="Install app for offline use"
      title="Install OpenSVM P2P Exchange for faster access and offline features"
    >
      <span className="pwa-install-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </span>
      <span className="pwa-install-text hidden sm:inline">Install App</span>
    </button>
  );
};

export default PWAInstallButton;