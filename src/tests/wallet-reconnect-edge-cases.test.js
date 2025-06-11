/**
 * Comprehensive tests for wallet reconnection edge cases
 * 
 * Tests for:
 * - Timeout recursion cancellation
 * - Multiple concurrent reconnection attempts
 * - Rapid adapter swaps
 * - Error handling and recovery
 * - Proper cleanup on unmount
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { SafeWalletProvider, useSafeWallet } from '../contexts/WalletContextProvider';

// Mock wallet adapter
const createMockWalletAdapter = (overrides = {}) => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  connecting: false,
  publicKey: null,
  wallet: {
    adapter: {
      on: jest.fn(),
      off: jest.fn(),
      ...overrides.wallet?.adapter
    }
  },
  ...overrides
});

// Test component to access wallet context
const TestComponent = ({ onWalletChange }) => {
  const wallet = useSafeWallet();
  
  React.useEffect(() => {
    if (onWalletChange) {
      onWalletChange(wallet);
    }
  }, [wallet, onWalletChange]);
  
  return (
    <div>
      <div data-testid="connection-state">{wallet.connectionState}</div>
      <div data-testid="reconnect-attempts">{wallet.reconnectAttempts || 0}</div>
      <button 
        data-testid="connect-btn" 
        onClick={() => wallet.connect()}
      >
        Connect
      </button>
      <button 
        data-testid="disconnect-btn" 
        onClick={() => wallet.disconnect()}
      >
        Disconnect
      </button>
      <button 
        data-testid="reconnect-btn" 
        onClick={() => wallet.reconnect()}
      >
        Reconnect
      </button>
      <button 
        data-testid="cancel-reconnect-btn" 
        onClick={() => wallet.cancelReconnection()}
      >
        Cancel Reconnection
      </button>
    </div>
  );
};

// Mock useWallet hook
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWalletAdapter
}));

let mockWalletAdapter;

describe('WalletContextProvider Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockWalletAdapter = createMockWalletAdapter();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Timeout Recursion Cancellation', () => {
    test('should cancel pending reconnection attempts on disconnect', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to fail connection attempts
      mockWalletAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      // Start reconnection
      act(() => {
        getByTestId('reconnect-btn').click();
      });

      // Verify reconnection started
      await waitFor(() => {
        expect(walletState.connectionState).toBe('connecting');
      });

      // Disconnect should cancel pending reconnections
      act(() => {
        getByTestId('disconnect-btn').click();
      });

      // Fast-forward through all timers
      act(() => {
        jest.runAllTimers();
      });

      // Verify no additional connection attempts were made after cancellation
      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(1);
    });

    test('should prevent multiple concurrent reconnection attempts', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to fail connection attempts
      mockWalletAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      // Start multiple reconnection attempts rapidly
      act(() => {
        getByTestId('reconnect-btn').click();
        getByTestId('reconnect-btn').click();
        getByTestId('reconnect-btn').click();
      });

      // Fast-forward through all timers
      act(() => {
        jest.runAllTimers();
      });

      // Should only have one active reconnection sequence
      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(1);
    });

    test('should handle cancellation token properly', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to fail first attempt, succeed on second
      mockWalletAdapter.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue();

      // Start reconnection
      act(() => {
        getByTestId('reconnect-btn').click();
      });

      // Cancel before retry
      act(() => {
        getByTestId('cancel-reconnect-btn').click();
      });

      // Fast-forward through all timers
      act(() => {
        jest.runAllTimers();
      });

      // Should not attempt retry after cancellation
      expect(mockWalletAdapter.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rate Limit Handling', () => {
    test('should handle rate limit errors with proper backoff', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to return rate limit error
      const rateLimitError = new Error('Too many requests. Retry after 5000ms');
      mockWalletAdapter.connect.mockRejectedValue(rateLimitError);

      // Start reconnection
      act(() => {
        getByTestId('reconnect-btn').click();
      });

      // Should schedule retry after rate limit delay
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
    });

    test('should extract retry time from error message', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to return specific retry time
      const rateLimitError = new Error('Rate limited. Retry after 3000ms');
      mockWalletAdapter.connect.mockRejectedValue(rateLimitError);

      // Start reconnection
      act(() => {
        getByTestId('reconnect-btn').click();
      });

      // Should use extracted retry time
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
  });

  describe('Adapter Swap Edge Cases', () => {
    test('should handle rapid adapter changes gracefully', async () => {
      let walletState;
      const { rerender } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Start with one adapter
      const adapter1 = createMockWalletAdapter({
        wallet: { adapter: { name: 'adapter1' } }
      });
      mockWalletAdapter = adapter1;

      // Switch to another adapter rapidly
      const adapter2 = createMockWalletAdapter({
        wallet: { adapter: { name: 'adapter2' } }
      });
      
      act(() => {
        mockWalletAdapter = adapter2;
        rerender(
          <SafeWalletProvider>
            <TestComponent onWalletChange={setState => walletState = setState} />
          </SafeWalletProvider>
        );
      });

      // Should handle the swap without errors
      await waitFor(() => {
        expect(walletState.connectionState).toBeDefined();
      });
    });

    test('should cleanup event listeners on adapter change', async () => {
      const adapter1 = createMockWalletAdapter();
      const adapter2 = createMockWalletAdapter();
      
      mockWalletAdapter = adapter1;
      
      const { rerender } = render(
        <SafeWalletProvider>
          <TestComponent />
        </SafeWalletProvider>
      );

      // Switch adapter
      act(() => {
        mockWalletAdapter = adapter2;
        rerender(
          <SafeWalletProvider>
            <TestComponent />
          </SafeWalletProvider>
        );
      });

      // Should have cleaned up listeners from first adapter
      expect(adapter1.wallet.adapter.off).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    test('should recover from repeated connection failures', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to fail multiple times then succeed
      mockWalletAdapter.connect
        .mockRejectedValueOnce(new Error('Connection failed 1'))
        .mockRejectedValueOnce(new Error('Connection failed 2'))
        .mockResolvedValue();

      // Start reconnection
      act(() => {
        getByTestId('reconnect-btn').click();
      });

      // Fast-forward through retries
      act(() => {
        jest.runAllTimers();
      });

      // Should eventually succeed
      await waitFor(() => {
        expect(walletState.connectionState).toBe('connected');
      });
    });

    test('should give up after max attempts', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock to always fail
      mockWalletAdapter.connect.mockRejectedValue(new Error('Always fails'));

      // Start reconnection
      act(() => {
        getByTestId('reconnect-btn').click();
      });

      // Fast-forward through all retries
      act(() => {
        jest.runAllTimers();
      });

      // Should give up after max attempts
      await waitFor(() => {
        expect(walletState.connectionState).toBe('error');
        expect(walletState.error).toContain('Failed to connect after');
      });
    });
  });

  describe('Cleanup and Memory Leaks', () => {
    test('should cleanup timers on unmount', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <SafeWalletProvider>
          <TestComponent />
        </SafeWalletProvider>
      );

      // Setup failing connection to create pending timers
      mockWalletAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      // Start reconnection
      act(() => {
        mockWalletAdapter.connect();
      });

      // Unmount component
      unmount();

      // Should have cleaned up timers
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    test('should remove event listeners on unmount', async () => {
      const { unmount } = render(
        <SafeWalletProvider>
          <TestComponent />
        </SafeWalletProvider>
      );

      // Unmount component
      unmount();

      // Should have removed event listeners
      expect(mockWalletAdapter.wallet.adapter.off).toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle connect and disconnect operations gracefully', async () => {
      let walletState;
      const { getByTestId } = render(
        <SafeWalletProvider>
          <TestComponent onWalletChange={setState => walletState = setState} />
        </SafeWalletProvider>
      );

      // Setup mock for concurrent operations
      mockWalletAdapter.connect.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start connect and immediately disconnect
      act(() => {
        getByTestId('connect-btn').click();
        getByTestId('disconnect-btn').click();
      });

      // Fast-forward
      act(() => {
        jest.runAllTimers();
      });

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(walletState.connectionState).toBe('disconnected');
      });
    });
  });
});