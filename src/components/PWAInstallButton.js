import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAInstallButton = ({ className = '' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installStatus, setInstallStatus] = useState('idle'); // 'idle', 'installing', 'success', 'error'

  // Show install prompt after user interacts with the app
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    setInstallStatus('installing');
    
    try {
      const success = await install();
      
      if (success) {
        console.log('App installed successfully');
        setInstallStatus('success');
        setShowInstallPrompt(false);
        
        // Hide success message after 2 seconds
        setTimeout(() => {
          setInstallStatus('idle');
        }, 2000);
      } else {
        setInstallStatus('error');
        setTimeout(() => {
          setInstallStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setInstallStatus('error');
      setTimeout(() => {
        setInstallStatus('idle');
      }, 3000);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember user dismissed the prompt
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user previously dismissed the prompt (don't show for 24 hours)
  const wasDismissed = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return (now - dismissedTime) < twentyFourHours;
    }
    return false;
  };

  const getButtonContent = () => {
    switch (installStatus) {
      case 'installing':
        return (
          <>
            <span className="pwa-install-spinner" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              </svg>
            </span>
            <span className="pwa-install-text">Installing...</span>
          </>
        );
      case 'success':
        return (
          <>
            <span className="pwa-install-success" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </span>
            <span className="pwa-install-text">Installed!</span>
          </>
        );
      case 'error':
        return (
          <>
            <span className="pwa-install-error" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
            <span className="pwa-install-text">Try Again</span>
          </>
        );
      default:
        return (
          <>
            <span className="pwa-install-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </span>
            <span className="pwa-install-text hidden sm:inline">Install App</span>
          </>
        );
    }
  };

  // Show full install prompt banner
  if (showInstallPrompt && !wasDismissed()) {
    return (
      <div className={`pwa-install-banner ${className}`} role="banner" aria-live="polite">
        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div className="pwa-banner-text">
            <h3>Install OpenSVM P2P</h3>
            <p>Get faster access and offline features</p>
          </div>
          <div className="pwa-banner-actions">
            <button
              onClick={handleInstall}
              className="pwa-banner-install-btn"
              disabled={installStatus === 'installing'}
              aria-label="Install OpenSVM P2P Exchange app"
            >
              {installStatus === 'installing' ? 'Installing...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="pwa-banner-dismiss-btn"
              aria-label="Dismiss install prompt"
            >
              ×
            </button>
          </div>
        </div>
        
        <style jsx>{`
          .pwa-install-banner {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            border: 1px solid #e5e7eb;
            z-index: 1000;
            animation: slideUp 0.3s ease-out;
          }
          
          .pwa-banner-content {
            display: flex;
            align-items: center;
            padding: 16px;
            gap: 12px;
          }
          
          .pwa-banner-icon {
            color: #3b82f6;
            flex-shrink: 0;
          }
          
          .pwa-banner-text {
            flex: 1;
            min-width: 0;
          }
          
          .pwa-banner-text h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
          }
          
          .pwa-banner-text p {
            margin: 4px 0 0 0;
            font-size: 14px;
            color: #6b7280;
          }
          
          .pwa-banner-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }
          
          .pwa-banner-install-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .pwa-banner-install-btn:hover:not(:disabled) {
            background: #2563eb;
          }
          
          .pwa-banner-install-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          .pwa-banner-dismiss-btn {
            background: none;
            border: none;
            color: #6b7280;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            line-height: 1;
            transition: color 0.2s;
          }
          
          .pwa-banner-dismiss-btn:hover {
            color: #374151;
          }
          
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @media (max-width: 640px) {
            .pwa-install-banner {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }
            
            .pwa-banner-content {
              padding: 12px;
            }
            
            .pwa-banner-text h3 {
              font-size: 15px;
            }
            
            .pwa-banner-text p {
              font-size: 13px;
            }
            
            .pwa-banner-install-btn {
              padding: 6px 12px;
              font-size: 13px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Regular install button
  return (
    <button
      onClick={handleInstall}
      className={`pwa-install-button ${className} ${installStatus !== 'idle' ? 'pulse-attention' : ''}`}
      disabled={installStatus === 'installing'}
      aria-label="Install app for offline use"
      title="Install OpenSVM P2P Exchange for faster access and offline features"
    >
      {getButtonContent()}
      
      <style jsx>{`
        .pwa-install-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pwa-install-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }
        
        .pwa-install-button:active {
          transform: translateY(0);
        }
        
        .pwa-install-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .pwa-install-spinner svg {
          animation: spin 1s linear infinite;
        }
        
        .pwa-install-success {
          color: #10b981;
        }
        
        .pwa-install-error {
          color: #ef4444;
        }
        
        .pulse-attention {
          animation: pulse 2s infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @media (max-width: 640px) {
          .pwa-install-button {
            padding: 6px 10px;
            font-size: 13px;
          }
        }
      `}</style>
    </button>
  );
};

export default PWAInstallButton;