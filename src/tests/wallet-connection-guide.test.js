/**
 * Test for enhanced wallet connection flow
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletConnectionGuide from '../components/WalletConnectionGuide';
import { detectSolanaWallets } from '../utils/walletDetection';

// Mock the wallet detection utility
jest.mock('../utils/walletDetection', () => ({
  detectSolanaWallets: jest.fn(),
  checkWalletSupport: jest.fn(),
  getConnectionTroubleshootingSteps: jest.fn()
}));

// Mock the safe wallet context
const mockWallet = {
  connected: false,
  connecting: false,
  error: null,
  publicKey: null,
  reconnect: jest.fn()
};

jest.mock('../contexts/WalletContextProvider', () => ({
  useSafeWallet: () => mockWallet
}));

// Mock Solana wallet adapter components
jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <button data-testid="wallet-multi-button">Connect Wallet</button>
}));

describe('WalletConnectionGuide', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    detectSolanaWallets.mockReturnValue({
      detected: [],
      available: [
        {
          name: 'Phantom',
          type: 'solana',
          installed: false,
          icon: '👻',
          downloadUrl: 'https://phantom.app/',
          description: 'Popular Solana wallet with excellent mobile support'
        }
      ],
      recommended: [{
        name: 'Phantom',
        type: 'solana',
        installed: false,
        icon: '👻',
        downloadUrl: 'https://phantom.app/',
        description: 'Popular Solana wallet with excellent mobile support',
        reason: 'Most popular Solana wallet for beginners'
      }],
      hasAnyWallet: false,
      needsInstallation: true
    });

    require('../utils/walletDetection').checkWalletSupport.mockReturnValue({
      supported: true,
      reason: 'Desktop browser with extension support',
      recommendations: ['Install wallet extension from official store']
    });

    require('../utils/walletDetection').getConnectionTroubleshootingSteps.mockReturnValue([
      {
        title: 'Install a Solana Wallet',
        description: 'You need a Solana-compatible wallet to connect',
        action: 'install',
        priority: 'high'
      }
    ]);
  });

  test('renders wallet connection guide with installation step', async () => {
    render(<WalletConnectionGuide onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
      expect(screen.getByText('Install a Solana Wallet')).toBeInTheDocument();
      expect(screen.getByText('Recommended Wallets:')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });
  });

  test('shows detected wallets when available', async () => {
    // Mock scenario with detected wallets
    detectSolanaWallets.mockReturnValue({
      detected: [{
        name: 'Phantom',
        type: 'solana',
        installed: true,
        icon: '👻',
        downloadUrl: 'https://phantom.app/',
        description: 'Popular Solana wallet with excellent mobile support'
      }],
      available: [],
      recommended: [{
        name: 'Phantom',
        type: 'solana',
        installed: true,
        icon: '👻',
        downloadUrl: 'https://phantom.app/',
        description: 'Popular Solana wallet with excellent mobile support',
        reason: 'Already installed on your device'
      }],
      hasAnyWallet: true,
      needsInstallation: false
    });

    render(<WalletConnectionGuide onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Connect Your Wallet')).toHaveLength(2); // Header and step title
      expect(screen.getByText('Detected Wallets:')).toBeInTheDocument();
    });
  });

  test('handles wallet connection error with troubleshooting', async () => {
    // Mock wallet with error
    mockWallet.error = 'Failed to connect to wallet';
    
    render(<WalletConnectionGuide onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Connection Error:/)).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to wallet')).toBeInTheDocument();
    });

    // Click show troubleshooting
    const troubleshootingButton = screen.getByText('Show Troubleshooting Steps');
    fireEvent.click(troubleshootingButton);

    await waitFor(() => {
      expect(screen.getByText('Troubleshooting Steps:')).toBeInTheDocument();
    });
  });

  test('shows success step when wallet connects', async () => {
    // Mock successful connection
    mockWallet.connected = true;
    mockWallet.error = null;
    mockWallet.publicKey = {
      toString: () => 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOp'
    };

    render(<WalletConnectionGuide onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Connection Successful!')).toHaveLength(2); // Both h3 and h4
      expect(screen.getByText('Your wallet is now connected and ready to use.')).toBeInTheDocument();
      expect(screen.getByText('Start Using the App')).toBeInTheDocument();
    });
  });

  test('calls onConnectionSuccess when wallet connects', async () => {
    const onConnectionSuccess = jest.fn();
    
    // Initially not connected
    mockWallet.connected = false;
    
    const { rerender } = render(
      <WalletConnectionGuide onClose={() => {}} onConnectionSuccess={onConnectionSuccess} />
    );
    
    // Simulate wallet connection
    mockWallet.connected = true;
    mockWallet.publicKey = {
      toString: () => 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOp'
    };
    
    rerender(<WalletConnectionGuide onClose={() => {}} onConnectionSuccess={onConnectionSuccess} />);
    
    await waitFor(() => {
      expect(onConnectionSuccess).toHaveBeenCalled();
    });
  });

  test('closes guide when close button is clicked', async () => {
    const onClose = jest.fn();
    
    render(<WalletConnectionGuide onClose={onClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close wallet guide');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('Enhanced ConnectWalletPrompt', () => {
  test('shows guided setup button in modal mode', async () => {
    const ConnectWalletPrompt = require('../components/ConnectWalletPrompt').default;
    
    render(<ConnectWalletPrompt showAsModal={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('🎯 Need Help? Use Guided Setup')).toBeInTheDocument();
      expect(screen.getByText('Start Guided Wallet Setup')).toBeInTheDocument();
    });
  });
});

describe('Enhanced WalletNotConnected', () => {
  test('shows guided setup button', async () => {
    const WalletNotConnected = require('../components/WalletNotConnected').default;
    
    render(<WalletNotConnected />);
    
    await waitFor(() => {
      expect(screen.getByText('🎯 Need Help? Use Guided Setup')).toBeInTheDocument();
      expect(screen.getByText('Start Step-by-Step Guide')).toBeInTheDocument();
    });
  });
});