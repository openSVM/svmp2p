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
      className={`pwa-install-button ${className}`}
      aria-label="Install app"
      title="Install OpenSVM P2P Exchange as an app"
    >
      <span className="pwa-install-icon">📱</span>
      <span className="pwa-install-text">Install App</span>
    </button>
  );
};

export default PWAInstallButton;