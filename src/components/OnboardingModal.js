import React, { useState, useEffect } from 'react';
import { SwigWalletButton } from './SwigWalletButton';
import { useSwigWallet } from '../contexts/SwigWalletProvider';
import LanguageSelector from './LanguageSelector';
import { createUserRewardsAccount, hasUserRewardsAccount } from '../utils/rewardTransactions';
import { REWARD_CONSTANTS, UI_CONFIG } from '../constants/rewardConstants';

const OnboardingModal = ({ isOpen, onComplete, onSkip }) => {
  const { publicKey, connected, wallet } = useSwigWallet();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [rewardAccountSetup, setRewardAccountSetup] = useState({
    status: 'checking', // 'checking', 'needed', 'creating', 'exists', 'created', 'error'
    error: null
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Load saved language preference if available
      const savedLanguage = localStorage.getItem('preferred-language');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    }
  }, [isOpen]);

  // Check reward account status when wallet connects
  useEffect(() => {
    const checkRewardAccount = async () => {
      if (connected && publicKey && currentStep >= 2) { // After wallet connection step
        setRewardAccountSetup({ status: 'checking', error: null });
        
        try {
          const accountExists = await hasUserRewardsAccount(null, publicKey); // connection would be passed in real implementation
          
          if (accountExists) {
            setRewardAccountSetup({ status: 'exists', error: null });
          } else {
            setRewardAccountSetup({ status: 'needed', error: null });
          }
        } catch (error) {
          console.error('Error checking reward account:', error);
          setRewardAccountSetup({ status: 'error', error: error.message });
        }
      }
    };

    checkRewardAccount();
  }, [connected, publicKey, currentStep]);

  // Create reward account function
  const handleCreateRewardAccount = async () => {
    if (!connected || !wallet || !publicKey) {
      setRewardAccountSetup({ 
        status: 'error', 
        error: 'Please connect your wallet first' 
      });
      return;
    }

    setRewardAccountSetup({ status: 'creating', error: null });

    try {
      await createUserRewardsAccount(wallet, null, publicKey); // connection would be passed in real implementation
      setRewardAccountSetup({ status: 'created', error: null });
      
      // Auto-advance to next step after successful creation
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
    } catch (error) {
      console.error('Error creating reward account:', error);
      setRewardAccountSetup({ 
        status: 'error', 
        error: `Failed to create rewards account: ${error.message}` 
      });
    }
  };

  const handleLanguageChange = (locale) => {
    setSelectedLanguage(locale);
    localStorage.setItem('preferred-language', locale);
  };

  const steps = [
    {
      title: "Select Your Language",
      subtitle: "Choose your preferred language for the best experience",
      content: (
        <div className="onboarding-language">
          <div className="language-icon">LANG</div>
          <p className="language-description">
            Select your preferred language to customize your experience on OpenSVM P2P Exchange. 
            This setting will be remembered for future visits.
          </p>
          <div className="language-selection-container">
            <LanguageSelector
              currentLocale={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <div className="language-features">
            <div className="language-feature">
              <span className="checkmark">✓</span>
              <span>Interface translated to your language</span>
            </div>
            <div className="language-feature">
              <span className="checkmark">✓</span>
              <span>Localized currency and date formats</span>
            </div>
            <div className="language-feature">
              <span className="checkmark">✓</span>
              <span>Automatically saved preference</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Welcome to OpenSVM P2P Exchange",
      subtitle: "Your gateway to decentralized trading across Solana Virtual Machine networks",
      content: (
        <div className="onboarding-welcome">
          <div className="welcome-icon">SVM</div>
          <p className="welcome-description">
            Experience peer-to-peer trading like never before. Trade directly with other users 
            across multiple Solana Virtual Machine networks with complete security and transparency.
          </p>
          <div className="features-grid responsive-grid grid-cols-1 md:grid-cols-3">
            <div className="feature-item">
              <div className="feature-icon">SEC</div>
              <h4>Secure Trading</h4>
              <p>Smart contract escrow protection</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">NET</div>
              <h4>Multi-Chain</h4>
              <p>Trade across 5+ SVM networks</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">FEE</div>
              <h4>Low Fees</h4>
              <p>Minimal trading costs</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">SPD</div>
              <h4>Fast Transactions</h4>
              <p>Quick settlement times</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your Wallet",
      subtitle: "Connect your Solana-compatible wallet to start trading securely",
      content: (
        <div className="onboarding-wallet">
          <div className="wallet-icon">WALLET</div>
          <p className="wallet-description">
            To start trading, you'll need to connect a Solana-compatible wallet. 
            We support popular wallets like Phantom, Solflare, and more.
          </p>
          <div className="wallet-features">
            <div className="wallet-feature">
              <span className="checkmark">✓</span>
              <span>Secure connection through wallet adapter</span>
            </div>
            <div className="wallet-feature">
              <span className="checkmark">✓</span>
              <span>No email or password required</span>
            </div>
            <div className="wallet-feature">
              <span className="checkmark">✓</span>
              <span>Full control of your funds</span>
            </div>
          </div>
          <div className="wallet-connect-section">
            <SwigWalletButton />
          </div>
        </div>
      )
    },
    {
      title: "Setup Loyalty Rewards",
      subtitle: "Activate your rewards account to earn tokens for trading and governance",
      content: (
        <div className="onboarding-rewards">
          <div className="rewards-icon">💎</div>
          <p className="rewards-description">
            Set up your loyalty rewards account to earn tokens for every trade you complete and 
            every governance vote you cast. Start earning rewards immediately!
          </p>
          
          <div className="rewards-benefits">
            <div className="reward-benefit">
              <span className="checkmark">✓</span>
              <span>Earn {REWARD_CONSTANTS.REWARD_RATES.PER_TRADE} tokens per successful trade</span>
            </div>
            <div className="reward-benefit">
              <span className="checkmark">✓</span>
              <span>Earn {REWARD_CONSTANTS.REWARD_RATES.PER_VOTE} tokens per governance vote</span>
            </div>
            <div className="reward-benefit">
              <span className="checkmark">✓</span>
              <span>Future utility: discounts, voting power, staking rewards</span>
            </div>
            <div className="reward-benefit">
              <span className="checkmark">✓</span>
              <span>Optional auto-claim feature for convenience</span>
            </div>
          </div>

          <div className="rewards-setup-section">
            {rewardAccountSetup.status === 'checking' && (
              <div className="setup-status checking">
                <div className="spinner"></div>
                <span>Checking your rewards account...</span>
              </div>
            )}
            
            {rewardAccountSetup.status === 'exists' && (
              <div className="setup-status exists">
                <span className="status-icon">✅</span>
                <span>Rewards account already set up! You're ready to earn tokens.</span>
              </div>
            )}
            
            {rewardAccountSetup.status === 'needed' && (
              <div className="setup-status needed">
                <button 
                  className="setup-rewards-button"
                  onClick={handleCreateRewardAccount}
                  disabled={!connected}
                >
                  {connected ? 'Create Rewards Account' : 'Connect Wallet First'}
                </button>
                <p className="setup-note">
                  This will create your personal rewards account on the blockchain. 
                  No cost to you - the platform covers the setup fees.
                </p>
              </div>
            )}
            
            {rewardAccountSetup.status === 'creating' && (
              <div className="setup-status creating">
                <div className="spinner"></div>
                <span>Creating your rewards account...</span>
              </div>
            )}
            
            {rewardAccountSetup.status === 'created' && (
              <div className="setup-status created">
                <span className="status-icon">🎉</span>
                <span>Rewards account created successfully! You can now earn tokens.</span>
              </div>
            )}
            
            {rewardAccountSetup.status === 'error' && (
              <div className="setup-status error">
                <span className="status-icon">❌</span>
                <div>
                  <p>Setup failed: {rewardAccountSetup.error}</p>
                  <button 
                    className="retry-button"
                    onClick={handleCreateRewardAccount}
                    disabled={!connected}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="rewards-skip-note">
            <small>
              You can skip this step and set up rewards later from the Rewards tab.
            </small>
          </div>
        </div>
      )
    },
    {
      title: "Browse & Trade",
      subtitle: "Explore offers and start trading with confidence",
      content: (
        <div className="onboarding-trading">
          <div className="trading-icon">TRADE</div>
          <p className="trading-description">
            Browse existing offers or create your own. Our platform makes it easy to find 
            the best deals and trade with trusted community members.
          </p>
          <div className="trading-steps">
            <div className="trading-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Browse Offers</h4>
                <p>Find buy/sell offers that match your needs</p>
              </div>
            </div>
            <div className="trading-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Initiate Trade</h4>
                <p>Start a secure escrow transaction</p>
              </div>
            </div>
            <div className="trading-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Complete Trade</h4>
                <p>Confirm transaction and receive funds</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`onboarding-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`onboarding-modal ${isVisible ? 'visible' : ''}`}>
        {/* Header */}
        <div className="onboarding-header">
          <button 
            className="onboarding-close"
            onClick={handleSkip}
            aria-label="Close onboarding"
          >
            ×
          </button>
        </div>

        {/* Progress */}
        <div className="onboarding-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <h1 className="onboarding-title">{steps[currentStep].title}</h1>
          <p className="onboarding-subtitle">{steps[currentStep].subtitle}</p>
          <div className="onboarding-body">
            {steps[currentStep].content}
          </div>
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <div className="actions-left">
            {currentStep > 0 && (
              <button 
                className="btn-secondary"
                onClick={prevStep}
              >
                Back
              </button>
            )}
          </div>
          <div className="actions-right">
            <button 
              className="btn-text"
              onClick={handleSkip}
            >
              Skip
            </button>
            <button 
              className="btn-primary"
              onClick={nextStep}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;

{/* Add styles for rewards onboarding */}
<style jsx>{`
  .onboarding-rewards {
    text-align: center;
    padding: 20px;
  }

  .rewards-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .rewards-description {
    font-size: 16px;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .rewards-benefits {
    display: grid;
    gap: 16px;
    margin-bottom: 32px;
    text-align: left;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .reward-benefit {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  .reward-benefit .checkmark {
    color: #059669;
    font-weight: bold;
  }

  .rewards-setup-section {
    margin-bottom: 20px;
  }

  .setup-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .setup-status.checking {
    background: rgba(243, 244, 246, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(107, 114, 128, 0.2);
    color: var(--color-foreground-muted);
  }

  .setup-status.exists {
    background: rgba(220, 252, 231, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(22, 101, 52, 0.2);
    color: var(--color-success);
  }

  .setup-status.needed {
    flex-direction: column;
    gap: 16px;
  }

  .setup-status.creating {
    background: rgba(219, 234, 254, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(30, 64, 175, 0.2);
    color: var(--color-info);
  }

  .setup-status.created {
    background: rgba(254, 243, 199, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(146, 64, 14, 0.2);
    color: var(--color-warning);
  }

  .setup-status.error {
    background: rgba(254, 226, 226, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(220, 38, 38, 0.2);
    color: var(--color-error);
    flex-direction: column;
    gap: 12px;
  }

  .setup-rewards-button {
    /* Use glass effect instead of gradient */
    background: rgba(124, 58, 237, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(124, 58, 237, 0.3);
    color: var(--color-foreground);
    border-radius: 0;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .setup-rewards-button:hover:not(:disabled) {
    transform: translateY(-1px);
    background: rgba(124, 58, 237, 0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
  }

  .setup-rewards-button:disabled {
    background: rgba(229, 231, 235, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(156, 163, 175, 0.2);
    color: var(--color-foreground-muted);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .retry-button {
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .retry-button:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
  }

  .retry-button:disabled {
    background-color: var(--color-foreground-muted);
    cursor: not-allowed;
  }

  .setup-note {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
    max-width: 300px;
  }

  .rewards-skip-note {
    margin-top: 20px;
    color: #9ca3af;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f4f6;
    border-top: 2px solid #7c3aed;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .status-icon {
    font-size: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}</style>