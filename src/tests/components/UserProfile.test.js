import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import UserProfile from '../../components/UserProfile';

// Mock components
jest.mock('../../components/profile/ProfileHeader', () => ({
  __esModule: true,
  default: ({ user }) => (
    <div data-testid="profile-header">
      <h2>{user?.username || 'User Profile'}</h2>
      <p>{user?.walletAddress || 'No wallet connected'}</p>
    </div>
  )
}));

jest.mock('../../components/profile/ReputationCard', () => ({
  __esModule: true,
  default: ({ reputation }) => (
    <div data-testid="reputation-card">
      <p>Score: {reputation?.score || 0}</p>
      <p>Trades: {reputation?.trades || 0}</p>
    </div>
  )
}));

jest.mock('../../components/profile/TransactionHistory', () => ({
  __esModule: true,
  default: ({ transactions }) => (
    <div data-testid="transaction-history">
      <p>Transactions: {transactions?.length || 0}</p>
    </div>
  )
}));

// Mock data
const mockUser = {
  username: 'testuser',
  walletAddress: '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3',
  reputation: {
    score: 4.8,
    trades: 25
  },
  transactions: [
    { id: '1', type: 'buy', amount: '100', date: '2025-04-01' },
    { id: '2', type: 'sell', amount: '50', date: '2025-04-05' }
  ]
};

describe('UserProfile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for user data
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ user: mockUser }),
        ok: true,
      })
    );
  });

  test('renders loading state initially', () => {
    renderWithProviders(<UserProfile />);
    
    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
  });

  test('renders user profile after loading', async () => {
    renderWithProviders(<UserProfile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading profile/i)).not.toBeInTheDocument();
    });
    
    // Check if profile components are rendered
    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('reputation-card')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
    
    // Check if user data is displayed
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3')).toBeInTheDocument();
    expect(screen.getByText('Score: 4.8')).toBeInTheDocument();
    expect(screen.getByText('Trades: 25')).toBeInTheDocument();
    expect(screen.getByText('Transactions: 2')).toBeInTheDocument();
  });

  test('handles tab switching', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserProfile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading profile/i)).not.toBeInTheDocument();
    });
    
    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
    
    // Switch to Transactions tab
    await user.click(screen.getByRole('tab', { name: /Transactions/i }));
    
    // Check if Transactions tab content is displayed
    expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
    
    // Switch to Settings tab
    await user.click(screen.getByRole('tab', { name: /Settings/i }));
    
    // Check if Settings tab content is displayed
    expect(screen.getByText(/Profile Settings/i)).toBeInTheDocument();
  });

  test('handles wallet not connected state', async () => {
    // Mock user with no wallet
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ user: null }),
        ok: true,
      })
    );
    
    renderWithProviders(<UserProfile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading profile/i)).not.toBeInTheDocument();
    });
    
    // Check if wallet not connected message is displayed
    expect(screen.getByText(/No wallet connected/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect your wallet to view your profile/i)).toBeInTheDocument();
  });

  test('handles fetch error', async () => {
    // Mock fetch error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.reject(new Error('Failed to fetch user data')),
        ok: false,
      })
    );
    
    renderWithProviders(<UserProfile />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch user data/i)).toBeInTheDocument();
    });
  });
});
