import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import LanguageSelector from './LanguageSelector';

const OnboardingModal = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

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
            <WalletMultiButton />
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