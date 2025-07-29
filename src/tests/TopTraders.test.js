import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopTraders from '@/components/analytics/TopTraders';

const mockTraders = [
  {
    address: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
    tradeCount: 150,
    volume: 25000,
    pnl: 5000,
    successRate: 95.5,
    verified: true
  },
  {
    address: 'def456ghi789jkl012mno345pqr678stu901vwx234yz567abc123',
    tradeCount: 120,
    volume: 18000,
    pnl: -2500,
    successRate: 87.3,
    verified: false
  },
  {
    address: 'ghi789jkl012mno345pqr678stu901vwx234yz567abc123def456',
    tradeCount: 98,
    volume: 15000,
    pnl: 3200,
    successRate: 92.1,
    verified: true
  }
];

describe('TopTraders', () => {
  test('renders top traders with PnL view by default', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // Check title
    expect(screen.getByText('Top Traders')).toBeInTheDocument();

    // Check view mode buttons
    expect(screen.getByText('By PnL')).toBeInTheDocument();
    expect(screen.getByText('By Volume')).toBeInTheDocument();

    // Check count selector
    expect(screen.getByDisplayValue('Top 10')).toBeInTheDocument();

    // Check header columns
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Trader')).toBeInTheDocument();
    expect(screen.getByText('Trades')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('PnL')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();

    // Check trader data is displayed
    expect(screen.getByText('abc123...r678')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('25.00K SOL')).toBeInTheDocument();
    expect(screen.getByText('+$5.00K')).toBeInTheDocument();
    expect(screen.getByText('95.5%')).toBeInTheDocument();
  });

  test('formats trader addresses correctly', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // Check that addresses are formatted as first 6 + ... + last 4
    expect(screen.getByText('abc123...r678')).toBeInTheDocument();
    expect(screen.getByText('def456...c123')).toBeInTheDocument();
    expect(screen.getByText('ghi789...f456')).toBeInTheDocument();
  });

  test('displays rank badges correctly', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // When sorted by PnL (default), should show rankings based on PnL
    expect(screen.getByText('🥇')).toBeInTheDocument(); // Top PnL trader
    expect(screen.getByText('🥈')).toBeInTheDocument(); // Second PnL trader
    expect(screen.getByText('🥉')).toBeInTheDocument(); // Third PnL trader
  });

  test('formats volume correctly', () => {
    render(<TopTraders tradersData={mockTraders} />);

    expect(screen.getByText('25.00K SOL')).toBeInTheDocument();
    expect(screen.getByText('18.00K SOL')).toBeInTheDocument();
    expect(screen.getByText('15.00K SOL')).toBeInTheDocument();
  });

  test('formats PnL correctly with positive and negative values', () => {
    render(<TopTraders tradersData={mockTraders} />);

    expect(screen.getByText('+$5.00K')).toBeInTheDocument(); // Positive PnL
    expect(screen.getByText('+$3.20K')).toBeInTheDocument(); // Positive PnL
    expect(screen.getByText('-$2.50K')).toBeInTheDocument(); // Negative PnL
  });

  test('shows verified badges for verified traders', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // Should show 2 verified badges (2 verified traders)
    const verifiedBadges = screen.getAllByText('✓');
    expect(verifiedBadges).toHaveLength(2);
  });

  test('switches to volume view when By Volume is clicked', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // Click on By Volume button
    fireEvent.click(screen.getByText('By Volume'));

    // Check that By Volume button is now active
    expect(screen.getByText('By Volume')).toHaveClass('active');
    expect(screen.getByText('By PnL')).not.toHaveClass('active');

    // Data should now be sorted by volume (highest volume trader should be first)
    const volumeValues = screen.getAllByText(/SOL$/);
    expect(volumeValues[0]).toHaveTextContent('25.00K SOL'); // Highest volume first
  });

  test('changes display count when selector is changed', () => {
    render(<TopTraders tradersData={mockTraders} />);

    const selector = screen.getByDisplayValue('Top 10');
    
    // Change to Top 50
    fireEvent.change(selector, { target: { value: '50' } });
    expect(selector.value).toBe('50');

    // Change to Top 100
    fireEvent.change(selector, { target: { value: '100' } });
    expect(selector.value).toBe('100');
  });

  test('displays success rate bars correctly', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // Check that success rates are displayed
    expect(screen.getByText('95.5%')).toBeInTheDocument();
    expect(screen.getByText('87.3%')).toBeInTheDocument();
    expect(screen.getByText('92.1%')).toBeInTheDocument();

    // Check that success bars exist (they have success-fill class)
    const successBars = document.querySelectorAll('.success-fill');
    expect(successBars).toHaveLength(3);
  });

  test('displays update information', () => {
    render(<TopTraders tradersData={mockTraders} />);

    expect(screen.getByText(/Updated every 30 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Showing \d+ of \d+ traders/)).toBeInTheDocument();
  });

  test('handles large volume numbers correctly', () => {
    const largeVolumeTraders = [
      {
        ...mockTraders[0],
        volume: 2500000 // 2.5M SOL
      }
    ];

    render(<TopTraders tradersData={largeVolumeTraders} />);

    expect(screen.getByText('2.50M SOL')).toBeInTheDocument();
  });

  test('handles large PnL numbers correctly', () => {
    const largePnLTraders = [
      {
        ...mockTraders[0],
        pnl: 1500000 // $1.5M profit
      }
    ];

    render(<TopTraders tradersData={largePnLTraders} />);

    expect(screen.getByText('+$1.50M')).toBeInTheDocument();
  });

  test('sorts traders correctly by PnL in descending order', () => {
    render(<TopTraders tradersData={mockTraders} />);

    // When sorted by PnL, the order should be: 5000, 3200, -2500
    const pnlValues = screen.getAllByText(/[+-]\$[\d.]+[KM]?/);
    expect(pnlValues[0]).toHaveTextContent('+$5.00K'); // Highest PnL first
    expect(pnlValues[1]).toHaveTextContent('+$3.20K'); // Second highest
    expect(pnlValues[2]).toHaveTextContent('-$2.50K'); // Lowest (negative) last
  });
});