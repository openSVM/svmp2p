import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedNotification from '../components/notifications/EnhancedNotification';

describe('EnhancedNotification', () => {
  const baseProps = {
    id: 'test-notification-1',
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification message',
    timestamp: '2024-01-01T12:00:00Z'
  };

  test('renders basic notification', () => {
    render(<EnhancedNotification {...baseProps} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification message')).toBeInTheDocument();
    expect(screen.getByText('general')).toBeInTheDocument(); // default category
  });

  test('displays different notification types correctly', () => {
    const types = ['success', 'error', 'warning', 'info', 'trade'];
    
    types.forEach(type => {
      const { rerender } = render(
        <EnhancedNotification {...baseProps} type={type} />
      );
      
      // Check that the notification has the correct class
      const notification = screen.getByText('Test Notification').closest('.enhanced-notification');
      expect(notification).toHaveClass(type);
      
      rerender(<div />); // Clear for next iteration
    });
  });

  test('shows trust indicators when provided', () => {
    const trustIndicators = {
      verified: true,
      secure: true,
      successRate: 95
    };

    render(
      <EnhancedNotification
        {...baseProps}
        trustIndicators={trustIndicators}
      />
    );

    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
    expect(screen.getByText('🔒 Secure')).toBeInTheDocument();
    expect(screen.getByText('📊 95% success rate')).toBeInTheDocument();
  });

  test('displays progress bar when enabled', () => {
    const { container } = render(
      <EnhancedNotification
        {...baseProps}
        showProgressBar={true}
        progressValue={75}
      />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 75%');
  });

  test('shows verification status', () => {
    const verificationStatus = {
      status: 'verified',
      message: 'Transaction has been verified'
    };

    render(
      <EnhancedNotification
        {...baseProps}
        verificationStatus={verificationStatus}
      />
    );

    expect(screen.getByText('Transaction has been verified')).toBeInTheDocument();
    const verificationElement = screen.getByText('✓');
    expect(verificationElement).toBeInTheDocument();
  });

  test('handles expand/collapse functionality', () => {
    const details = 'This is detailed information about the notification';
    
    render(
      <EnhancedNotification
        {...baseProps}
        details={details}
      />
    );

    // Details should not be visible initially
    expect(screen.queryByText(details)).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByLabelText('Expand details');
    fireEvent.click(expandButton);

    // Details should now be visible
    expect(screen.getByText(details)).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse details');
    fireEvent.click(collapseButton);

    // Details should be hidden again
    expect(screen.queryByText(details)).not.toBeInTheDocument();
  });

  test('renders action buttons', () => {
    const actions = [
      {
        label: 'Retry',
        type: 'primary',
        icon: '🔄',
        action: 'retry'
      },
      {
        label: 'Cancel',
        type: 'secondary',
        action: 'cancel'
      }
    ];

    const mockOnAction = jest.fn();

    render(
      <EnhancedNotification
        {...baseProps}
        actions={actions}
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();

    // Test action click
    fireEvent.click(screen.getByText('Retry'));
    expect(mockOnAction).toHaveBeenCalledWith('test-notification-1', actions[0]);
  });

  test('shows priority indicator for high priority notifications', () => {
    const { container } = render(
      <EnhancedNotification
        {...baseProps}
        priority="high"
      />
    );

    const priorityIndicator = container.querySelector('.priority-indicator');
    expect(priorityIndicator).toBeInTheDocument();
    expect(priorityIndicator).toHaveStyle('background: rgb(239, 68, 68)');
  });

  test('formats timestamp correctly', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    render(
      <EnhancedNotification
        {...baseProps}
        timestamp={fiveMinutesAgo.toISOString()}
      />
    );

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  test('handles close button click', () => {
    const mockOnDelete = jest.fn();

    render(
      <EnhancedNotification
        {...baseProps}
        onDelete={mockOnDelete}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(mockOnDelete).toHaveBeenCalledWith('test-notification-1');
  });

  test('calls onRead when interacted with', () => {
    const mockOnRead = jest.fn();

    render(
      <EnhancedNotification
        {...baseProps}
        read={false}
        onRead={mockOnRead}
        details="Some details"
      />
    );

    // Click expand button should mark as read
    const expandButton = screen.getByLabelText('Expand details');
    fireEvent.click(expandButton);

    expect(mockOnRead).toHaveBeenCalledWith('test-notification-1');
  });

  test('auto-closes non-persistent notifications', async () => {
    const mockOnDelete = jest.fn();

    render(
      <EnhancedNotification
        {...baseProps}
        type="success"
        autoClose={true}
        autoCloseTime={100} // 100ms for fast testing
        persistent={false}
        read={false}
        onDelete={mockOnDelete}
      />
    );

    // Wait for auto-close
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('test-notification-1');
    }, { timeout: 200 });
  });

  test('does not auto-close persistent notifications', async () => {
    const mockOnDelete = jest.fn();

    render(
      <EnhancedNotification
        {...baseProps}
        type="success"
        autoClose={true}
        autoCloseTime={100}
        persistent={true}
        read={false}
        onDelete={mockOnDelete}
      />
    );

    // Wait to ensure it doesn't auto-close
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('does not auto-close error notifications', async () => {
    const mockOnDelete = jest.fn();

    render(
      <EnhancedNotification
        {...baseProps}
        type="error"
        autoClose={true}
        autoCloseTime={100}
        persistent={false}
        read={false}
        onDelete={mockOnDelete}
      />
    );

    // Wait to ensure error notifications don't auto-close
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('shows category badge', () => {
    render(
      <EnhancedNotification
        {...baseProps}
        category="trading"
      />
    );

    expect(screen.getByText('trading')).toBeInTheDocument();
  });

  test('handles disabled action buttons', () => {
    const actions = [
      {
        label: 'Disabled Action',
        type: 'primary',
        action: 'disabled-action',
        disabled: true
      }
    ];

    render(
      <EnhancedNotification
        {...baseProps}
        actions={actions}
      />
    );

    const disabledButton = screen.getByText('Disabled Action');
    expect(disabledButton).toBeDisabled();
  });

  test('shows auto-close timer for applicable notifications', () => {
    const { container } = render(
      <EnhancedNotification
        {...baseProps}
        type="success"
        autoClose={true}
        autoCloseTime={5000}
        persistent={false}
        read={false}
      />
    );

    // Should show timer elements
    const timerText = container.querySelector('.timer-text');
    const timerCircle = container.querySelector('.timer-circle');
    
    expect(timerText).toBeInTheDocument();
    expect(timerCircle).toBeInTheDocument();
  });

  test('handles different verification statuses', () => {
    const statuses = [
      { status: 'verified', message: 'Verified', icon: '✓' },
      { status: 'pending', message: 'Pending', icon: '⏳' },
      { status: 'failed', message: 'Failed', icon: '⚠' }
    ];

    statuses.forEach(({ status, message, icon }) => {
      const { rerender } = render(
        <EnhancedNotification
          {...baseProps}
          verificationStatus={{ status, message }}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(icon)).toBeInTheDocument();

      rerender(<div />); // Clear for next iteration
    });
  });

  test('applies unread styling', () => {
    const { container } = render(
      <EnhancedNotification
        {...baseProps}
        read={false}
      />
    );

    const notification = container.querySelector('.enhanced-notification');
    expect(notification).toHaveClass('unread');
  });

  test('applies read styling', () => {
    const { container } = render(
      <EnhancedNotification
        {...baseProps}
        read={true}
      />
    );

    const notification = container.querySelector('.enhanced-notification');
    expect(notification).toHaveClass('read');
  });
});