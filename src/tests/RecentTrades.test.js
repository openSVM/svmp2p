import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecentTrades from '@/components/analytics/RecentTrades';

const mockNetwork = {
  name: 'Solana',
  color: '#9945FF'
};

const mockTrades = [
  {
    tradeId: 'T123456_001',
    type: 'buy',
    status: 'completed',
    buyer: 'abc123def456',
    seller: 'xyz789uvw012',
    solAmount: 5.25,
    fiatAmount: 787.5,
    currency: 'USD',
    rate: 150,
    timestamp: new Date('2025-01-29T04:00:00Z'),
    completionTime: '12min',
    protocolFee: 0.02625
  },
  {
    tradeId: 'T123456_002',
    type: 'sell',
    status: 'in_progress',
    buyer: 'def456abc123',
    seller: 'uvw012xyz789',
    solAmount: 2.5,
    fiatAmount: 375,
    currency: 'USD',
    rate: 150,
    timestamp: new Date('2025-01-29T03:45:00Z'),
    completionTime: null,
    protocolFee: 0.0125
  },
  {
    tradeId: 'T123456_003',
    type: 'buy',
    status: 'cancelled',
    buyer: 'ghi789jkl012',
    seller: 'mno345pqr678',
    solAmount: 1.0,
    fiatAmount: 150,
    currency: 'USD',
    rate: 150,
    timestamp: new Date('2025-01-29T03:30:00Z'),
    completionTime: null,
    protocolFee: 0.005
  }
];

