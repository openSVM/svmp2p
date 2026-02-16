/**
 * SwigWalletButton - Modernized wallet connection button
 * 
 * Separated UI from business logic
 * Part of legacy component migration
 */

import React, { memo, useState } from 'react';
import styles from './SwigWalletButton.module.css';

const SwigWalletButton = ({
  connected = false,
  walletAddress = null,
  walletName = null,
  onConnect,
  onDisconnect,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary'
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (connected) {
      setShowDropdown(!showDropdown);
    } else if (!disabled && !loading && onConnect) {
      onConnect();
    }
  };

  const handleDisconnect = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const buttonContent = loading ? (
    <>
      <span className={styles.spinner}></span>
      <span>Connecting...</span>
    </>
  ) : connected ? (
    <>
      <span className={styles.walletIcon}>👛</span>
      <span className={styles.address}>{formatAddress(walletAddress)}</span>
      {walletName && <span className={styles.walletName}>{walletName}</span>}
    </>
  ) : (
    <>
      <span className={styles.connectIcon}>🔗</span>
      <span>Connect Wallet</span>
    </>
  );

  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${styles[variant]} ${connected ? styles.connected : ''} ${disabled ? styles.disabled : ''}`}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-expanded={showDropdown}
        aria-haspopup={connected ? 'true' : 'false'}
      >
        {buttonContent}
      </button>

      {connected && showDropdown && (
        <div className={styles.dropdown} role="menu">
          <button
            className={styles.dropdownItem}
            onClick={handleDisconnect}
            role="menuitem"
          >
            <span>🔓</span>
            <span>Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(SwigWalletButton);
