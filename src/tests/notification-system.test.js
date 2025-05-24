import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../components/notifications/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';
import NotificationList from '../components/notifications/NotificationList';
import NotificationCenter from '../components/notifications/NotificationCenter';

// Mock component to test the notification context
const TestComponent = () => {
  const { 
    notifications, 
    notifySuccess, 
    notifyError, 
    notifyWarning, 
    notifyInfo,
    markAsRead,
    removeNotification
  } = useNotifications();
  
  return (
    <div>
      <button 
        data-testid="add-success"
        onClick={() => notifySuccess('Success', 'Operation completed successfully')}
      >
        Add Success
      </button>
      <button 
        data-testid="add-error"
        onClick={() => notifyError('Error', 'Something went wrong')}
      >
        Add Error
      </button>
      <button 
        data-testid="add-warning"
        onClick={() => notifyWarning('Warning', 'This action may have consequences')}
      >
        Add Warning
      </button>
      <button 
        data-testid="add-info"
        onClick={() => notifyInfo('Info', 'Here is some information')}
      >
        Add Info
      </button>
      <div data-testid="notification-count">{notifications.length}</div>
      {notifications.map(notification => (
        <div key={notification.id} data-testid={`notification-${notification.id}`}>
          <span data-testid={`notification-title-${notification.id}`}>{notification.title}</span>
          <button 
            data-testid={`mark-read-${notification.id}`}
            onClick={() => markAsRead(notification.id)}
          >
            Mark as Read
          </button>
          <button 
            data-testid={`delete-${notification.id}`}
            onClick={() => removeNotification(notification.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

describe('Notification System', () => {
  describe('NotificationContext', () => {
    test('should add notifications of different types', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      // Initially no notifications
      expect(screen.getByTestId('notification-count').textContent).toBe('0');
      
      // Add success notification
      fireEvent.click(screen.getByTestId('add-success'));
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('1');
      });
      
      // Add error notification
      fireEvent.click(screen.getByTestId('add-error'));
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('2');
      });
      
      // Add warning notification
      fireEvent.click(screen.getByTestId('add-warning'));
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('3');
      });
      
      // Add info notification
      fireEvent.click(screen.getByTestId('add-info'));
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('4');
      });
    });
    
    test('should mark notifications as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      // Add a notification
      fireEvent.click(screen.getByTestId('add-success'));
      
      // Wait for notification to appear
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('1');
      });
      
      // Get the notification ID
      const notificationElement = screen.getByText('Success').closest('[data-testid^="notification-"]');
      const notificationId = notificationElement.dataset.testid.replace('notification-', '');
      
      // Mark as read
      fireEvent.click(screen.getByTestId(`mark-read-${notificationId}`));
      
      // Notification should still exist
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
    });
    
    test('should remove notifications', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      // Add a notification
      fireEvent.click(screen.getByTestId('add-error'));
      
      // Wait for notification to appear
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('1');
      });
      
      // Get the notification ID
      const notificationElement = screen.getByText('Error').closest('[data-testid^="notification-"]');
      const notificationId = notificationElement.dataset.testid.replace('notification-', '');
      
      // Delete notification
      fireEvent.click(screen.getByTestId(`delete-${notificationId}`));
      
      // Notification should be removed
      await waitFor(() => {
        expect(screen.getByTestId('notification-count').textContent).toBe('0');
      });
    });
  });
  
  describe('NotificationItem', () => {
    test('should render notification with correct content', () => {
      const mockNotification = {
        id: 'test-id',
        type: 'success',
        title: 'Test Title',
        message: 'Test Message',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const mockOnRead = jest.fn();
      const mockOnDelete = jest.fn();
      const mockOnAction = jest.fn();
      
      render(
        <NotificationItem
          notification={mockNotification}
          onRead={mockOnRead}
          onDelete={mockOnDelete}
          onAction={mockOnAction}
        />
      );
      
      // Check content
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      
      // Expand to see message
      fireEvent.click(screen.getByText('Test Title'));
      
      // Check message is visible
      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });
    
    test('should call onRead when mark as read button is clicked', () => {
      const mockNotification = {
        id: 'test-id',
        type: 'success',
        title: 'Test Title',
        message: 'Test Message',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const mockOnRead = jest.fn();
      const mockOnDelete = jest.fn();
      const mockOnAction = jest.fn();
      
      render(
        <NotificationItem
          notification={mockNotification}
          onRead={mockOnRead}
          onDelete={mockOnDelete}
          onAction={mockOnAction}
        />
      );
      
      // Click mark as read button
      fireEvent.click(screen.getByTitle('Mark as read'));
      
      // Check if onRead was called with correct ID
      expect(mockOnRead).toHaveBeenCalledWith('test-id');
    });
    
    test('should call onDelete when delete button is clicked', () => {
      const mockNotification = {
        id: 'test-id',
        type: 'success',
        title: 'Test Title',
        message: 'Test Message',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const mockOnRead = jest.fn();
      const mockOnDelete = jest.fn();
      const mockOnAction = jest.fn();
      
      render(
        <NotificationItem
          notification={mockNotification}
          onRead={mockOnRead}
          onDelete={mockOnDelete}
          onAction={mockOnAction}
        />
      );
      
      // Click delete button
      fireEvent.click(screen.getByTitle('Delete notification'));
      
      // Check if onDelete was called with correct ID
      expect(mockOnDelete).toHaveBeenCalledWith('test-id');
    });
  });
  
  describe('NotificationList', () => {
    test('should render empty state when no notifications', () => {
      render(
        <NotificationList
          notifications={[]}
          onRead={jest.fn()}
          onDelete={jest.fn()}
          onAction={jest.fn()}
          onReadAll={jest.fn()}
          onDeleteAll={jest.fn()}
        />
      );
      
      // Check empty state message
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
    
    test('should render notifications grouped by date', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const notifications = [
        {
          id: 'today-1',
          type: 'success',
          title: 'Today Notification',
          message: 'Test Message',
          timestamp: today.toISOString(),
          read: false
        },
        {
          id: 'yesterday-1',
          type: 'info',
          title: 'Yesterday Notification',
          message: 'Test Message',
          timestamp: yesterday.toISOString(),
          read: false
        }
      ];
      
      render(
        <NotificationList
          notifications={notifications}
          onRead={jest.fn()}
          onDelete={jest.fn()}
          onAction={jest.fn()}
          onReadAll={jest.fn()}
          onDeleteAll={jest.fn()}
        />
      );
      
      // Check date headers
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      
      // Check notification titles
      expect(screen.getByText('Today Notification')).toBeInTheDocument();
      expect(screen.getByText('Yesterday Notification')).toBeInTheDocument();
    });
    
    test('should filter notifications based on selected filter', () => {
      const notifications = [
        {
          id: 'success-1',
          type: 'success',
          title: 'Success Notification',
          message: 'Test Message',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: 'info-1',
          type: 'info',
          title: 'Info Notification',
          message: 'Test Message',
          timestamp: new Date().toISOString(),
          read: true
        }
      ];
      
      render(
        <NotificationList
          notifications={notifications}
          onRead={jest.fn()}
          onDelete={jest.fn()}
          onAction={jest.fn()}
          onReadAll={jest.fn()}
          onDeleteAll={jest.fn()}
        />
      );
      
      // Initially both notifications should be visible
      expect(screen.getByText('Success Notification')).toBeInTheDocument();
      expect(screen.getByText('Info Notification')).toBeInTheDocument();
      
      // Click unread filter
      fireEvent.click(screen.getByText('Unread'));
      
      // Only unread notification should be visible
      expect(screen.getByText('Success Notification')).toBeInTheDocument();
      expect(screen.queryByText('Info Notification')).not.toBeInTheDocument();
    });
  });
});
