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