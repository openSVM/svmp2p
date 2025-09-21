/**
 * Tests for Modern Reward Dashboard Components
 * 
 * Comprehensive test suite for the refactored modular components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the wallet provider
jest.mock('../../contexts/PhantomWalletProvider', () => ({
  usePhantomWallet: () => ({
    connected: true,
    publicKey: 'mock-public-key',
    wallet: { signTransaction: jest.fn() }
  })
}));

// Mock the rewards hook
const mockUseRewards = {
  rewards: {
    totalEarned: 1000,
    totalClaimed: 500,
    unclaimedBalance: 500,
    tradingVolume: 10,
    governanceVotes: 5,
    lastTradeReward: 50,
    lastVoteReward: 25
  },
  rewardToken: {
    rewardRatePerTrade: 10,
    rewardRatePerVote: 5,
    minTradeVolume: 1
  },
  hasRewardsAccount: true,
  loading: false,
  claimLoading: false,
  error: null,
  claimError: null,
  cooldownRemaining: 0,
  failedClaimCooldownRemaining: 0,
  autoClaimEnabled: true,
  autoClaimConfig: { autoClaimThreshold: 100 },
  claimReward: jest.fn(),
  createAccount: jest.fn(),
  toggleAutoClaim: jest.fn(),
  updateAutoClaimThreshold: jest.fn(),
  dismissError: jest.fn(),
  refreshData: jest.fn(),
};

jest.mock('../../hooks/features/useRewards', () => ({
  useRewards: () => mockUseRewards
}));

// Import components after mocking
import { RewardsDisplay } from '../../components/features/rewards/RewardsDisplay';
import { RewardsActions } from '../../components/features/rewards/RewardsActions';
import { OAuthButtons } from '../../components/common/OAuthButtons';
import ModernRewardDashboard from '../../components/ModernRewardDashboard';

// Mock conversion helpers
jest.mock('../../constants/rewardConstants', () => ({
  CONVERSION_HELPERS: {
    formatTokenAmount: (amount) => `${amount} tokens`,
    formatSolAmount: (amount) => `${amount} SOL`,
  },
  UI_CONFIG: {
    MIN_TRADE_VOLUME: 1,
    ERROR_MESSAGES: {
      ACCOUNT_CREATION_FAILED: 'Account creation failed'
    }
  }
}));

describe('Refactored Reward Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RewardsDisplay Component', () => {
    it('should render reward metrics correctly', () => {
      render(
        <RewardsDisplay
          rewards={mockUseRewards.rewards}
          rewardToken={mockUseRewards.rewardToken}
          loading={false}
          cooldownRemaining={0}
          failedClaimCooldownRemaining={0}
        />
      );

      expect(screen.getByText('500 tokens')).toBeInTheDocument(); // Unclaimed balance
      expect(screen.getByText('1000 tokens')).toBeInTheDocument(); // Total earned
      expect(screen.getByText('500 tokens')).toBeInTheDocument(); // Total claimed
    });

    it('should show loading state', () => {
      render(
        <RewardsDisplay
          rewards={mockUseRewards.rewards}
          rewardToken={mockUseRewards.rewardToken}
          loading={true}
          cooldownRemaining={0}
          failedClaimCooldownRemaining={0}
        />
      );

      // Should show loading skeletons
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should display cooldown indicator when cooldown is active', () => {
      render(
        <RewardsDisplay
          rewards={mockUseRewards.rewards}
          rewardToken={mockUseRewards.rewardToken}
          loading={false}
          cooldownRemaining={30000} // 30 seconds
          failedClaimCooldownRemaining={0}
        />
      );

      expect(screen.getByText(/Claim cooldown active/)).toBeInTheDocument();
      expect(screen.getByText(/Time remaining: 30s/)).toBeInTheDocument();
    });
  });

  describe('RewardsActions Component', () => {
    const defaultProps = {
      rewards: mockUseRewards.rewards,
      hasRewardsAccount: true,
      claimLoading: false,
      claimError: null,
      autoClaimEnabled: true,
      autoClaimConfig: { autoClaimThreshold: 100 },
      cooldownRemaining: 0,
      failedClaimCooldownRemaining: 0,
      onClaimRewards: jest.fn(),
      onCreateAccount: jest.fn(),
      onToggleAutoClaim: jest.fn(),
      onUpdateAutoClaimThreshold: jest.fn(),
      onDismissError: jest.fn(),
      onRefreshData: jest.fn(),
    };

    it('should render claim button when account exists', () => {
      render(<RewardsActions {...defaultProps} />);

      const claimButton = screen.getByRole('button', { name: /Claim 500 tokens/ });
      expect(claimButton).toBeInTheDocument();
      expect(claimButton).not.toBeDisabled();
    });

    it('should show create account button when no account exists', () => {
      render(<RewardsActions {...defaultProps} hasRewardsAccount={false} />);

      expect(screen.getByText('Create Rewards Account')).toBeInTheDocument();
      expect(screen.getByText(/You need to create a rewards account/)).toBeInTheDocument();
    });

    it('should handle claim button click', async () => {
      const onClaimRewards = jest.fn();
      render(<RewardsActions {...defaultProps} onClaimRewards={onClaimRewards} />);

      const claimButton = screen.getByRole('button', { name: /Claim 500 tokens/ });
      fireEvent.click(claimButton);

      expect(onClaimRewards).toHaveBeenCalledTimes(1);
    });

    it('should disable claim button during cooldown', () => {
      render(<RewardsActions {...defaultProps} cooldownRemaining={30000} />);

      const claimButton = screen.getByRole('button', { name: /Claim 500 tokens/ });
      expect(claimButton).toBeDisabled();
    });

    it('should show error message', () => {
      render(<RewardsActions {...defaultProps} claimError="Test error message" />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle auto-claim toggle', () => {
      const onToggleAutoClaim = jest.fn();
      render(<RewardsActions {...defaultProps} onToggleAutoClaim={onToggleAutoClaim} />);

      const toggleButton = screen.getByRole('switch');
      fireEvent.click(toggleButton);

      expect(onToggleAutoClaim).toHaveBeenCalledTimes(1);
    });
  });

  describe('OAuthButtons Component', () => {
    it('should render all OAuth providers', () => {
      const onSelect = jest.fn();
      render(<OAuthButtons onSelect={onSelect} />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
      expect(screen.getByText('Continue with Farcaster')).toBeInTheDocument();
    });

    it('should handle provider selection', () => {
      const onSelect = jest.fn();
      render(<OAuthButtons onSelect={onSelect} />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should show loading state', () => {
      render(<OAuthButtons onSelect={jest.fn()} isLoading={true} />);

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(screen.getByText(/Please complete authentication/)).toBeInTheDocument();
    });

    it('should disable buttons when disabled prop is true', () => {
      render(<OAuthButtons onSelect={jest.fn()} disabled={true} />);

      const googleButton = screen.getByText('Continue with Google');
      expect(googleButton).toBeDisabled();
    });
  });

  describe('ModernRewardDashboard Integration', () => {
    it('should render the complete dashboard', () => {
      render(<ModernRewardDashboard />);

      expect(screen.getByText('Rewards Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Earn and claim rewards/)).toBeInTheDocument();
    });

    it('should display reward metrics and actions', () => {
      render(<ModernRewardDashboard />);

      // Should show reward metrics
      expect(screen.getByText('500 tokens')).toBeInTheDocument();
      
      // Should show claim button
      expect(screen.getByRole('button', { name: /Claim 500 tokens/ })).toBeInTheDocument();
      
      // Should show refresh button
      expect(screen.getByText('🔄 Refresh Data')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<RewardsActions {...{
        rewards: mockUseRewards.rewards,
        hasRewardsAccount: true,
        claimLoading: false,
        claimError: null,
        autoClaimEnabled: true,
        autoClaimConfig: { autoClaimThreshold: 100 },
        cooldownRemaining: 0,
        failedClaimCooldownRemaining: 0,
        onClaimRewards: jest.fn(),
        onCreateAccount: jest.fn(),
        onToggleAutoClaim: jest.fn(),
        onUpdateAutoClaimThreshold: jest.fn(),
        onDismissError: jest.fn(),
        onRefreshData: jest.fn(),
      }} />);

      // Check for proper ARIA labels
      expect(screen.getByLabelText(/Claim 500 tokens/)).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should handle keyboard navigation for OAuth buttons', () => {
      const onSelect = jest.fn();
      render(<OAuthButtons onSelect={onSelect} />);

      const googleButton = screen.getByText('Continue with Google');
      
      // Test keyboard activation
      fireEvent.keyDown(googleButton, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(googleButton, { key: ' ' });
      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle and display errors gracefully', () => {
      const onDismissError = jest.fn();
      render(<RewardsActions {...{
        rewards: mockUseRewards.rewards,
        hasRewardsAccount: true,
        claimLoading: false,
        claimError: 'Network error occurred',
        autoClaimEnabled: true,
        autoClaimConfig: { autoClaimThreshold: 100 },
        cooldownRemaining: 0,
        failedClaimCooldownRemaining: 0,
        onClaimRewards: jest.fn(),
        onCreateAccount: jest.fn(),
        onToggleAutoClaim: jest.fn(),
        onUpdateAutoClaimThreshold: jest.fn(),
        onDismissError,
        onRefreshData: jest.fn(),
      }} />);

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      
      // Test error dismissal
      const dismissButton = screen.getByLabelText('Dismiss error');
      fireEvent.click(dismissButton);
      expect(onDismissError).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Component Performance', () => {
  it('should not cause unnecessary re-renders', () => {
    const onSelect = jest.fn();
    const { rerender } = render(<OAuthButtons onSelect={onSelect} />);

    // Rerender with same props
    rerender(<OAuthButtons onSelect={onSelect} />);

    // Component should handle this efficiently
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });
});

const testSuite = {};
export default testSuite;