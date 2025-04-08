import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileHeader from '../components/profile/ProfileHeader';

describe('ProfileHeader Component', () => {
  const defaultProps = {
    walletAddress: '5Yd4tanBLHRC1RQaLZmf1JzZGPNrg5G4GFSDhgFbvVPk',
    network: {
      name: 'Devnet'
    },
    avatarUrl: '',
    username: '',
    joinDate: 'Apr 2025',
    isVerified: false
  };

  test('renders with minimal props', () => {
    render(<ProfileHeader {...defaultProps} />);
    
    // Check if wallet address is displayed (truncated)
    expect(screen.getByText(/5Yd4ta...vVPk/i)).toBeInTheDocument();
    
    // Check if network is displayed
    expect(screen.getByText(/Devnet/i)).toBeInTheDocument();
    
    // Check if default username is displayed when not provided
    expect(screen.getByText(/Anonymous User/i)).toBeInTheDocument();
    
    // Check if join date is displayed
    expect(screen.getByText(/Apr 2025/i)).toBeInTheDocument();
  });

  test('renders with avatar when avatarUrl is provided', () => {
    const props = {
      ...defaultProps,
      avatarUrl: 'https://example.com/avatar.jpg'
    };
    
    render(<ProfileHeader {...props} />);
    
    // Check if avatar image is rendered
    const avatarImg = screen.getByAltText('User avatar');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('renders with initials when no avatar is provided', () => {
    render(<ProfileHeader {...defaultProps} />);
    
    // Check if avatar placeholder with initials is rendered
    const avatarPlaceholder = screen.getByText('5Y');
    expect(avatarPlaceholder).toBeInTheDocument();
  });

  test('renders with username when provided', () => {
    const props = {
      ...defaultProps,
      username: 'CryptoTrader'
    };
    
    render(<ProfileHeader {...props} />);
    
    // Check if username is displayed
    expect(screen.getByText('CryptoTrader')).toBeInTheDocument();
    
    // Check if initials are from username
    const avatarPlaceholder = screen.getByText('CR');
    expect(avatarPlaceholder).toBeInTheDocument();
  });

  test('renders verified badge when isVerified is true', () => {
    const props = {
      ...defaultProps,
      isVerified: true
    };
    
    render(<ProfileHeader {...props} />);
    
    // Check if verified badge is rendered
    const verifiedBadge = screen.getByTitle('Verified User');
    expect(verifiedBadge).toBeInTheDocument();
  });

  test('copy button copies wallet address to clipboard', () => {
    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    navigator.clipboard = {
      writeText: jest.fn()
    };
    
    render(<ProfileHeader {...defaultProps} />);
    
    // Find and click copy button
    const copyButton = screen.getByLabelText('Copy wallet address');
    fireEvent.click(copyButton);
    
    // Check if clipboard API was called with correct address
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.walletAddress);
    
    // Restore original clipboard
    navigator.clipboard = originalClipboard;
  });
});
