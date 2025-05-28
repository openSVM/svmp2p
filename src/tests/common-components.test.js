import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner, ButtonLoader, TransactionStatus, TransactionConfirmation } from '../components/common';

// Mock context providers that would normally be required
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    publicKey: 'mock-public-key',
    connected: true
  }),
  useConnection: () => ({
    connection: {}
  })
}));

describe('Loading and Transaction Components', () => {
  // Test LoadingSpinner component
  describe('LoadingSpinner', () => {
    test('renders with default props', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders with custom text', () => {
      render(<LoadingSpinner text="Custom loading text" />);
      expect(screen.getByText('Custom loading text')).toBeInTheDocument();
    });

    test('applies size classes correctly', () => {
      const { container } = render(<LoadingSpinner size="large" />);
      expect(container.querySelector('.spinner-large')).toBeInTheDocument();
    });
  });

  // Test ButtonLoader component
  describe('ButtonLoader', () => {
    test('renders button with children when not loading', () => {
      render(<ButtonLoader>Click Me</ButtonLoader>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    test('shows loading text when isLoading is true', () => {
      render(<ButtonLoader isLoading={true} loadingText="Processing...">Click Me</ButtonLoader>);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('calls onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<ButtonLoader onClick={handleClick}>Click Me</ButtonLoader>);
      fireEvent.click(screen.getByText('Click Me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('is disabled when isLoading is true', () => {
      render(<ButtonLoader isLoading={true}>Click Me</ButtonLoader>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // Test TransactionStatus component
  describe('TransactionStatus', () => {
    test('renders with pending status', () => {
      render(<TransactionStatus status="pending" message="Transaction in progress" />);
      expect(screen.getByText('Transaction in Progress')).toBeInTheDocument();
      expect(screen.getByText('Transaction in progress')).toBeInTheDocument();
    });

    test('renders with success status', () => {
      render(<TransactionStatus status="success" message="Transaction completed" />);
      expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
      expect(screen.getByText('Transaction completed')).toBeInTheDocument();
    });

    test('renders with error status', () => {
      render(<TransactionStatus status="error" message="Transaction failed" />);
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      expect(screen.getByText('Transaction failed')).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      const handleClose = jest.fn();
      render(<TransactionStatus status="success" message="Success" onClose={handleClose} />);
      fireEvent.click(screen.getByText('×'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('auto closes after specified time', async () => {
      const handleClose = jest.fn();
      render(
        <TransactionStatus 
          status="success" 
          message="Success" 
          onClose={handleClose} 
          autoClose={true} 
          autoCloseTime={100} 
        />
      );
      
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });

  // Test TransactionConfirmation component
  describe('TransactionConfirmation', () => {
    test('renders with pending status', () => {
      render(<TransactionConfirmation status="pending" message="Processing transaction" />);
      expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
      expect(screen.getByText('Processing transaction')).toBeInTheDocument();
      expect(screen.getByText('Transaction in progress...')).toBeInTheDocument();
    });

    test('renders with success status', () => {
      render(<TransactionConfirmation status="success" message="Transaction confirmed" />);
      expect(screen.getByText('Transaction Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Transaction confirmed')).toBeInTheDocument();
      expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
    });

    test('renders with error status', () => {
      const { container } = render(<TransactionConfirmation status="error" message="Transaction failed" />);
      
      // Check the header text
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      
      // Use container.querySelector to be more specific about which "Transaction failed" we're checking
      const statusIndicatorText = container.querySelector('.status-indicator p');
      expect(statusIndicatorText).toHaveTextContent('Transaction failed');
      
      // Check the confirmation message specifically
      const confirmationMessage = container.querySelector('.confirmation-message');
      expect(confirmationMessage).toHaveTextContent('Transaction failed');
    });

    test('displays transaction hash when provided', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      render(
        <TransactionConfirmation 
          status="success" 
          txHash={txHash} 
          showDetails={true} 
        />
      );
      
      expect(screen.getByText(/Transaction ID:/)).toBeInTheDocument();
      expect(screen.getByText('View on Solana Explorer')).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      const handleClose = jest.fn();
      render(
        <TransactionConfirmation 
          status="success" 
          message="Success" 
          onClose={handleClose} 
        />
      );
      
      fireEvent.click(screen.getByText('×'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
