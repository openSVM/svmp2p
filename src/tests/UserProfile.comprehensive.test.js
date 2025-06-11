/**
 * Comprehensive tests for UserProfile component
 * 
 * Tests for:
 * - Profile data display and editing
 * - Form validation and submission
 * - File upload for profile picture
 * - Security settings management
 * - Trading history and statistics
 * - Error handling and edge cases
 * - Accessibility features
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserProfile from '../components/UserProfile';

// Mock user data
const mockUserData = {
  id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  bio: 'Experienced trader with 5 years in crypto',
  profilePicture: '/images/default-avatar.png',
  joinDate: '2023-01-15T10:30:00Z',
  verified: true,
  trustScore: 4.8,
  totalTrades: 156,
  successfulTrades: 152,
  volume: 25000,
  preferredCurrency: 'USD',
  paymentMethods: ['Bank Transfer', 'PayPal'],
  twoFactorEnabled: true,
  emailNotifications: true,
  tradingNotifications: false,
  lastActive: Date.now() - 3600000 // 1 hour ago
};

// Mock trading history
const mockTradingHistory = [
  {
    id: 'trade1',
    type: 'buy',
    amount: 2.5,
    fiatAmount: 375,
    currency: 'USD',
    counterparty: 'user456',
    status: 'completed',
    timestamp: Date.now() - 86400000, // 1 day ago
    rating: 5
  },
  {
    id: 'trade2',
    type: 'sell',
    amount: 1.0,
    fiatAmount: 150,
    currency: 'USD',
    counterparty: 'user789',
    status: 'completed',
    timestamp: Date.now() - 172800000, // 2 days ago
    rating: 4
  }
];

// Mock wallet context
const mockWalletContext = {
  connected: true,
  publicKey: { toString: () => '0x1234567890abcdef1234567890abcdef12345678' },
  connect: jest.fn(),
  disconnect: jest.fn()
};

jest.mock('../contexts/WalletContextProvider', () => ({
  useSafeWallet: () => mockWalletContext
}));

// Mock API calls
const mockApiCalls = {
  updateProfile: jest.fn(),
  uploadProfilePicture: jest.fn(),
  updateSecuritySettings: jest.fn(),
  getTradingHistory: jest.fn(),
  deleteAccount: jest.fn()
};

jest.mock('../utils/api', () => ({
  updateUserProfile: (...args) => mockApiCalls.updateProfile(...args),
  uploadProfilePicture: (...args) => mockApiCalls.uploadProfilePicture(...args),
  updateSecuritySettings: (...args) => mockApiCalls.updateSecuritySettings(...args),
  getUserTradingHistory: (...args) => mockApiCalls.getTradingHistory(...args),
  deleteUserAccount: (...args) => mockApiCalls.deleteAccount(...args)
}));

// Mock file upload
const mockFile = new File(['profile picture'], 'profile.jpg', { type: 'image/jpeg' });
Object.defineProperty(mockFile, 'size', { value: 1024 * 100 }); // 100KB

describe('UserProfile Component', () => {
  const defaultProps = {
    userData: mockUserData,
    onUpdateProfile: jest.fn(),
    onUpdateSecurity: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiCalls.getTradingHistory.mockResolvedValue(mockTradingHistory);
    mockApiCalls.updateProfile.mockResolvedValue({ success: true });
    mockApiCalls.uploadProfilePicture.mockResolvedValue({ 
      success: true, 
      url: '/images/new-avatar.jpg' 
    });
  });

  describe('Basic Rendering', () => {
    test('should render user profile with all sections', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Trading Statistics')).toBeInTheDocument();
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
      expect(screen.getByText('Trading History')).toBeInTheDocument();
    });

    test('should display user information correctly', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    test('should show verified badge when user is verified', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
    });

    test('should display trading statistics', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByText('156')).toBeInTheDocument(); // Total trades
      expect(screen.getByText('4.8')).toBeInTheDocument(); // Trust score
      expect(screen.getByText('$25,000')).toBeInTheDocument(); // Volume
    });

    test('should show loading state', () => {
      render(<UserProfile {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    test('should display error state', () => {
      const error = 'Failed to load profile';
      render(<UserProfile {...defaultProps} error={error} />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  describe('Profile Editing', () => {
    test('should enable edit mode when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const editButton = screen.getByText('Edit Profile');
      await user.click(editButton);
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('should update profile information', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      // Enter edit mode
      await user.click(screen.getByText('Edit Profile'));
      
      // Change first name
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');
      
      // Save changes
      await user.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockApiCalls.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({ firstName: 'Jane' })
        );
      });
    });

    test('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Edit Profile'));
      
      // Clear required field
      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      
      await user.click(screen.getByText('Save Changes'));
      
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    test('should validate email format', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Edit Profile'));
      
      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      
      await user.click(screen.getByText('Save Changes'));
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    test('should cancel editing without saving', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Edit Profile'));
      
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Changed');
      
      await user.click(screen.getByText('Cancel'));
      
      // Should revert to original value
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(mockApiCalls.updateProfile).not.toHaveBeenCalled();
    });

    test('should handle profile update errors', async () => {
      const user = userEvent.setup();
      mockApiCalls.updateProfile.mockRejectedValue(new Error('Update failed'));
      
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Edit Profile'));
      await user.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Picture Upload', () => {
    test('should upload new profile picture', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const fileInput = screen.getByLabelText('Upload new profile picture');
      await user.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(mockApiCalls.uploadProfilePicture).toHaveBeenCalledWith(mockFile);
      });
    });

    test('should validate file size', async () => {
      const user = userEvent.setup();
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      Object.defineProperty(largeFile, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      
      render(<UserProfile {...defaultProps} />);
      
      const fileInput = screen.getByLabelText('Upload new profile picture');
      await user.upload(fileInput, largeFile);
      
      expect(screen.getByText('File size must be less than 2MB')).toBeInTheDocument();
    });

    test('should validate file type', async () => {
      const user = userEvent.setup();
      const textFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
      
      render(<UserProfile {...defaultProps} />);
      
      const fileInput = screen.getByLabelText('Upload new profile picture');
      await user.upload(fileInput, textFile);
      
      expect(screen.getByText('Please select a valid image file')).toBeInTheDocument();
    });

    test('should handle upload errors', async () => {
      const user = userEvent.setup();
      mockApiCalls.uploadProfilePicture.mockRejectedValue(new Error('Upload failed'));
      
      render(<UserProfile {...defaultProps} />);
      
      const fileInput = screen.getByLabelText('Upload new profile picture');
      await user.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to upload profile picture')).toBeInTheDocument();
      });
    });
  });

  describe('Security Settings', () => {
    test('should toggle two-factor authentication', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const twoFactorToggle = screen.getByLabelText('Enable Two-Factor Authentication');
      expect(twoFactorToggle).toBeChecked();
      
      await user.click(twoFactorToggle);
      
      await waitFor(() => {
        expect(mockApiCalls.updateSecuritySettings).toHaveBeenCalledWith(
          expect.objectContaining({ twoFactorEnabled: false })
        );
      });
    });

    test('should update notification preferences', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const emailNotifications = screen.getByLabelText('Email Notifications');
      await user.click(emailNotifications);
      
      await waitFor(() => {
        expect(mockApiCalls.updateSecuritySettings).toHaveBeenCalledWith(
          expect.objectContaining({ emailNotifications: false })
        );
      });
    });

    test('should change password', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const changePasswordButton = screen.getByText('Change Password');
      await user.click(changePasswordButton);
      
      expect(screen.getByText('Change Password')).toBeInTheDocument();
      
      const currentPassword = screen.getByLabelText('Current Password');
      const newPassword = screen.getByLabelText('New Password');
      const confirmPassword = screen.getByLabelText('Confirm New Password');
      
      await user.type(currentPassword, 'oldpassword');
      await user.type(newPassword, 'newpassword123');
      await user.type(confirmPassword, 'newpassword123');
      
      await user.click(screen.getByText('Update Password'));
      
      await waitFor(() => {
        expect(mockApiCalls.updateSecuritySettings).toHaveBeenCalledWith(
          expect.objectContaining({ 
            currentPassword: 'oldpassword',
            newPassword: 'newpassword123'
          })
        );
      });
    });

    test('should validate password confirmation', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Change Password'));
      
      const newPassword = screen.getByLabelText('New Password');
      const confirmPassword = screen.getByLabelText('Confirm New Password');
      
      await user.type(newPassword, 'password123');
      await user.type(confirmPassword, 'differentpassword');
      
      await user.click(screen.getByText('Update Password'));
      
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  describe('Trading History', () => {
    test('should display trading history', async () => {
      render(<UserProfile {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Buy')).toBeInTheDocument();
        expect(screen.getByText('Sell')).toBeInTheDocument();
        expect(screen.getByText('2.5 SOL')).toBeInTheDocument();
        expect(screen.getByText('$375')).toBeInTheDocument();
      });
    });

    test('should filter trading history by type', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId(/trade-item-/)).toHaveLength(2);
      });
      
      const filterSelect = screen.getByLabelText('Filter by type');
      await user.selectOptions(filterSelect, 'buy');
      
      await waitFor(() => {
        expect(screen.getAllByTestId(/trade-item-/)).toHaveLength(1);
        expect(screen.getByText('Buy')).toBeInTheDocument();
      });
    });

    test('should show empty state for no trading history', async () => {
      mockApiCalls.getTradingHistory.mockResolvedValue([]);
      
      render(<UserProfile {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No trading history found')).toBeInTheDocument();
      });
    });

    test('should handle trading history load errors', async () => {
      mockApiCalls.getTradingHistory.mockRejectedValue(new Error('Load failed'));
      
      render(<UserProfile {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load trading history')).toBeInTheDocument();
      });
    });
  });

  describe('Account Management', () => {
    test('should show delete account confirmation', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const deleteButton = screen.getByText('Delete Account');
      await user.click(deleteButton);
      
      expect(screen.getByText('Delete Account Confirmation')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });

    test('should delete account with confirmation', async () => {
      const user = userEvent.setup();
      mockApiCalls.deleteAccount.mockResolvedValue({ success: true });
      
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Delete Account'));
      
      const confirmInput = screen.getByLabelText('Type "DELETE" to confirm');
      await user.type(confirmInput, 'DELETE');
      
      await user.click(screen.getByText('Permanently Delete Account'));
      
      await waitFor(() => {
        expect(mockApiCalls.deleteAccount).toHaveBeenCalled();
      });
    });

    test('should not delete account without proper confirmation', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Delete Account'));
      
      const confirmInput = screen.getByLabelText('Type "DELETE" to confirm');
      await user.type(confirmInput, 'delete'); // lowercase
      
      const deleteButton = screen.getByText('Permanently Delete Account');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      const editButton = screen.getByText('Edit Profile');
      editButton.focus();
      
      expect(document.activeElement).toBe(editButton);
      
      await user.tab();
      // Should focus on next focusable element
    });

    test('should have proper ARIA attributes', () => {
      render(<UserProfile {...defaultProps} />);
      
      const profileForm = screen.getByRole('form');
      expect(profileForm).toHaveAttribute('aria-label', 'User profile form');
      
      const securitySection = screen.getByRole('region', { name: 'Security Settings' });
      expect(securitySection).toBeInTheDocument();
    });

    test('should announce form validation errors', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Edit Profile'));
      
      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.click(screen.getByText('Save Changes'));
      
      const errorMessage = screen.getByText('Username is required');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<UserProfile {...defaultProps} />);
      
      const profileContainer = screen.getByTestId('profile-container');
      expect(profileContainer).toHaveClass('mobile-layout');
    });

    test('should stack sections vertically on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<UserProfile {...defaultProps} />);
      
      const sections = screen.getAllByTestId(/profile-section-/);
      sections.forEach(section => {
        expect(section).toHaveClass('mobile-stack');
      });
    });
  });

  describe('Data Persistence', () => {
    test('should save draft changes locally', async () => {
      const user = userEvent.setup();
      const localStorageSpy = jest.spyOn(localStorage, 'setItem');
      
      render(<UserProfile {...defaultProps} />);
      
      await user.click(screen.getByText('Edit Profile'));
      
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');
      
      expect(localStorageSpy).toHaveBeenCalledWith(
        'profile-draft',
        expect.stringContaining('Jane')
      );
    });

    test('should restore draft changes on page load', () => {
      localStorage.setItem('profile-draft', JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe'
      }));
      
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });
});