describe('RecentTrades', () => {
  test('renders recent trades feed with all trades', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Check title
    expect(screen.getByText('Recent Protocol Trades')).toBeInTheDocument();

    // Check trade count
    expect(screen.getByText('3 trades')).toBeInTheDocument();

    // Check filter buttons
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Disputed')).toBeInTheDocument();

    // Check search box
    expect(screen.getByPlaceholderText('Search trades...')).toBeInTheDocument();

    // Check that all trade IDs are displayed
    expect(screen.getByText('T123456_001')).toBeInTheDocument();
    expect(screen.getByText('T123456_002')).toBeInTheDocument();
    expect(screen.getByText('T123456_003')).toBeInTheDocument();

    // Check trade types
    expect(screen.getAllByText('BUY')).toHaveLength(2);
    expect(screen.getByText('SELL')).toBeInTheDocument();

    // Check amounts
    expect(screen.getByText('5.2500 SOL')).toBeInTheDocument();
    expect(screen.getByText('2.5000 SOL')).toBeInTheDocument();
    expect(screen.getByText('1.0000 SOL')).toBeInTheDocument();
  });

  test('filters trades by status', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Click on Completed filter
    fireEvent.click(screen.getByText('Completed'));

    // Should only show completed trades
    expect(screen.getByText('1 trades')).toBeInTheDocument();
    expect(screen.getByText('T123456_001')).toBeInTheDocument();
    expect(screen.queryByText('T123456_002')).not.toBeInTheDocument();
    expect(screen.queryByText('T123456_003')).not.toBeInTheDocument();
  });

  test('filters trades by in progress status', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Click on In Progress filter
    fireEvent.click(screen.getByText('In Progress'));

    // Should only show in progress trades
    expect(screen.getByText('1 trades')).toBeInTheDocument();
    expect(screen.getByText('T123456_002')).toBeInTheDocument();
    expect(screen.queryByText('T123456_001')).not.toBeInTheDocument();
    expect(screen.queryByText('T123456_003')).not.toBeInTheDocument();
  });

  test('searches trades by trade ID', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: '001' } });

    // Should show trades matching the search
    expect(screen.getByText('1 trades')).toBeInTheDocument();
    expect(screen.getByText('T123456_001')).toBeInTheDocument();
    expect(screen.queryByText('T123456_002')).not.toBeInTheDocument();
    expect(screen.queryByText('T123456_003')).not.toBeInTheDocument();
  });

  test('searches trades by type', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: 'sell' } });

    // Should show trades matching the type
    expect(screen.getByText('1 trades')).toBeInTheDocument();
    expect(screen.getByText('T123456_002')).toBeInTheDocument();
    expect(screen.queryByText('T123456_001')).not.toBeInTheDocument();
    expect(screen.queryByText('T123456_003')).not.toBeInTheDocument();
  });

  test('searches trades by participant address', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: 'abc123' } });

    // Should show trades with matching buyer or seller
    expect(screen.getByText('2 trades')).toBeInTheDocument();
    expect(screen.getByText('T123456_001')).toBeInTheDocument();  // buyer abc123def456
    expect(screen.getByText('T123456_002')).toBeInTheDocument();  // seller uvw012xyz789 -> buyer def456abc123
    expect(screen.queryByText('T123456_003')).not.toBeInTheDocument();
  });

  test('combines filter and search', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Apply completed filter first
    fireEvent.click(screen.getByText('Completed'));
    
    // Then search for 'buy'
    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: 'buy' } });

    // Should show only completed buy trades
    expect(screen.getByText('1 trades')).toBeInTheDocument();
    expect(screen.getByText('T123456_001')).toBeInTheDocument();
  });

  test('shows empty state when no trades match filters', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No trades match your filters')).toBeInTheDocument();
  });

  test('displays correct status icons', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Check for status icons (ASCII style)
    expect(screen.getByText('[C]')).toBeInTheDocument(); // completed
    expect(screen.getByText('[P]')).toBeInTheDocument(); // in_progress
    expect(screen.getByText('[X]')).toBeInTheDocument(); // cancelled
  });

  test('displays correct trade type icons', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Check for trade type icons (ASCII style)
    expect(screen.getAllByText('[B]')).toHaveLength(2); // buy trades
    expect(screen.getByText('[S]')).toBeInTheDocument(); // sell trade
  });

  test('shows completion time only for completed trades', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Completed trade should show completion time
    expect(screen.getByText('Completed in 12min')).toBeInTheDocument();
    
    // In progress and cancelled trades should not show completion time
    const completionTimes = screen.queryAllByText(/Completed in/);
    expect(completionTimes).toHaveLength(1);
  });

  test('displays fiat amounts and exchange rates', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Check fiat amounts
    expect(screen.getByText('$787.5')).toBeInTheDocument(); // Exact value, no rounding
    expect(screen.getByText('$375')).toBeInTheDocument();
    expect(screen.getByText('$150')).toBeInTheDocument();

    // Check exchange rates
    expect(screen.getAllByText('Rate: $150/SOL')).toHaveLength(3);
  });

  test('displays protocol fees', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Check protocol fees (using toFixed(4) which truncates, not rounds)
    expect(screen.getByText('Fee: 0.0262 SOL')).toBeInTheDocument(); // 0.02625 truncated to 0.0262
    expect(screen.getByText('Fee: 0.0125 SOL')).toBeInTheDocument();
    expect(screen.getByText('Fee: 0.0050 SOL')).toBeInTheDocument();
  });

  test('displays load more button and info', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    expect(screen.getByText('Load More Trades')).toBeInTheDocument();
    expect(screen.getByText('Showing last 100 protocol trades')).toBeInTheDocument();
  });

  test('displays participant addresses correctly formatted', () => {
    render(
      <RecentTrades 
        trades={mockTrades} 
        network={mockNetwork} 
      />
    );

    // Check formatted addresses (first 6 chars + ... + last 4 chars)
    expect(screen.getByText('abc123...f456')).toBeInTheDocument();
    expect(screen.getByText('xyz789...w012')).toBeInTheDocument();
    expect(screen.getByText('def456...c123')).toBeInTheDocument();
    expect(screen.getByText('uvw012...z789')).toBeInTheDocument(); // Fixed: z789 not y789
  });
});