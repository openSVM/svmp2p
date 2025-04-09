import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionConfirmation from '../../components/common/TransactionConfirmation';

describe('TransactionConfirmation Component', () => {
  const mockTxHash = '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3Hj8kLmN9';
  
  test('renders pending status correctly', () => {
    render(
      <TransactionConfirmation 
        status="pending" 
        txHash={mockTxHash} 
        message="Your transaction is being processed" 
      />
    );
    
    expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
    expect(screen.getByText('Transaction in progress...')).toBeInTheDocument();
    expect(screen.getByText('Your transaction is being processed')).toBeInTheDocument();
    expect(screen.getByText(/Transaction ID:/)).toBeInTheDocument();
    expect(screen.getByText('View on Solana Explorer')).toBeInTheDocument();
    
    const confirmationElement = screen.getByText('Transaction Processing').closest('.transaction-confirmation');
    expect(confirmationElement).toHaveClass('status-pending');
  });

  test('renders success status correctly', () => {
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
        message="Your transaction was successful" 
      />
    );
    
    expect(screen.getByText('Transaction Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Your transaction was successful')).toBeInTheDocument();
    
    const confirmationElement = screen.getByText('Transaction Confirmed').closest('.transaction-confirmation');
    expect(confirmationElement).toHaveClass('status-success');
  });

  test('renders error status correctly', () => {
    render(
      <TransactionConfirmation 
        status="error" 
        txHash={mockTxHash} 
        message="Your transaction failed" 
      />
    );
    
    expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
    expect(screen.getByText('Your transaction failed')).toBeInTheDocument();
    
    const confirmationElement = screen.getByText('Transaction Failed').closest('.transaction-confirmation');
    expect(confirmationElement).toHaveClass('status-error');
  });

  test('renders warning status correctly', () => {
    render(
      <TransactionConfirmation 
        status="warning" 
        txHash={mockTxHash} 
        message="Your transaction needs attention" 
      />
    );
    
    expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
    expect(screen.getByText('Transaction needs attention')).toBeInTheDocument();
    expect(screen.getByText('Your transaction needs attention')).toBeInTheDocument();
    
    const confirmationElement = screen.getByText('Transaction Processing').closest('.transaction-confirmation');
    expect(confirmationElement).toHaveClass('status-warning');
  });

  test('handles close button click', () => {
    const handleClose = jest.fn();
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
        onClose={handleClose} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('does not render close button when onClose is not provided', () => {
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
      />
    );
    
    const closeButton = screen.queryByRole('button', { name: 'Close' });
    expect(closeButton).not.toBeInTheDocument();
  });

  test('does not show transaction details when showDetails is false', () => {
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
        showDetails={false} 
      />
    );
    
    expect(screen.queryByText(/Transaction ID:/)).not.toBeInTheDocument();
    expect(screen.queryByText('View on Solana Explorer')).not.toBeInTheDocument();
  });

  test('formats transaction hash correctly', () => {
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
      />
    );
    
    const expectedFormattedHash = `${mockTxHash.substring(0, 8)}...${mockTxHash.substring(mockTxHash.length - 8)}`;
    expect(screen.getByText(expectedFormattedHash)).toBeInTheDocument();
  });

  test('uses correct explorer URL for mainnet', () => {
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
        network="mainnet" 
      />
    );
    
    const explorerLink = screen.getByText('View on Solana Explorer');
    expect(explorerLink).toHaveAttribute('href', `https://explorer.solana.com/tx/${mockTxHash}`);
  });

  test('uses correct explorer URL for devnet', () => {
    render(
      <TransactionConfirmation 
        status="success" 
        txHash={mockTxHash} 
        network="devnet" 
      />
    );
    
    const explorerLink = screen.getByText('View on Solana Explorer');
    expect(explorerLink).toHaveAttribute('href', `https://explorer.solana.com/tx/${mockTxHash}`);
  });

  test('renders without transaction hash', () => {
    render(
      <TransactionConfirmation 
        status="pending" 
        message="Preparing transaction..." 
      />
    );
    
    expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
    expect(screen.queryByText(/Transaction ID:/)).not.toBeInTheDocument();
    expect(screen.queryByText('View on Solana Explorer')).not.toBeInTheDocument();
  });
});
