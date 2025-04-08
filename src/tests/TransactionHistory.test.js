import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionHistory from '../components/profile/TransactionHistory';

describe('TransactionHistory Component', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      type: 'Buy',
      solAmount: 5.5,
      fiatAmount: 250.75,
      fiatCurrency: 'USD',
      status: 'Completed',
      createdAt: '2025-04-08'
    },
    {
      id: 'tx-2',
      type: 'Sell',
      solAmount: 2.3,
      fiatAmount: 105.25,
      fiatCurrency: 'USD',
      status: 'Pending',
      createdAt: '2025-04-07'
    },
    {
      id: 'tx-3',
      type: 'Deposit',
      solAmount: 10.0,
      fiatAmount: 450.00,
      fiatCurrency: 'USD',
      status: 'Completed',
      createdAt: '2025-04-06'
    },
    {
      id: 'tx-4',
      type: 'Buy',
      solAmount: 1.2,
      fiatAmount: 55.80,
      fiatCurrency: 'USD',
      status: 'Cancelled',
      createdAt: '2025-04-05'
    },
    {
      id: 'tx-5',
      type: 'Withdrawal',
      solAmount: 3.7,
      fiatAmount: 170.20,
      fiatCurrency: 'USD',
      status: 'Completed',
      createdAt: '2025-04-04'
    },
    {
      id: 'tx-6',
      type: 'Sell',
      solAmount: 4.1,
      fiatAmount: 189.40,
      fiatCurrency: 'EUR',
      status: 'Disputed',
      createdAt: '2025-04-03'
    }
  ];

  test('renders with no transactions', () => {
    render(<TransactionHistory transactions={[]} />);
    
    expect(screen.getByText('No transactions found.')).toBeInTheDocument();
  });

  test('renders transaction list correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />);
    
    // Check if table headers are displayed
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Fiat')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    
    // Check if first transaction is displayed
    expect(screen.getByText('5.50 SOL')).toBeInTheDocument();
    expect(screen.getByText('250.75 USD')).toBeInTheDocument();
    
    // Check if pagination info is displayed (since we have 6 transactions and page size is 5)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  test('filters transactions by type', () => {
    render(<TransactionHistory transactions={mockTransactions} />);
    
    // Select Buy filter
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'buy' } });
    
    // Check if only Buy transactions are displayed
    expect(screen.getByText('5.50 SOL')).toBeInTheDocument();
    expect(screen.getByText('1.20 SOL')).toBeInTheDocument();
    expect(screen.queryByText('2.30 SOL')).not.toBeInTheDocument(); // Sell transaction
    
    // Select Sell filter
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sell' } });
    
    // Check if only Sell transactions are displayed
    expect(screen.getByText('2.30 SOL')).toBeInTheDocument();
    expect(screen.getByText('4.10 SOL')).toBeInTheDocument();
    expect(screen.queryByText('5.50 SOL')).not.toBeInTheDocument(); // Buy transaction
  });

  test('sorts transactions correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />);
    
    // Default sort is by date (newest first)
    const amountCells = screen.getAllByText(/\d+\.\d+ SOL/);
    expect(amountCells[0].textContent).toBe('5.50 SOL'); // First transaction
    
    // Click on Amount column to sort by amount
    fireEvent.click(screen.getByText('Amount'));
    
    // Now should be sorted by amount (highest first by default)
    const amountCellsAfterSort = screen.getAllByText(/\d+\.\d+ SOL/);
    expect(amountCellsAfterSort[0].textContent).toBe('10.00 SOL'); // Highest amount
    
    // Click again to reverse sort order
    fireEvent.click(screen.getByText('Amount'));
    
    // Now should be sorted by amount (lowest first)
    const amountCellsAfterReverseSort = screen.getAllByText(/\d+\.\d+ SOL/);
    expect(amountCellsAfterReverseSort[0].textContent).toBe('1.20 SOL'); // Lowest amount
  });

  test('searches transactions correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />);
    
    // Search for EUR currency
    fireEvent.change(screen.getByPlaceholderText('Search transactions...'), { 
      target: { value: 'EUR' } 
    });
    
    // Should only show the transaction with EUR currency
    expect(screen.getByText('189.40 EUR')).toBeInTheDocument();
    expect(screen.queryByText('USD')).not.toBeInTheDocument();
    
    // Search for Disputed status
    fireEvent.change(screen.getByPlaceholderText('Search transactions...'), { 
      target: { value: 'Disputed' } 
    });
    
    // Should only show the disputed transaction
    expect(screen.getByText('Disputed')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  test('paginates transactions correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />);
    
    // First page should show first 5 transactions
    expect(screen.getByText('5.50 SOL')).toBeInTheDocument(); // tx-1
    expect(screen.queryByText('4.10 SOL')).not.toBeInTheDocument(); // tx-6 (on page 2)
    
    // Go to next page
    fireEvent.click(screen.getByLabelText('Next page'));
    
    // Second page should show the 6th transaction
    expect(screen.queryByText('5.50 SOL')).not.toBeInTheDocument(); // tx-1 (on page 1)
    expect(screen.getByText('4.10 SOL')).toBeInTheDocument(); // tx-6
    
    // Go back to first page
    fireEvent.click(screen.getByLabelText('Previous page'));
    
    // First page should show first 5 transactions again
    expect(screen.getByText('5.50 SOL')).toBeInTheDocument(); // tx-1
    expect(screen.queryByText('4.10 SOL')).not.toBeInTheDocument(); // tx-6 (on page 2)
  });
});
