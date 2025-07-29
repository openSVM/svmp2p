import React from 'react';
import { render, screen } from '@testing-library/react';
import OnboardingModal from '../components/OnboardingModal';

// Mock the SwigWalletProvider
jest.mock('../contexts/SwigWalletProvider', () => ({
  useSwigWallet: () => ({
    publicKey: null,
    connected: false,
    wallet: null
  })
}));

// Mock the SwigWalletButton
jest.mock('../components/SwigWalletButton', () => ({
  SwigWalletButton: () => <button>Connect Wallet</button>
}));

// Mock the LanguageSelector
jest.mock('../components/LanguageSelector', () => ({
  __esModule: true,
  default: ({ currentLocale, onLanguageChange }) => (
    <select 
      value={currentLocale} 
      onChange={(e) => onLanguageChange(e.target.value)}
      data-testid="language-selector"
    >
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  )
}));

// Mock reward transactions
jest.mock('../utils/rewardTransactions', () => ({
  createUserRewardsAccount: jest.fn(),
  hasUserRewardsAccount: jest.fn()
}));

// Mock constants
jest.mock('../constants/rewardConstants', () => ({
  REWARD_CONSTANTS: {
    REWARD_RATES: {
      PER_TRADE: 10,
      PER_VOTE: 5
    }
  },
  UI_CONFIG: {}
}));

describe('OnboardingModal Dark Theme', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    // Add dark class to document body for testing
    document.body.className = 'dark';
  });

  afterEach(() => {
    document.body.className = '';
    jest.clearAllMocks();
  });

  test('renders language selection step with proper dark theme text contrast', () => {
    render(
      <OnboardingModal 
        isOpen={true} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    // Check that the title is visible
    const title = screen.getByText('Select Your Language');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('onboarding-title');

    // Check that the subtitle is visible
    const subtitle = screen.getByText('Choose your preferred language for the best experience');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveClass('onboarding-subtitle');

    // Check that the description is visible
    const description = screen.getByText(/Select your preferred language to customize your experience/);
    expect(description).toBeInTheDocument();

    // Check that checkmarks and features are visible
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(3);

    const features = [
      'Interface translated to your language',
      'Localized currency and date formats',
      'Automatically saved preference'
    ];

    features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });

    // Check that language selector is present
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
  });

  test('dark theme classes are applied correctly', () => {
    const { container } = render(
      <OnboardingModal 
        isOpen={true} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    // Check that the modal has the correct structure for dark theme
    const modal = container.querySelector('.onboarding-modal');
    expect(modal).toBeInTheDocument();

    const overlay = container.querySelector('.onboarding-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('visible');
  });
});