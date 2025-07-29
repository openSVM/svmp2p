import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OverviewPanel from '@/components/analytics/OverviewPanel';

const mockNetwork = {
  name: 'Solana',
  color: '#9945FF'
};

const mockData = {
  totalTrades: 1250,
  protocolVolume: 45000,
  totalFees: 67500,
  completionRate: 92.5,
  tradesChange: 8.2,
  volumeChange: 15.3,
  feesChange: 12.1,
  completionChange: 1.8
};

describe('OverviewPanel', () => {
  test('renders protocol overview panel with correct data', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    // Check title
    expect(screen.getByText('Protocol Trading Overview')).toBeInTheDocument();

    // Check live indicator
    expect(screen.getByText('Live')).toBeInTheDocument();

    // Check KPI values
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Total trades
    expect(screen.getByText('45.00K SOL')).toBeInTheDocument(); // Protocol volume
    expect(screen.getByText('$67.5K')).toBeInTheDocument(); // Total fees
    expect(screen.getByText('92.5%')).toBeInTheDocument(); // Completion rate

    // Check KPI labels
    expect(screen.getByText('Total Trades (24h)')).toBeInTheDocument();
    expect(screen.getByText('Protocol Volume (24h)')).toBeInTheDocument();
    expect(screen.getByText('Total Fees Collected')).toBeInTheDocument();
    expect(screen.getByText('Trade Completion Rate')).toBeInTheDocument();

    // Check protocol name
    expect(screen.getByText('svmp2p Protocol on Solana')).toBeInTheDocument();

    // Check last updated timestamp
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  test('formats large volume correctly', () => {
    const largeVolumeData = {
      ...mockData,
      protocolVolume: 2500000 // 2.5M SOL
    };

    render(
      <OverviewPanel 
        data={largeVolumeData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('2.50M SOL')).toBeInTheDocument();
  });

  test('formats large fees correctly', () => {
    const largeFeesData = {
      ...mockData,
      totalFees: 1500000 // $1.5M
    };

    render(
      <OverviewPanel 
        data={largeFeesData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('$1.5M')).toBeInTheDocument();
  });

  test('formats small volume correctly', () => {
    const smallVolumeData = {
      ...mockData,
      protocolVolume: 150.75 // 150.75 SOL
    };

    render(
      <OverviewPanel 
        data={smallVolumeData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('150.75 SOL')).toBeInTheDocument();
  });

  test('displays correct timeframe in labels', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="7d" 
      />
    );

    expect(screen.getByText('Total Trades (7d)')).toBeInTheDocument();
    expect(screen.getByText('Protocol Volume (7d)')).toBeInTheDocument();
  });

  test('displays protocol indicator with correct color', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    const protocolIndicator = screen.getByText('svmp2p Protocol on Solana').previousElementSibling;
    expect(protocolIndicator).toHaveStyle('background-color: rgb(153, 69, 255)');
  });

  test('handles zero values gracefully', () => {
    const zeroData = {
      totalTrades: 0,
      protocolVolume: 0,
      totalFees: 0,
      completionRate: 0,
      tradesChange: 0,
      volumeChange: 0,
      feesChange: 0,
      completionChange: 0
    };

    render(
      <OverviewPanel 
        data={zeroData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument(); // Total trades
    expect(screen.getByText('0.00 SOL')).toBeInTheDocument(); // Volume
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Fees
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Completion rate
  });

  test('displays change percentages correctly', () => {
    render(
      <OverviewPanel 
        data={mockData} 
        network={mockNetwork} 
        timeframe="24h" 
      />
    );

    expect(screen.getByText('+8%')).toBeInTheDocument(); // Trades change
    expect(screen.getByText('+15%')).toBeInTheDocument(); // Volume change
    expect(screen.getByText('+12%')).toBeInTheDocument(); // Fees change
    expect(screen.getByText('+2%')).toBeInTheDocument(); // Completion change
  });
});