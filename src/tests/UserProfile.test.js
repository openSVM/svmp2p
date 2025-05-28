import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfile from '../components/UserProfile';

// Mock WalletNotConnected component
jest.mock('../components/WalletNotConnected', () => {
  return function MockWalletNotConnected(props) {
    return <div data-testid="wallet-not-connected">{props.message || 'Connect wallet message'}</div>;
  };
});
jest.mock('../components/profile/ProfileHeader', () => {
  return function MockProfileHeader(props) {
    return (
      <div data-testid="profile-header">
        <div>Wallet: {props.walletAddress}</div>
        <div>Network: {props.network.name}</div>
      </div>
    );
  };
});

jest.mock('../components/profile/ReputationCard', () => {
  return function MockReputationCard(props) {
    return <div data-testid="reputation-card">Reputation Card</div>;
  };
});

jest.mock('../components/profile/TransactionHistory', () => {
  return function MockTransactionHistory(props) {
    return <div data-testid="transaction-history">Transaction History</div>;
  };
});

jest.mock('../components/profile/ProfileSettings', () => {
  return function MockProfileSettings(props) {
    return (
      <div data-testid="profile-settings">
        <button onClick={() => props.onSaveSettings({ displayName: 'Test User' })}>
          Save Settings
        </button>
      </div>
    );
  };
});

jest.mock('../components/profile/TradingStats', () => {
  return function MockTradingStats(props) {
    return <div data-testid="trading-stats">Trading Stats</div>;
  };
});

jest.mock('../components/profile/ActivityFeed', () => {
  return function MockActivityFeed(props) {
    return <div data-testid="activity-feed">Activity Feed</div>;
  };
});

describe('UserProfile Component', () => {
  const mockWallet = {
    publicKey: {
      toString: () => '5Yd4tanBLHRC1RQaLZmf1JzZGPNrg5G4GFSDhgFbvVPk'
    }
  };
  
  const mockNetwork = {
    name: 'Devnet'
  };
  
  test('renders connect wallet message when wallet is not connected', () => {
    render(<UserProfile wallet={{}} network={mockNetwork} />);
    expect(screen.getByTestId('wallet-not-connected')).toBeInTheDocument();
  });
  
  test('renders loading state while fetching profile data', () => {
    render(<UserProfile wallet={mockWallet} network={mockNetwork} />);
    expect(screen.getByText(/Loading profile data/i)).toBeInTheDocument();
  });
  
  test('renders profile content after loading', async () => {
    render(<UserProfile wallet={mockWallet} network={mockNetwork} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading profile data/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check if profile header is rendered
    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    
    // Check if tabs are rendered
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check if overview tab content is rendered by default
    expect(screen.getByTestId('reputation-card')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
  });
  
  test('switches between tabs correctly', async () => {
    render(<UserProfile wallet={mockWallet} network={mockNetwork} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading profile data/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Click on Transactions tab
    fireEvent.click(screen.getByText('Transactions'));
    expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
    expect(screen.queryByTestId('reputation-card')).not.toBeInTheDocument();
    
    // Click on Statistics tab
    fireEvent.click(screen.getByText('Statistics'));
    expect(screen.getByTestId('trading-stats')).toBeInTheDocument();
    expect(screen.queryByTestId('transaction-history')).not.toBeInTheDocument();
    
    // Click on Settings tab
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByTestId('profile-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('trading-stats')).not.toBeInTheDocument();
    
    // Click back to Overview tab
    fireEvent.click(screen.getByText('Overview'));
    expect(screen.getByTestId('reputation-card')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-settings')).not.toBeInTheDocument();
  });
  
  test('handles settings update correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<UserProfile wallet={mockWallet} network={mockNetwork} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading profile data/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Navigate to Settings tab
    fireEvent.click(screen.getByText('Settings'));
    
    // Click save settings button in the mock component
    fireEvent.click(screen.getByText('Save Settings'));
    
    // Check if console.log was called with the new settings
    expect(consoleSpy).toHaveBeenCalledWith('Saving settings:', { displayName: 'Test User' });
    
    consoleSpy.mockRestore();
  });
  
  test('handles null publicKey in wallet object gracefully', () => {
    // Create a wallet with null publicKey
    const nullPublicKeyWallet = { publicKey: null };
    
    // This should not throw errors
    render(<UserProfile wallet={nullPublicKeyWallet} network={mockNetwork} />);
    
    // Should show wallet not connected message
    expect(screen.getByTestId('wallet-not-connected')).toBeInTheDocument();
  });
  
  test('handles undefined wallet gracefully', () => {
    // This should not throw errors
    render(<UserProfile wallet={undefined} network={mockNetwork} />);
    
    // Should show wallet not connected message
    expect(screen.getByTestId('wallet-not-connected')).toBeInTheDocument();
  });
});
