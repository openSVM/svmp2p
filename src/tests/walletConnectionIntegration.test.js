/**
 * Wallet Connection Integration Tests
 * 
 * Integration tests covering complete wallet connection flows with validation:
 * - Wallet connection with validation
 * - Error handling scenarios
 * - Network switching validation
 * - Cross-component wallet state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { SafeWalletProvider } from '../contexts/WalletContextProvider';

// Mock wallet adapter for testing
const mockWalletAdapter = {
  name: 'Mock Wallet',
  url: 'https://mock-wallet.com',
  icon: 'mock-icon',
  readyState: 'Installed',
  publicKey: null,
  connecting: false,
  connected: false,
  
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendTransaction: jest.fn(),
  signTransaction: jest.fn(),
  signMessage: jest.fn(),
  
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

// Mock validation utilities
jest.mock('../utils/walletValidation', () => ({
  validateWalletConnection: jest.fn(),
  getErrorMessage: jest.fn(),
  WalletValidationError: class WalletValidationError extends Error {
    constructor(type, message) {
      super(message);
      this.type = type;
      this.name = 'WalletValidationError';
    }
  },
  VALIDATION_ERRORS: {
    INVALID_PUBLIC_KEY: 'INVALID_PUBLIC_KEY',
    INVALID_NETWORK: 'INVALID_NETWORK'
  }
}));

// Test component that uses wallet
const TestWalletComponent = () => {
  const [wallet, setWallet] = React.useState(null);
  const [connectionState, setConnectionState] = React.useState('disconnected');
  const [error, setError] = React.useState(null);

  const handleConnect = async () => {
    try {
      setConnectionState('connecting');
      await mockWalletAdapter.connect();
      setWallet(mockWalletAdapter);
      setConnectionState('connected');
      setError(null);
    } catch (err) {
      setConnectionState('error');
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await mockWalletAdapter.disconnect();
      setWallet(null);
      setConnectionState('disconnected');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div data-testid="connection-state">{connectionState}</div>
      <div data-testid="wallet-status">
        {wallet ? `Connected: ${wallet.name}` : 'Not Connected'}
      </div>
      {error && <div data-testid="error-message">{error}</div>}
      
      <button 
        data-testid="connect-button" 
        onClick={handleConnect}
        disabled={connectionState === 'connecting'}
      >
        {connectionState === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      <button 
        data-testid="disconnect-button" 
        onClick={handleDisconnect}
        disabled={!wallet}
      >
        Disconnect
      </button>
    </div>
  );
};

// Test wrapper with providers
const TestWrapper = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [mockWalletAdapter];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <SafeWalletProvider>
          {children}
        </SafeWalletProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

describe('Wallet Connection Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletAdapter.connected = false;
    mockWalletAdapter.connecting = false;
    mockWalletAdapter.publicKey = null;
    
    // Mock successful validation by default
    const { validateWalletConnection } = require('../utils/walletValidation');
    validateWalletConnection.mockReturnValue({ valid: true, errors: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Connection Flow', () => {
    test('should connect wallet with validation', async () => {
      // Mock successful connection
      mockWalletAdapter.connect.mockResolvedValue();
      mockWalletAdapter.publicKey = { toString: () => '11111111111111111111111111111112' };
      
      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      expect(connectButton).toBeInTheDocument();
      expect(screen.getByTestId('connection-state')).toHaveTextContent('disconnected');

      fireEvent.click(connectButton);

      // Should show connecting state
      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connecting');
      });

      // Should complete connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
        expect(screen.getByTestId('wallet-status')).toHaveTextContent('Connected: Mock Wallet');
      });

      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(1);
    });

    test('should handle disconnect properly', async () => {
      // Start with connected state
      mockWalletAdapter.connected = true;
      mockWalletAdapter.publicKey = { toString: () => '11111111111111111111111111111112' };
      mockWalletAdapter.disconnect.mockResolvedValue();

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      // Simulate connected state
      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
      });

      // Test disconnect
      const disconnectButton = screen.getByTestId('disconnect-button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('wallet-status')).toHaveTextContent('Not Connected');
      });

      expect(mockWalletAdapter.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle connection rejection', async () => {
      const rejectionError = new Error('User rejected the request');
      mockWalletAdapter.connect.mockRejectedValue(rejectionError);

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('error');
        expect(screen.getByTestId('error-message')).toHaveTextContent('User rejected the request');
      });

      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(1);
    });

    test('should handle validation errors', async () => {
      const { validateWalletConnection, WalletValidationError, VALIDATION_ERRORS } = require('../utils/walletValidation');
      
      // Mock validation failure
      validateWalletConnection.mockReturnValue({
        valid: false,
        errors: [new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY, 'Invalid wallet address')]
      });

      mockWalletAdapter.connect.mockResolvedValue();
      mockWalletAdapter.publicKey = { toString: () => 'invalid-key' };

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('error');
      });
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockWalletAdapter.connect.mockRejectedValue(networkError);

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('error');
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });
    });

    test('should handle disconnect errors', async () => {
      // Start connected
      mockWalletAdapter.connected = true;
      mockWalletAdapter.publicKey = { toString: () => '11111111111111111111111111111112' };
      
      const disconnectError = new Error('Disconnect failed');
      mockWalletAdapter.disconnect.mockRejectedValue(disconnectError);

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      // Connect first
      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
      });

      // Try to disconnect
      const disconnectButton = screen.getByTestId('disconnect-button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Disconnect failed');
      });
    });
  });

  describe('Connection State Management', () => {
    test('should prevent multiple simultaneous connections', async () => {
      // Mock slow connection
      mockWalletAdapter.connect.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      // Click connect button multiple times
      fireEvent.click(connectButton);
      fireEvent.click(connectButton);
      fireEvent.click(connectButton);

      // Should only call connect once
      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(1);
      
      // Button should be disabled during connection
      expect(connectButton).toBeDisabled();
    });

    test('should handle connection timeout', async () => {
      // Mock connection that never resolves
      mockWalletAdapter.connect.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      // Should show connecting state
      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connecting');
      });

      // Button should be disabled
      expect(connectButton).toBeDisabled();
    });
  });

  describe('Wallet State Persistence', () => {
    test('should maintain wallet state across component updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      // Connect wallet
      mockWalletAdapter.connect.mockResolvedValue();
      mockWalletAdapter.publicKey = { toString: () => '11111111111111111111111111111112' };

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
      });

      // Rerender component
      rerender(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      // State should persist
      expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
      expect(screen.getByTestId('wallet-status')).toHaveTextContent('Connected: Mock Wallet');
    });
  });

  describe('Error Recovery', () => {
    test('should allow retry after connection error', async () => {
      // First attempt fails
      mockWalletAdapter.connect.mockRejectedValueOnce(new Error('Connection failed'));
      // Second attempt succeeds
      mockWalletAdapter.connect.mockResolvedValueOnce();
      mockWalletAdapter.publicKey = { toString: () => '11111111111111111111111111111112' };

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      // First attempt
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('error');
        expect(screen.getByTestId('error-message')).toHaveTextContent('Connection failed');
      });

      // Retry
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });

      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(2);
    });

    test('should clear error state on successful connection', async () => {
      // Start with error state
      mockWalletAdapter.connect.mockRejectedValueOnce(new Error('Initial error'));

      render(
        <TestWrapper>
          <TestWalletComponent />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Initial error');
      });

      // Successful connection
      mockWalletAdapter.connect.mockResolvedValueOnce();
      mockWalletAdapter.publicKey = { toString: () => '11111111111111111111111111111112' };

      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });
});