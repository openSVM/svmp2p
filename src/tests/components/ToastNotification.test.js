import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { ToastContainer } from '../../components/notifications/ToastContainer';
import { ToastNotification } from '../../components/notifications/ToastNotification';

// Mock data
const mockToasts = [
  {
    id: '1',
    message: 'Operation successful',
    type: 'success',
    duration: 3000
  },
  {
    id: '2',
    message: 'Something went wrong',
    type: 'error',
    duration: 5000
  },
  {
    id: '3',
    message: 'Please wait while we process your request',
    type: 'info',
    duration: 2000
  }
];

describe('Toast Notification Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ToastNotification Component', () => {
    test('renders toast with correct message and type', () => {
      const onClose = jest.fn();
      
      render(
        <ToastNotification 
          id="1"
          message="Operation successful"
          type="success"
          duration={3000}
          onClose={onClose}
        />
      );
      
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
      expect(screen.getByTestId('toast-notification')).toHaveClass('success');
    });

    test('calls onClose after duration', () => {
      const onClose = jest.fn();
      
      render(
        <ToastNotification 
          id="1"
          message="Operation successful"
          type="success"
          duration={3000}
          onClose={onClose}
        />
      );
      
      // Fast-forward time
      jest.advanceTimersByTime(3000);
      
      // Check if onClose was called
      expect(onClose).toHaveBeenCalledWith('1');
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onClose = jest.fn();
      
      render(
        <ToastNotification 
          id="1"
          message="Operation successful"
          type="success"
          duration={3000}
          onClose={onClose}
        />
      );
      
      // Click close button
      await user.click(screen.getByTestId('toast-close-button'));
      
      // Check if onClose was called
      expect(onClose).toHaveBeenCalledWith('1');
    });

    test('renders different styles based on type', () => {
      const { rerender } = render(
        <ToastNotification 
          id="1"
          message="Success message"
          type="success"
          duration={3000}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByTestId('toast-notification')).toHaveClass('success');
      
      rerender(
        <ToastNotification 
          id="2"
          message="Error message"
          type="error"
          duration={3000}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByTestId('toast-notification')).toHaveClass('error');
      
      rerender(
        <ToastNotification 
          id="3"
          message="Info message"
          type="info"
          duration={3000}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByTestId('toast-notification')).toHaveClass('info');
      
      rerender(
        <ToastNotification 
          id="4"
          message="Warning message"
          type="warning"
          duration={3000}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByTestId('toast-notification')).toHaveClass('warning');
    });
  });

  describe('ToastContainer Component', () => {
    test('renders multiple toasts', () => {
      render(
        <ToastContainer toasts={mockToasts} onClose={() => {}} />
      );
      
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
    });

    test('calls onClose with correct id when toast is closed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onClose = jest.fn();
      
      render(
        <ToastContainer toasts={mockToasts} onClose={onClose} />
      );
      
      // Click close button on first toast
      await user.click(screen.getAllByTestId('toast-close-button')[0]);
      
      // Check if onClose was called with correct id
      expect(onClose).toHaveBeenCalledWith('1');
    });

    test('renders toasts in correct position', () => {
      const { rerender } = render(
        <ToastContainer toasts={mockToasts} position="top-right" onClose={() => {}} />
      );
      
      expect(screen.getByTestId('toast-container')).toHaveClass('top-right');
      
      rerender(
        <ToastContainer toasts={mockToasts} position="bottom-left" onClose={() => {}} />
      );
      
      expect(screen.getByTestId('toast-container')).toHaveClass('bottom-left');
    });

    test('renders nothing when no toasts', () => {
      render(
        <ToastContainer toasts={[]} onClose={() => {}} />
      );
      
      expect(screen.queryByTestId('toast-notification')).not.toBeInTheDocument();
    });
  });
});
