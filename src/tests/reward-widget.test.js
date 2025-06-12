import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RewardWidget from '@/components/RewardWidget';
import { useWallet } from '@solana/wallet-adapter-react';

// Mock the wallet adapter
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

const mockUseWallet = useWallet;

describe('RewardWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows connect wallet message when not connected', () => {
    mockUseWallet.mockReturnValue({
      connected: false,
    });

    render(<RewardWidget />);
    
    expect(screen.getByText('🎁')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('Connect wallet')).toBeInTheDocument();
  });

  test('displays reward balance when connected', () => {
    mockUseWallet.mockReturnValue({
      connected: true,
    });

    render(<RewardWidget />);
    
    expect(screen.getByText('💎')).toBeInTheDocument();
    expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    expect(screen.getByText('450 tokens')).toBeInTheDocument();
    expect(screen.getByText('75% to next reward')).toBeInTheDocument();
  });

  test('compact mode displays correctly', () => {
    mockUseWallet.mockReturnValue({
      connected: true,
    });

    render(<RewardWidget compact={true} />);
    
    expect(screen.getByText('💎')).toBeInTheDocument();
    expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    expect(screen.getByText('450 tokens')).toBeInTheDocument();
    // Progress bar should not be shown in compact mode
    expect(screen.queryByText('75% to next reward')).not.toBeInTheDocument();
  });

  test('compact mode when not connected', () => {
    mockUseWallet.mockReturnValue({
      connected: false,
    });

    render(<RewardWidget compact={true} />);
    
    expect(screen.getByText('🎁')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('Connect wallet')).toBeInTheDocument();
  });
});