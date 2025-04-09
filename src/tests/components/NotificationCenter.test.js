import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import { NotificationContext } from '../../components/notifications/NotificationContext';

// Mock data
const mockNotifications = [
  {
    id: '1',
    title: 'Offer Accepted',
    message: 'Your offer has been accepted',
    type: 'success',
    timestamp: new Date('2025-04-08T10:00:00Z'),
    read: false
  },
  {
    id: '2',
    title: 'Payment Received',
    message: 'Payment has been received',
    type: 'info',
    timestamp: new Date('2025-04-07T15:30:00Z'),
    read: true
  },
  {
    id: '3',
    title: 'Transaction Failed',
    message: 'Transaction failed due to network error',
    type: 'error',
    timestamp: new Date('2025-04-06T09:15:00Z'),
    read: false
  }
];

// Mock context provider
const MockNotificationProvider = ({ children, notifications = mockNotifications }) => {
  const markAsRead = jest.fn((id) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    return updatedNotifications;
  });
  
  const clearAll = jest.fn(() => []);
  
  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      markAsRead, 
      clearAll,
      unreadCount: notifications.filter(n => !n.read).length
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders notification icon with unread count', () => {
    render(
      <MockNotificationProvider>
        <NotificationCenter />
      </MockNotificationProvider>
    );
    
    expect(screen.getByTestId('notification-icon')).toBeInTheDocument();
    expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
  });

  test('opens notification panel on icon click', async () => {
    const user = userEvent.setup();
    
    render(
      <MockNotificationProvider>
        <NotificationCenter />
      </MockNotificationProvider>
    );
    
    // Click notification icon
    await user.click(screen.getByTestId('notification-icon'));
    
    // Check if notification panel is open
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    
    // Check if notifications are displayed
    expect(screen.getByText('Offer Accepted')).toBeInTheDocument();
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
    expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
  });

  test('marks notification as read when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MockNotificationProvider>
        <NotificationCenter />
      </MockNotificationProvider>
    );
    
    // Open notification panel
    await user.click(screen.getByTestId('notification-icon'));
    
    // Click on unread notification
    await user.click(screen.getByText('Offer Accepted'));
    
    // Check if markAsRead was called with correct ID
    expect(MockNotificationProvider.mock.calls[0][0].markAsRead).toHaveBeenCalledWith('1');
  });

  test('clears all notifications when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MockNotificationProvider>
        <NotificationCenter />
      </MockNotificationProvider>
    );
    
    // Open notification panel
    await user.click(screen.getByTestId('notification-icon'));
    
    // Click clear all button
    await user.click(screen.getByText('Clear All'));
    
    // Check if clearAll was called
    expect(MockNotificationProvider.mock.calls[0][0].clearAll).toHaveBeenCalled();
  });

  test('closes notification panel when clicking outside', async () => {
    const user = userEvent.setup();
    
    render(
      <MockNotificationProvider>
        <NotificationCenter />
        <div data-testid="outside-element">Outside</div>
      </MockNotificationProvider>
    );
    
    // Open notification panel
    await user.click(screen.getByTestId('notification-icon'));
    
    // Check if notification panel is open
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    
    // Click outside
    await user.click(screen.getByTestId('outside-element'));
    
    // Check if notification panel is closed
    await waitFor(() => {
      expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
    });
  });

  test('displays empty state when no notifications', () => {
    render(
      <MockNotificationProvider notifications={[]}>
        <NotificationCenter />
      </MockNotificationProvider>
    );
    
    // Open notification panel
    fireEvent.click(screen.getByTestId('notification-icon'));
    
    // Check if empty state is displayed
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  test('groups notifications by date', async () => {
    const user = userEvent.setup();
    
    render(
      <MockNotificationProvider>
        <NotificationCenter />
      </MockNotificationProvider>
    );
    
    // Open notification panel
    await user.click(screen.getByTestId('notification-icon'));
    
    // Check if date groups are displayed
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('April 6, 2025')).toBeInTheDocument();
  });
});
