import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionStatus from '../../components/common/TransactionStatus';

// Mock timers for testing auto-close functionality
jest.useFakeTimers();

describe('TransactionStatus Component', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('renders pending status correctly', () => {
    render(
      <TransactionStatus 
        status="pending" 
        message="Processing your transaction" 
      />
    );
    
    expect(screen.getByText('Transaction in Progress')).toBeInTheDocument();
    expect(screen.getByText('Processing your transaction')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
    
    const statusElement = screen.getByText('Transaction in Progress').closest('.transaction-status');
    expect(statusElement).toHaveClass('status-pending');
  });

  test('renders success status correctly', () => {
    render(
      <TransactionStatus 
        status="success" 
        message="Transaction completed successfully" 
      />
    );
    
    expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
    expect(screen.getByText('Transaction completed successfully')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
    
    const statusElement = screen.getByText('Transaction Successful').closest('.transaction-status');
    expect(statusElement).toHaveClass('status-success');
  });

  test('renders error status correctly', () => {
    render(
      <TransactionStatus 
        status="error" 
        message="Transaction failed to complete" 
      />
    );
    
    expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    expect(screen.getByText('Transaction failed to complete')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
    
    const statusElement = screen.getByText('Transaction Failed').closest('.transaction-status');
    expect(statusElement).toHaveClass('status-error');
  });

  test('renders warning status correctly', () => {
    render(
      <TransactionStatus 
        status="warning" 
        message="Transaction requires attention" 
      />
    );
    
    expect(screen.getByText('Transaction Warning')).toBeInTheDocument();
    expect(screen.getByText('Transaction requires attention')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    
    const statusElement = screen.getByText('Transaction Warning').closest('.transaction-status');
    expect(statusElement).toHaveClass('status-warning');
  });

  test('handles close button click', () => {
    const handleClose = jest.fn();
    render(
      <TransactionStatus 
        status="success" 
        message="Transaction completed successfully" 
        onClose={handleClose}
      />
    );
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Transaction Successful')).not.toBeInTheDocument();
  });

  test('auto-closes after specified time for success status', () => {
    const handleClose = jest.fn();
    render(
      <TransactionStatus 
        status="success" 
        message="Transaction completed successfully" 
        onClose={handleClose}
        autoClose={true}
        autoCloseTime={3000}
      />
    );
    
    expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Transaction Successful')).not.toBeInTheDocument();
  });

  test('auto-closes after specified time for error status', () => {
    const handleClose = jest.fn();
    render(
      <TransactionStatus 
        status="error" 
        message="Transaction failed to complete" 
        onClose={handleClose}
        autoClose={true}
        autoCloseTime={3000}
      />
    );
    
    expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Transaction Failed')).not.toBeInTheDocument();
  });

  test('does not auto-close for pending status', () => {
    const handleClose = jest.fn();
    render(
      <TransactionStatus 
        status="pending" 
        message="Processing your transaction" 
        onClose={handleClose}
        autoClose={true}
        autoCloseTime={3000}
      />
    );
    
    expect(screen.getByText('Transaction in Progress')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText('Transaction in Progress')).toBeInTheDocument();
  });

  test('does not auto-close when autoClose is false', () => {
    const handleClose = jest.fn();
    render(
      <TransactionStatus 
        status="success" 
        message="Transaction completed successfully" 
        onClose={handleClose}
        autoClose={false}
        autoCloseTime={3000}
      />
    );
    
    expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
  });

  test('renders without message', () => {
    render(
      <TransactionStatus 
        status="success" 
      />
    );
    
    expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
    expect(screen.queryByText('status-message')).not.toBeInTheDocument();
  });
});
