import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionAnalytics from '../components/common/TransactionAnalytics';

describe('TransactionAnalytics', () => {
  const mockTransactions = [
    {
      id: '1',
      type: 'Buy Order',
      status: 'success',
      timestamp: '2024-01-01T12:00:00Z',
      duration: 30,
      value: 1000
    },
    {
      id: '2',
      type: 'Sell Order',
      status: 'success',
      timestamp: '2024-01-01T12:30:00Z',
      duration: 45,
      value: 1500
    },
    {
      id: '3',
      type: 'Transfer',
      status: 'error',
      timestamp: '2024-01-01T13:00:00Z',
      duration: 0,
      value: 0
    },
    {
      id: '4',
      type: 'Buy Order',
      status: 'pending',
      timestamp: '2024-01-01T13:30:00Z',
      value: 500
    }
  ];

  test('renders with basic props', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    expect(screen.getByText('Transaction Analytics')).toBeInTheDocument();
    expect(screen.getByText('Overall Success Rate')).toBeInTheDocument();
  });

  test('renders in compact mode', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        compact={true}
      />
    );

    // Should show compact stats
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Total transactions
    
    // Should not show full analytics title
    expect(screen.queryByText('Transaction Analytics')).not.toBeInTheDocument();
  });

  test('calculates success rate correctly', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    // 2 successful out of 4 total = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('displays transaction breakdown', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    const successfulCount = screen.getAllByText('2')[0]; // First occurrence should be successful count
    const failedCount = screen.getAllByText('1')[0]; // First occurrence should be failed count
    
    expect(successfulCount).toBeInTheDocument();
    expect(failedCount).toBeInTheDocument();
    expect(screen.getByText('Successful')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  test('shows pending transactions when present', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('calculates and displays average time', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    // Average of 30s and 45s = 37.5s, rounded to 38s
    expect(screen.getByText('38s')).toBeInTheDocument();
  });

  test('displays total value processed', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    // Total value: 1000 + 1500 = 2500 (only successful transactions)
    // Should find this in the metrics section specifically
    const totalValueElements = screen.getAllByText('$2.50K');
    expect(totalValueElements.length).toBeGreaterThan(0);
  });

  test('handles empty transactions array', () => {
    render(
      <TransactionAnalytics
        recentTransactions={[]}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument(); // Success rate
    // Check for total transactions count in the correct context
    const totalElements = screen.getAllByText('0');
    expect(totalElements.length).toBeGreaterThan(0); // Should find at least one "0"
  });

  test('shows trust indicators', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    expect(screen.getByText('End-to-end encryption')).toBeInTheDocument();
    expect(screen.getByText('Multi-signature verification')).toBeInTheDocument();
    expect(screen.getByText('Lightning-fast processing')).toBeInTheDocument();
    expect(screen.getByText('Real-time monitoring')).toBeInTheDocument();
  });

  test('displays recent activity when enabled', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        showRecentActivity={true}
      />
    );

    expect(screen.getByText('Recent Transaction Activity')).toBeInTheDocument();
    // Use getAllByText to handle multiple occurrences
    const buyOrderElements = screen.getAllByText('Buy Order');
    const sellOrderElements = screen.getAllByText('Sell Order');
    
    expect(buyOrderElements.length).toBeGreaterThan(0);
    expect(sellOrderElements.length).toBeGreaterThan(0);
  });

  test('limits recent activity to 5 items', () => {
    const manyTransactions = Array.from({ length: 10 }, (_, i) => ({
      id: `tx-${i}`,
      type: `Transaction ${i}`,
      status: 'success',
      timestamp: `2024-01-01T${12 + i}:00:00Z`,
      value: 100
    }));

    render(
      <TransactionAnalytics
        recentTransactions={manyTransactions}
        showRecentActivity={true}
      />
    );

    // Should only show first 5 transactions
    expect(screen.getByText('Transaction 0')).toBeInTheDocument();
    expect(screen.getByText('Transaction 4')).toBeInTheDocument();
    expect(screen.queryByText('Transaction 5')).not.toBeInTheDocument();
  });

  test('handles timeframe selection', () => {
    const mockTimeframeChange = jest.fn();

    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        onTimeframeChange={mockTimeframeChange}
      />
    );

    // Click on 30d timeframe
    fireEvent.click(screen.getByText('30d'));
    expect(mockTimeframeChange).toHaveBeenCalledWith('30d');
  });

  test('shows active timeframe', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        timeframe="30d"
      />
    );

    const timeframeButton = screen.getByText('30d').closest('button');
    expect(timeframeButton).toHaveClass('active');
  });

  test('toggles expanded/collapsed state', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
      />
    );

    // Initially expanded (not compact)
    expect(screen.getByText('Overall Success Rate')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByText('▲');
    fireEvent.click(collapseButton);

    // Should be collapsed now
    expect(screen.queryByText('Overall Success Rate')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByText('▼');
    fireEvent.click(expandButton);

    // Should be expanded again
    expect(screen.getByText('Overall Success Rate')).toBeInTheDocument();
  });

  test('formats large values correctly', () => {
    const highValueTransactions = [
      {
        id: '1',
        status: 'success',
        timestamp: '2024-01-01T12:00:00Z',
        value: 1500000 // 1.5M
      },
      {
        id: '2',
        status: 'success',
        timestamp: '2024-01-01T12:30:00Z',
        value: 500000 // 0.5M
      }
    ];

    render(
      <TransactionAnalytics
        recentTransactions={highValueTransactions}
      />
    );

    expect(screen.getByText('$2.0M')).toBeInTheDocument();
  });

  test('shows status indicators with correct colors', () => {
    const successfulTransactions = Array.from({ length: 19 }, (_, i) => ({
      id: `tx-${i}`,
      status: 'success',
      timestamp: '2024-01-01T12:00:00Z'
    })).concat([{
      id: 'tx-fail',
      status: 'error',
      timestamp: '2024-01-01T12:00:00Z'
    }]);

    const { container } = render(
      <TransactionAnalytics
        recentTransactions={successfulTransactions}
      />
    );

    // 19 successful out of 20 = 95% success rate (should be green)
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });

  test('shows network health when provided in global stats', () => {
    const globalStats = {
      networkHealth: 98
    };

    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        globalStats={globalStats}
        showGlobalStats={true}
      />
    );

    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('Network Health')).toBeInTheDocument();
  });

  test('shows N/A for undefined metrics', () => {
    const transactionsWithoutTiming = [
      {
        id: '1',
        status: 'success',
        timestamp: '2024-01-01T12:00:00Z'
        // No duration or value
      }
    ];

    render(
      <TransactionAnalytics
        recentTransactions={transactionsWithoutTiming}
      />
    );

    // Look for N/A in the metrics section
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0); // Should find at least one N/A
  });

  test('formats time correctly for different durations', () => {
    const transactions = [
      {
        id: '1',
        status: 'success',
        timestamp: '2024-01-01T12:00:00Z',
        duration: 45 // 45 seconds
      },
      {
        id: '2',
        status: 'success',
        timestamp: '2024-01-01T12:30:00Z',
        duration: 135 // 2m 15s
      }
    ];

    render(
      <TransactionAnalytics
        recentTransactions={transactions}
      />
    );

    // Average: (45 + 135) / 2 = 90 seconds = 1m 30s
    expect(screen.getByText('1m 30s')).toBeInTheDocument();
  });

  test('shows recent activity with transaction values', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        showRecentActivity={true}
      />
    );

    // Look for transaction values in the activity section
    const valueElements1 = screen.getAllByText('$1.00K');
    const valueElements2 = screen.getAllByText('$1.50K');
    
    expect(valueElements1.length).toBeGreaterThan(0); // First transaction value
    expect(valueElements2.length).toBeGreaterThan(0); // Second transaction value
  });

  test('shows correct status icons in recent activity', () => {
    render(
      <TransactionAnalytics
        recentTransactions={mockTransactions}
        showRecentActivity={true}
      />
    );

    // Should show checkmarks for successful transactions
    const successIcons = screen.getAllByText('✓');
    expect(successIcons.length).toBeGreaterThan(0);

    // Should show X for failed transactions
    expect(screen.getByText('✗')).toBeInTheDocument();

    // Should show hourglass for pending transactions
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });
});