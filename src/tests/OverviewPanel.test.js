import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OverviewPanel from '@/components/analytics/OverviewPanel';

const mockNetwork = {
  name: 'Solana',
  color: '#9945FF'
};

const mockData = {
  totalVolume: 8400000,
  avgConfirmationTime: 2.9,
  activeTransactions: 34,
  successRate: 96.4
};

describe('OverviewPanel', () => {
  test('renders overview panel with correct data', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    // Check title
    expect(screen.getByText('Trading Overview')).toBeInTheDocument();

    // Check live indicator
    expect(screen.getByText('Live')).toBeInTheDocument();

    // Check KPI values
    expect(screen.getByText('$8.4M')).toBeInTheDocument();
    expect(screen.getByText('2.9s')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
    expect(screen.getByText('96.4%')).toBeInTheDocument();

    // Check KPI labels
    expect(screen.getByText('Total Volume (24h)')).toBeInTheDocument();
    expect(screen.getByText('Avg Confirmation Time')).toBeInTheDocument();
    expect(screen.getByText('Active Transactions')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();

    // Check network name
    expect(screen.getByText('Solana Network')).toBeInTheDocument();

    // Check last updated timestamp
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  test('formats large numbers correctly', () => {
    const largeVolumeData = {
      ...mockData,
      totalVolume: 15000000 // $15M
    };

    render(
      <OverviewPanel 
        data={largeVolumeData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('$15.0M')).toBeInTheDocument();
  });

  test('formats small numbers correctly', () => {
    const smallVolumeData = {
      ...mockData,
      totalVolume: 1500 // $1.5K
    };

    render(
      <OverviewPanel 
        data={smallVolumeData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('$1.5K')).toBeInTheDocument();
  });

  test('formats very small numbers correctly', () => {
    const verySmallVolumeData = {
      ...mockData,
      totalVolume: 50.25
    };

    render(
      <OverviewPanel 
        data={verySmallVolumeData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('$50.25')).toBeInTheDocument();
  });

  test('displays correct timeframe in label', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="7d" 
      />
    );

    expect(screen.getByText('Total Volume (7d)')).toBeInTheDocument();
  });

  test('displays network indicator with correct color', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    const networkIndicator = screen.getByText('Solana Network').previousElementSibling;
    expect(networkIndicator).toHaveStyle('background-color: rgb(153, 69, 255)');
  });

  test('handles zero values gracefully', () => {
    const zeroData = {
      totalVolume: 0,
      avgConfirmationTime: 0,
      activeTransactions: 0,
      successRate: 0
    };

    render(
      <OverviewPanel 
        data={zeroData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('0.0s')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});