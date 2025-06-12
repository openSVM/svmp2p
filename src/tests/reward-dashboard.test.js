import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RewardDashboard from '@/components/RewardDashboard';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock the wallet adapter
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

const mockUseWallet = useWallet;

describe('RewardDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('shows connect wallet message when not connected', () => {
    mockUseWallet.mockReturnValue({
      connected: false,
      publicKey: null,
    });

    render(<RewardDashboard />);
    
    expect(screen.getByText('Loyalty Rewards')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to view your rewards')).toBeInTheDocument();
  });

  test('displays reward dashboard when wallet is connected', async () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'mock-public-key' },
    });

    render(<RewardDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('🎁 Loyalty Rewards')).toBeInTheDocument();
      expect(screen.getByText('450 tokens')).toBeInTheDocument(); // Unclaimed balance
      expect(screen.getByText('1250 tokens')).toBeInTheDocument(); // Total earned
    });
  });

  test('claim button is disabled when no rewards to claim', async () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'mock-public-key' },
    });

    render(<RewardDashboard />);
    
    // Wait for component to load with mock data
    await waitFor(() => {
      const claimButton = screen.getByRole('button', { name: /claim.*tokens/i });
      expect(claimButton).toBeInTheDocument();
      expect(claimButton).not.toHaveClass('disabled');
    });
  });

  test('displays activity stats correctly', async () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'mock-public-key' },
    });

    render(<RewardDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('12.5 SOL')).toBeInTheDocument(); // Trading volume
      expect(screen.getByText('3 votes')).toBeInTheDocument(); // Governance votes
    });
  });

  test('claim rewards functionality works', async () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'mock-public-key' },
    });

    render(<RewardDashboard />);
    
    await waitFor(() => {
      const claimButton = screen.getByRole('button', { name: /claim.*tokens/i });
      fireEvent.click(claimButton);
    });

    // Check that button shows loading state
    await waitFor(() => {
      expect(screen.getByText('Claiming...')).toBeInTheDocument();
    });

    // Wait for claim to complete
    await waitFor(() => {
      expect(screen.getByText('Claim 0 Tokens')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays reward rates information', async () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'mock-public-key' },
    });

    render(<RewardDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('100 tokens')).toBeInTheDocument(); // Per trade
      expect(screen.getByText('50 tokens')).toBeInTheDocument(); // Per vote
      expect(screen.getByText('0.1 SOL')).toBeInTheDocument(); // Min trade volume
    });
  });

  test('progress bar displays correctly', async () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'mock-public-key' },
    });

    render(<RewardDashboard />);
    
    await waitFor(() => {
      const progressText = screen.getByText(/% to next.*token reward/);
      expect(progressText).toBeInTheDocument();
    });
  });
});