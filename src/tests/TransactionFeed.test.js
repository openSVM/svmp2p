import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionFeed from '@/components/analytics/TransactionFeed';

const mockNetwork = {
  name: 'Solana',
  color: '#9945FF',
  explorerUrl: 'https://explorer.solana.com'
};

const mockTransactions = [
  {
    id: 'tx_1',
    hash: 'abc123...def456',
    type: 'swap',
    status: 'confirmed',
    amount: 100.5,
    network: 'solana',
    timestamp: new Date('2025-01-29T04:00:00Z'),
    confirmationTime: 2.5
  },
  {
    id: 'tx_2',
    hash: 'xyz789...uvw012',
    type: 'transfer',
    status: 'pending',
    amount: 50.25,
    network: 'solana',
    timestamp: new Date('2025-01-29T03:45:00Z'),
    confirmationTime: 0
  },
  {
    id: 'tx_3',
    hash: 'def456...abc123',
    type: 'trade',
    status: 'failed',
    amount: 75.75,
    network: 'solana',
    timestamp: new Date('2025-01-29T03:30:00Z'),
    confirmationTime: 0
  }
];

describe('TransactionFeed', () => {
  test('renders transaction feed with all transactions', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    // Check title
    expect(screen.getByText('Real-Time Transaction Feed')).toBeInTheDocument();

    // Check transaction count
    expect(screen.getByText('3 transactions')).toBeInTheDocument();

    // Check filter buttons
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    // Check search box
    expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();

    // Check that all transactions are displayed
    expect(screen.getByText('abc123...def456')).toBeInTheDocument();
    expect(screen.getByText('xyz789...uvw012')).toBeInTheDocument();
    expect(screen.getByText('def456...abc123')).toBeInTheDocument();

    // Check transaction types
    expect(screen.getByText('swap')).toBeInTheDocument();
    expect(screen.getByText('transfer')).toBeInTheDocument();
    expect(screen.getByText('trade')).toBeInTheDocument();

    // Check amounts
    expect(screen.getByText('100.5000 SOL')).toBeInTheDocument();
    expect(screen.getByText('50.2500 SOL')).toBeInTheDocument();
    expect(screen.getByText('75.7500 SOL')).toBeInTheDocument();
  });

  test('filters transactions by status', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    // Click on Confirmed filter
    fireEvent.click(screen.getByText('Confirmed'));

    // Should only show confirmed transactions
    expect(screen.getByText('1 transactions')).toBeInTheDocument();
    expect(screen.getByText('abc123...def456')).toBeInTheDocument();
    expect(screen.queryByText('xyz789...uvw012')).not.toBeInTheDocument();
    expect(screen.queryByText('def456...abc123')).not.toBeInTheDocument();
  });

  test('filters transactions by pending status', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    // Click on Pending filter
    fireEvent.click(screen.getByText('Pending'));

    // Should only show pending transactions
    expect(screen.getByText('1 transactions')).toBeInTheDocument();
    expect(screen.getByText('xyz789...uvw012')).toBeInTheDocument();
    expect(screen.queryByText('abc123...def456')).not.toBeInTheDocument();
    expect(screen.queryByText('def456...abc123')).not.toBeInTheDocument();
  });

  test('searches transactions by hash', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'abc123' } });

    // Should show transactions matching the search
    expect(screen.getByText('2 transactions')).toBeInTheDocument();
    expect(screen.getByText('abc123...def456')).toBeInTheDocument();
    expect(screen.getByText('def456...abc123')).toBeInTheDocument();
    expect(screen.queryByText('xyz789...uvw012')).not.toBeInTheDocument();
  });

  test('searches transactions by type', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'swap' } });

    // Should show transactions matching the type
    expect(screen.getByText('1 transactions')).toBeInTheDocument();
    expect(screen.getByText('abc123...def456')).toBeInTheDocument();
    expect(screen.queryByText('xyz789...uvw012')).not.toBeInTheDocument();
    expect(screen.queryByText('def456...abc123')).not.toBeInTheDocument();
  });

  test('combines filter and search', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    // Apply confirmed filter first
    fireEvent.click(screen.getByText('Confirmed'));
    
    // Then search for 'swap'
    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'swap' } });

    // Should show only confirmed swap transactions
    expect(screen.getByText('1 transactions')).toBeInTheDocument();
    expect(screen.getByText('abc123...def456')).toBeInTheDocument();
  });

  test('shows empty state when no transactions match filters', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No transactions match your filters')).toBeInTheDocument();
  });

  test('displays correct status icons', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    // Check for status icons (emojis)
    expect(screen.getByText('✅')).toBeInTheDocument(); // confirmed
    expect(screen.getByText('⏳')).toBeInTheDocument(); // pending
    expect(screen.getByText('❌')).toBeInTheDocument(); // failed
  });

  test('shows confirmation time only for confirmed transactions', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    // Confirmed transaction should show confirmation time
    expect(screen.getByText('2.5s')).toBeInTheDocument();
    
    // Pending and failed transactions should not show confirmation time
    const confirmationTimes = screen.queryAllByText(/^\d+\.\d+s$/);
    expect(confirmationTimes).toHaveLength(1);
  });

  test('renders explorer links correctly', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', 'https://explorer.solana.com/tx/abc123...def456');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('displays load more button', () => {
    render(
      <TransactionFeed 
        transactions={mockTransactions} 
        network={mockNetwork} 
      />
    );

    expect(screen.getByText('Load More Transactions')).toBeInTheDocument();
  });
});