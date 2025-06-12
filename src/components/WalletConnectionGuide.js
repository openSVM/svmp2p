import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSafeWallet } from '../contexts/WalletContextProvider';
import { detectSolanaWallets, checkWalletSupport, getConnectionTroubleshootingSteps } from '../utils/walletDetection';

/**
 * Multi-step wallet connection guide component
 * Provides user-friendly guidance through the wallet connection process
 */
const WalletConnectionGuide = ({ 
  onClose = () => {},
  onConnectionSuccess = () => {},
  showAsModal = true,
  className = ''
}) => {
  const wallet = useSafeWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [walletDetection, setWalletDetection] = useState(null);
  const [browserSupport, setBrowserSupport] = useState(null);
  const [troubleshootingSteps, setTroubleshootingSteps] = useState([]);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Detect wallets and browser support on component mount
  useEffect(() => {
    const detection = detectSolanaWallets();
    const support = checkWalletSupport();
    
    setWalletDetection(detection);
    setBrowserSupport(support);
    
    // Set initial step based on detection results
    if (detection.hasAnyWallet) {
      setCurrentStep(2); // Skip to connection step if wallets are available
    } else {
      setCurrentStep(1); // Start with installation step
    }
  }, []);

  // Update troubleshooting steps when wallet state changes
  useEffect(() => {
    if (walletDetection) {
      const steps = getConnectionTroubleshootingSteps({
        hasAnyWallet: walletDetection.hasAnyWallet,
        connected: wallet.connected,
        error: wallet.error
      });
      setTroubleshootingSteps(steps);
    }
  }, [walletDetection, wallet.connected, wallet.error]);

  // Handle successful connection
  useEffect(() => {
    if (wallet.connected) {
      setCurrentStep(4); // Success step
      onConnectionSuccess();
    }
  }, [wallet.connected, onConnectionSuccess]);

  // Step content configuration
  const steps = [
    {
      title: 'Install a Solana Wallet',
      description: 'First, you need a Solana-compatible wallet to connect to the application.',
      component: <InstallWalletStep walletDetection={walletDetection} browserSupport={browserSupport} />
    },
    {
      title: 'Connect Your Wallet',
      description: 'Click the connect button below to link your wallet to the application.',
      component: <ConnectWalletStep wallet={wallet} walletDetection={walletDetection} />
    },
    {
      title: 'Approve Connection',
      description: 'Your wallet will ask for permission. Click "Approve" to complete the connection.',
      component: <ApproveConnectionStep wallet={wallet} />
    },
    {
      title: 'Connection Successful!',
      description: 'Your wallet is now connected. You can now use all features of the application.',
      component: <SuccessStep wallet={wallet} onClose={onClose} />
    }
  ];

  const currentStepData = steps[currentStep - 1];

  if (!walletDetection || !browserSupport) {
    return <div className="wallet-guide-loading">Loading wallet guide...</div>;
  }

  const guideContent = (
    <div className={`wallet-connection-guide ${className}`}>
      <div className="guide-header">
        <h2>Connect Your Wallet</h2>
        <button 
          className="guide-close-button"
          onClick={onClose}
          aria-label="Close wallet guide"
        >
          ×
        </button>
      </div>

      {/* Progress indicator */}
      <div className="guide-progress">
        {steps.map((_, index) => (
          <div 
            key={index}
            className={`progress-step ${index + 1 <= currentStep ? 'completed' : ''} ${index + 1 === currentStep ? 'current' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <div className="guide-content">
        <div className="step-header">
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.description}</p>
        </div>
        
        <div className="step-body">
          {currentStepData.component}
        </div>
      </div>

      {/* Error handling and troubleshooting */}
      {wallet.error && (
        <div className="guide-error">
          <div className="error-message">
            <strong>Connection Error:</strong> {wallet.error}
          </div>
          <button 
            className="show-troubleshooting-button"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          >
            {showTroubleshooting ? 'Hide' : 'Show'} Troubleshooting Steps
          </button>
          
          {showTroubleshooting && (
            <div className="troubleshooting-steps">
              <h4>Troubleshooting Steps:</h4>
              <ol>
                {troubleshootingSteps.map((step, index) => (
                  <li key={index} className={`priority-${step.priority}`}>
                    <strong>{step.title}</strong>: {step.description}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="guide-actions">
        {currentStep > 1 && currentStep < 4 && (
          <button 
            className="guide-button secondary"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Previous Step
          </button>
        )}
        
        {currentStep < 3 && walletDetection.hasAnyWallet && (
          <button 
            className="guide-button primary"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next Step
          </button>
        )}

        {wallet.error && (
          <button 
            className="guide-button retry"
            onClick={() => wallet.reconnect()}
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="wallet-guide-modal-overlay" onClick={onClose}>
        <div className="wallet-guide-modal" onClick={(e) => e.stopPropagation()}>
          {guideContent}
        </div>
      </div>
    );
  }

  return guideContent;
};

// Step 1: Install Wallet Component
const InstallWalletStep = ({ walletDetection, browserSupport }) => {
  if (!walletDetection) return <div>Loading...</div>;

  return (
    <div className="install-wallet-step">
      {!browserSupport.supported && (
        <div className="browser-warning">
          <h4>⚠️ Browser Compatibility Issue</h4>
          <p>{browserSupport.reason}</p>
          <ul>
            {browserSupport.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="wallet-recommendations">
        <h4>Recommended Wallets:</h4>
        <div className="wallet-options">
          {walletDetection.recommended.map((wallet, index) => (
            <div key={index} className={`wallet-option ${wallet.installed ? 'installed' : 'not-installed'}`}>
              <div className="wallet-info">
                <span className="wallet-icon">{wallet.icon}</span>
                <div className="wallet-details">
                  <h5>{wallet.name}</h5>
                  <p>{wallet.description}</p>
                  <small className="recommendation-reason">{wallet.reason}</small>
                </div>
              </div>
              
              {wallet.installed ? (
                <div className="wallet-status installed">
                  ✅ Installed
                </div>
              ) : (
                <a 
                  href={wallet.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="install-wallet-button"
                >
                  Install {wallet.name}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {walletDetection.hasAnyWallet && (
        <div className="ready-to-connect">
          <p className="success-message">✅ Great! You have wallets installed and ready to connect.</p>
        </div>
      )}
    </div>
  );
};

// Step 2: Connect Wallet Component
const ConnectWalletStep = ({ wallet, walletDetection }) => {
  return (
    <div className="connect-wallet-step">
      {walletDetection.detected.length > 0 ? (
        <div className="detected-wallets">
          <h4>Detected Wallets:</h4>
          <div className="wallet-list">
            {walletDetection.detected.map((detectedWallet, index) => (
              <div key={index} className="detected-wallet">
                <span className="wallet-icon">{detectedWallet.icon}</span>
                <span className="wallet-name">{detectedWallet.name}</span>
                <span className="wallet-status">✅ Ready</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-wallets-detected">
          <p>No wallets detected. Please install a Solana wallet first.</p>
        </div>
      )}

      <div className="connection-action">
        <p>Click the button below to connect your wallet:</p>
        <div className="wallet-button-wrapper">
          <WalletMultiButton />
        </div>
        
        {wallet.connecting && (
          <div className="connection-status">
            <div className="loading-spinner"></div>
            <span>Connecting to wallet...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Step 3: Approve Connection Component
const ApproveConnectionStep = ({ wallet }) => {
  return (
    <div className="approve-connection-step">
      <div className="approval-instructions">
        <div className="instruction-icon">🔐</div>
        <h4>Approve the Connection</h4>
        <p>Your wallet should now show a popup asking for permission to connect.</p>
        
        <div className="approval-steps">
          <ol>
            <li>Look for the wallet popup or notification</li>
            <li>Review the connection request details</li>
            <li>Click "Approve" or "Connect" to grant permission</li>
          </ol>
        </div>
      </div>

      {wallet.connecting && (
        <div className="waiting-approval">
          <div className="loading-spinner"></div>
          <p>Waiting for wallet approval...</p>
        </div>
      )}

      <div className="help-text">
        <p><strong>Don't see a popup?</strong> Check if your wallet extension is unlocked and try clicking the connect button again.</p>
      </div>
    </div>
  );
};

// Step 4: Success Component
const SuccessStep = ({ wallet, onClose }) => {
  return (
    <div className="success-step">
      <div className="success-content">
        <div className="success-icon">🎉</div>
        <h4>Connection Successful!</h4>
        <p>Your wallet is now connected and ready to use.</p>
        
        {wallet.publicKey && (
          <div className="wallet-info">
            <p><strong>Connected Wallet:</strong></p>
            <code className="wallet-address">
              {wallet.publicKey.toString().slice(0, 8)}...{wallet.publicKey.toString().slice(-8)}
            </code>
          </div>
        )}
      </div>

      <div className="success-actions">
        <button className="guide-button primary" onClick={onClose}>
          Start Using the App
        </button>
      </div>
    </div>
  );
};

export default WalletConnectionGuide;