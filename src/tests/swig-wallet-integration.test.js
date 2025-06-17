/**
 * Test for Swig Wallet Integration
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the Swig wallet modules to avoid BigInt issues
jest.mock('../client/para', () => ({
  para: {
    isFullyLoggedIn: jest.fn(() => Promise.resolve(false)),
    getWallets: jest.fn(() => Promise.resolve({})),
    logout: jest.fn(() => Promise.resolve()),
    getFarcasterConnectURL: jest.fn(() => Promise.resolve('')),
    waitForFarcasterStatus: jest.fn(() => Promise.resolve({ userExists: false, username: '' })),
    initiateUserLogin: jest.fn(() => Promise.resolve('')),
    getSetUpBiometricsURL: jest.fn(() => Promise.resolve('')),
    waitForLoginAndSetup: jest.fn(() => Promise.resolve({})),
    waitForPasskeyAndCreateWallet: jest.fn(() => Promise.resolve({})),
    getOAuthURL: jest.fn(() => Promise.resolve('')),
    waitForOAuth: jest.fn(() => Promise.resolve({ email: '', userExists: false })),
    createWallet: jest.fn(() => Promise.resolve({})),
    findWalletByAddress: jest.fn(() => Promise.resolve(null)),
    signMessage: jest.fn(() => Promise.resolve({ signature: '' }))
  }
}));

// Mock @getpara/web-sdk to avoid import issues
jest.mock('@getpara/web-sdk', () => ({
  Environment: {
    BETA: 'beta'
  },
  ParaWeb: jest.fn(),
  OAuthMethod: {
    GOOGLE: 'google',
    APPLE: 'apple',
    FARCASTER: 'farcaster'
  }
}));

// Mock @swig-wallet/classic to avoid BigInt issues
jest.mock('@swig-wallet/classic', () => ({
  fetchSwig: jest.fn(),
  Role: jest.fn(),
  Actions: {
    set: jest.fn(() => ({
      solLimit: jest.fn(),
      get: jest.fn(() => ({}))
    }))
  },
  Ed25519Authority: {
    fromPublicKey: jest.fn()
  },
  Secp256k1Authority: {
    fromPublicKeyBytes: jest.fn()
  },
  addAuthorityInstruction: jest.fn()
}));

// Test components
import { SwigWalletProvider } from '../contexts/SwigWalletProvider';
import { SwigWalletButton } from '../components/SwigWalletButton';
import { OAuthButtons } from '../components/OAuthButtons';

describe('Swig Wallet Integration', () => {
  test('SwigWalletProvider renders without errors', () => {
    render(
      <SwigWalletProvider>
        <div>Test content</div>
      </SwigWalletProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('SwigWalletButton renders connect button when not connected', () => {
    render(
      <SwigWalletProvider>
        <SwigWalletButton />
      </SwigWalletProvider>
    );
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  test('OAuthButtons renders authentication options', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <OAuthButtons onSelect={mockOnSelect} />
    );
    
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    expect(screen.getByText('Continue with Farcaster')).toBeInTheDocument();
  });

  test('OAuthButtons shows loading state', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <OAuthButtons onSelect={mockOnSelect} isLoading={true} />
    );
    
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });
});

describe('Swig Wallet Detection', () => {
  test('detectSwigWallet returns proper structure', async () => {
    const { detectSwigWallet } = require('../utils/walletDetection');
    
    const result = await detectSwigWallet();
    
    expect(result).toHaveProperty('detected');
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('recommended');
    expect(result).toHaveProperty('hasAnyWallet');
    expect(result).toHaveProperty('needsAuthentication');
    expect(result).toHaveProperty('isAuthenticated');
    
    // Should have Swig wallet in available options
    expect(result.available).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Swig Wallet',
          type: 'swig'
        })
      ])
    );
  });
});

describe('Legacy Compatibility', () => {
  test('WalletContextProvider exports work for backward compatibility', () => {
    const { SafeWalletProvider, useSafeWallet } = require('../contexts/WalletContextProvider');
    
    expect(SafeWalletProvider).toBeDefined();
    expect(useSafeWallet).toBeDefined();
    expect(typeof useSafeWallet).toBe('function');
  });
});

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles popup blocker scenarios', async () => {
    const { para } = require('../client/para');
    
    // Mock window.open to return null (popup blocked)
    const originalOpen = window.open;
    window.open = jest.fn().mockReturnValue(null);
    
    para.getOAuthURL.mockResolvedValue('http://oauth.url');
    
    const { fireEvent } = require('@testing-library/react');
    
    render(
      <SwigWalletProvider>
        <SwigWalletButton />
      </SwigWalletProvider>
    );
    
    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);
    
    // Restore original window.open
    window.open = originalOpen;
  });

  test('handles authentication failure gracefully', async () => {
    const { para } = require('../client/para');
    
    // Mock authentication failure
    para.isFullyLoggedIn.mockRejectedValue(new Error('Authentication failed'));
    
    render(
      <SwigWalletProvider>
        <div>Test content</div>
      </SwigWalletProvider>
    );
    
    // Should still render without crashing
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('handles network connection failures', async () => {
    const { para } = require('../client/para');
    
    // Mock network failure
    para.getWallets.mockRejectedValue(new Error('Network error'));
    para.isFullyLoggedIn.mockResolvedValue(true);
    
    render(
      <SwigWalletProvider>
        <SwigWalletButton />
      </SwigWalletProvider>
    );
    
    // Should show disconnect button initially, then handle error
    await screen.findByText('Connect Wallet');
  });

  test('handles invalid wallet type selection', async () => {
    const { para } = require('../client/para');
    
    para.isFullyLoggedIn.mockResolvedValue(true);
    para.getWallets.mockResolvedValue({
      'invalid-wallet': { type: 'INVALID', address: 'test-address' }
    });
    
    // Mock localStorage
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn().mockReturnValue('SOLANA');
    
    render(
      <SwigWalletProvider>
        <SwigWalletButton />
      </SwigWalletProvider>
    );
    
    // Should handle gracefully
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    
    // Restore localStorage
    localStorage.getItem = originalGetItem;
  });
});

describe('Reconnection Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reconnection attempts with exponential backoff', async () => {
    const { para } = require('../client/para');
    const { fireEvent } = require('@testing-library/react');
    
    // Mock initial connection failure
    para.isFullyLoggedIn
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockResolvedValueOnce(true);
    
    para.getWallets.mockResolvedValue({
      'test-wallet': { type: 'SOLANA', address: 'test-address' }
    });
    
    const TestComponent = () => {
      const { reconnect, isReconnecting, reconnectionProgress } = require('../contexts/SwigWalletProvider').useSwigWallet();
      
      return (
        <div>
          <button onClick={reconnect}>Reconnect</button>
          {isReconnecting && <div>Reconnecting...</div>}
          <div>Attempt: {reconnectionProgress.attempt}</div>
        </div>
      );
    };
    
    render(
      <SwigWalletProvider>
        <TestComponent />
      </SwigWalletProvider>
    );
    
    const reconnectButton = screen.getByText('Reconnect');
    fireEvent.click(reconnectButton);
    
    // Should show reconnecting state
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    
    // Fast forward time for backoff
    jest.advanceTimersByTime(5000);
    
    expect(screen.getByText('Attempt: 1')).toBeInTheDocument();
  });

  test('reconnection cancellation works properly', async () => {
    const { para } = require('../client/para');
    const { fireEvent } = require('@testing-library/react');
    
    para.isFullyLoggedIn.mockRejectedValue(new Error('Connection failed'));
    
    const TestComponent = () => {
      const { reconnect, cancelReconnection, isReconnecting } = require('../contexts/SwigWalletProvider').useSwigWallet();
      
      return (
        <div>
          <button onClick={reconnect}>Reconnect</button>
          <button onClick={cancelReconnection}>Cancel</button>
          {isReconnecting && <div>Reconnecting...</div>}
        </div>
      );
    };
    
    render(
      <SwigWalletProvider>
        <TestComponent />
      </SwigWalletProvider>
    );
    
    const reconnectButton = screen.getByText('Reconnect');
    fireEvent.click(reconnectButton);
    
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Should stop reconnecting
    expect(screen.queryByText('Reconnecting...')).not.toBeInTheDocument();
  });
});

describe('Accessibility Features', () => {
  test('ReconnectionModal has proper ARIA attributes', () => {
    const { ReconnectionModal } = require('../components/ReconnectionModal');
    
    render(
      <ReconnectionModal
        isVisible={true}
        progress={{ attempt: 1, maxAttempts: 3, nextRetryIn: 5, canCancel: true }}
        onCancel={jest.fn()}
      />
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'reconnection-title');
    expect(modal).toHaveAttribute('aria-describedby', 'reconnection-description');
    
    const title = screen.getByText('Connection Lost');
    expect(title).toHaveAttribute('id', 'reconnection-title');
    
    const description = screen.getByText(/Attempting to reconnect in/);
    expect(description.parentElement).toHaveAttribute('id', 'reconnection-description');
  });

  test('Buttons have proper focus management', () => {
    const { SwigWalletButton } = require('../components/SwigWalletButton');
    
    render(
      <SwigWalletProvider>
        <SwigWalletButton />
      </SwigWalletProvider>
    );
    
    const button = screen.getByText('Connect Wallet');
    expect(button).toHaveAttribute('type', 'button');
    
    // Should be focusable
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
