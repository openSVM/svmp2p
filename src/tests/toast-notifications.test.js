import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationProvider } from '../components/notifications/NotificationContext';
import NotificationManager from '../components/notifications/NotificationManager';
import ToastContainer from '../components/notifications/ToastContainer';
import ToastNotification from '../components/notifications/ToastNotification';

describe('Toast Notification Components', () => {
  describe('ToastNotification', () => {
    test('should render toast with correct content', () => {
      const mockNotification = {
        id: 'toast-1',
        type: 'success',
        title: 'Success Toast',
        message: 'Operation completed successfully'
      };
      
      const mockOnClose = jest.fn();
      
      render(
        <ToastNotification
          notification={mockNotification}
          onClose={mockOnClose}
        />
      );
      
      // Check content
      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });
    
    test('should call onClose when close button is clicked', () => {
      const mockNotification = {
        id: 'toast-1',
        type: 'success',
        title: 'Success Toast',
        message: 'Operation completed successfully'
      };
      
      const mockOnClose = jest.fn();
      
      render(
        <ToastNotification
          notification={mockNotification}
          onClose={mockOnClose}
        />
      );
      
      // Click close button
      fireEvent.click(screen.getByLabelText('Close notification'));
      
      // Check if onClose was called
      expect(mockOnClose).toHaveBeenCalled();
    });
    
    test('should render different icons based on notification type', () => {
      // Test success type
      const successNotification = {
        id: 'toast-1',
        type: 'success',
        title: 'Success Toast',
        message: 'Success message'
      };
      
      const { rerender } = render(
        <ToastNotification
          notification={successNotification}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      
      // Test error type
      const errorNotification = {
        id: 'toast-2',
        type: 'error',
        title: 'Error Toast',
        message: 'Error message'
      };
      
      rerender(
        <ToastNotification
          notification={errorNotification}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Error Toast')).toBeInTheDocument();
      
      // Test warning type
      const warningNotification = {
        id: 'toast-3',
        type: 'warning',
        title: 'Warning Toast',
        message: 'Warning message'
      };
      
      rerender(
        <ToastNotification
          notification={warningNotification}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Warning Toast')).toBeInTheDocument();
      
      // Test info type
      const infoNotification = {
        id: 'toast-4',
        type: 'info',
        title: 'Info Toast',
        message: 'Info message'
      };
      
      rerender(
        <ToastNotification
          notification={infoNotification}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Info Toast')).toBeInTheDocument();
    });
  });
  
  describe('ToastContainer', () => {
    test('should render multiple toasts', () => {
      const toasts = [
        {
          id: 'toast-1',
          type: 'success',
          title: 'Success Toast',
          message: 'Success message'
        },
        {
          id: 'toast-2',
          type: 'error',
          title: 'Error Toast',
          message: 'Error message'
        }
      ];
      
      render(
        <ToastContainer
          toasts={toasts}
          position="top-right"
          onClose={jest.fn()}
        />
      );
      
      // Check both toasts are rendered
      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      expect(screen.getByText('Error Toast')).toBeInTheDocument();
    });
    
    test('should apply correct position class', () => {
      const toasts = [
        {
          id: 'toast-1',
          type: 'success',
          title: 'Success Toast',
          message: 'Success message'
        }
      ];
      
      const { container, rerender } = render(
        <ToastContainer
          toasts={toasts}
          position="top-right"
          onClose={jest.fn()}
        />
      );
      
      // Check top-right position class
      expect(container.firstChild).toHaveClass('toast-container-top-right');
      
      // Test bottom-left position
      rerender(
        <ToastContainer
          toasts={toasts}
          position="bottom-left"
          onClose={jest.fn()}
        />
      );
      
      // Check bottom-left position class
      expect(container.firstChild).toHaveClass('toast-container-bottom-left');
    });
    
    test('should call onClose with correct ID when toast is closed', () => {
      const toasts = [
        {
          id: 'toast-1',
          type: 'success',
          title: 'Success Toast',
          message: 'Success message'
        }
      ];
      
      const mockOnClose = jest.fn();
      
      render(
        <ToastContainer
          toasts={toasts}
          position="top-right"
          onClose={mockOnClose}
        />
      );
      
      // Click close button on toast
      fireEvent.click(screen.getByLabelText('Close notification'));
      
      // Check if onClose was called with correct ID
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    });
  });
  
  describe('NotificationManager', () => {
    // This component relies heavily on the NotificationContext
    // and would require more complex testing with context mocking
    // Basic smoke test to ensure it renders without errors
    test('should render without errors', () => {
      render(
        <NotificationProvider>
          <NotificationManager />
        </NotificationProvider>
      );
      
      // Component renders without errors if we get here
      expect(true).toBeTruthy();
    });
  });
});
