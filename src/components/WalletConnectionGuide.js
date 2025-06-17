import React, { useState, useEffect } from 'react';
import { useSwigWallet } from '../contexts/SwigWalletProvider';
import { SwigWalletButton } from './SwigWalletButton';
import { detectSwigWallet, checkWalletSupport, getConnectionTroubleshootingSteps } from '../utils/walletDetection';

/**
 * Multi-step Swig wallet connection guide component
 * Provides user-friendly guidance through the OAuth authentication process
 */
const WalletConnectionGuide = ({ 
  onClose = () => {},
  onConnectionSuccess = () => {},
  showAsModal = true,
  className = ''
}) => {
  const wallet = useSwigWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [walletDetection, setWalletDetection] = useState(null);
  const [browserSupport, setBrowserSupport] = useState(null);
  const [troubleshootingSteps, setTroubleshootingSteps] = useState([]);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Detect Swig wallet and browser support on component mount
  useEffect(() => {
    const checkWalletStatus = async () => {
      const detection = await detectSwigWallet();
      const support = checkWalletSupport();
      
      setWalletDetection(detection);
      setBrowserSupport(support);
      
      // Set initial step based on detection results
      if (detection.isAuthenticated) {
        setCurrentStep(3); // Skip to success step if already authenticated
      } else {
        setCurrentStep(1); // Start with authentication step
      }
    };

    checkWalletStatus();
  }, []);

  // Update troubleshooting steps when wallet state changes
  useEffect(() => {
    if (walletDetection) {
      const steps = getConnectionTroubleshootingSteps({
        isAuthenticated: walletDetection.isAuthenticated,
        connected: wallet.connected,
        error: wallet.error
      });
      setTroubleshootingSteps(steps);
    }
  }, [walletDetection, wallet.connected, wallet.error]);

  // Handle successful connection
  useEffect(() => {
    if (wallet.connected) {
      setCurrentStep(3); // Success step
      onConnectionSuccess();
    }
  }, [wallet.connected, onConnectionSuccess]);

  // Step content configuration
  const steps = [
    {
      title: 'Sign in to your Wallet',
      description: 'Authenticate with your preferred OAuth provider to access your Swig wallet.',
      component: <AuthenticateStep walletDetection={walletDetection} browserSupport={browserSupport} />
    },
    {
      title: 'Connect Your Wallet',
      description: 'Complete the authentication process to link your wallet to the application.',
      component: <ConnectWalletStep wallet={wallet} walletDetection={walletDetection} />
    },
    {
      title: 'Connection Successful!',
      description: 'Your Swig wallet is now connected. You can now use all features of the application.',
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

// Step 1: Authenticate with OAuth Component
const AuthenticateStep = ({ walletDetection, browserSupport }) => {
  if (!walletDetection) return <div>Loading...</div>;

  return (
    <div className="authenticate-step">
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
        <h4>Swig Wallet Authentication:</h4>
        <div className="wallet-options">
          {walletDetection.recommended.map((wallet, index) => (
            <div key={index} className={`wallet-option ${wallet.authenticated ? 'authenticated' : 'not-authenticated'}`}>
              <div className="wallet-info">
                <span className="wallet-icon">{wallet.icon}</span>
                <div className="wallet-details">
                  <h5>{wallet.name}</h5>
                  <p>{wallet.description}</p>
                  <small className="recommendation-reason">{wallet.reason}</small>
                  {wallet.authMethods && (
                    <div className="auth-methods">
                      <small>Available: {wallet.authMethods.join(', ')}</small>
                    </div>
                  )}
                </div>
              </div>
              
              {wallet.authenticated ? (
                <div className="wallet-status authenticated">
                  ✅ Authenticated
                </div>
              ) : (
                <div className="wallet-status not-authenticated">
                  🔑 Sign in required
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {walletDetection.isAuthenticated && (
        <div className="ready-to-connect">
          <p className="success-message">✅ Great! You're authenticated and ready to connect.</p>
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
          <h4>Available Wallets:</h4>
          <div className="wallet-list">
            {walletDetection.detected.map((detectedWallet, index) => (
              <div key={index} className="detected-wallet">
                <span className="wallet-icon">{detectedWallet.icon}</span>
                <span className="wallet-name">{detectedWallet.name}</span>
                <span className="wallet-type">({detectedWallet.walletType})</span>
                <span className="wallet-status">✅ Ready</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-wallets-detected">
          <p>Please authenticate first to access your Swig wallet.</p>
        </div>
      )}

      <div className="connection-action">
        <p>Click the button below to connect your Swig wallet:</p>
        <div className="wallet-button-wrapper">
          <SwigWalletButton />
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

// Step 3: Success Component
const SuccessStep = ({ wallet, onClose }) => {
  return (
    <div className="success-step">
      <div className="success-content">
        <div className="success-icon">🎉</div>
        <h4>Connection Successful!</h4>
        <p>Your Swig wallet is now connected and ready to use.</p>
        
        {wallet.walletAddress && (
          <div className="wallet-info">
            <p><strong>Connected Wallet:</strong></p>
            <code className="wallet-address">
              {wallet.walletAddress.slice(0, 8)}...{wallet.walletAddress.slice(-8)}
            </code>
            {wallet.walletType && (
              <p className="wallet-type">Type: {wallet.walletType}</p>
            )}
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