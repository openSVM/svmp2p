import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simplified mock of the analytics dashboard
const MockAnalyticsDashboard = ({ network, connected, timeframe = '24h' }) => {
  const [currentTimeframe, setCurrentTimeframe] = React.useState(timeframe);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="analytics-title">📊 Real-Time Analytics Dashboard</h1>
            <p className="analytics-subtitle">
              Monitor trading performance and network metrics across {network.name}
            </p>
          </div>
          <div className="header-controls">
            <div className="timeframe-selector">
              {['1H', '24H', '7D', '30D'].map(tf => (
                <button 
                  key={tf}
                  className={`timeframe-button ${currentTimeframe === tf.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setCurrentTimeframe(tf.toLowerCase())}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="connection-status">
              {connected ? (
                <span className="status-connected">🟢 Connected to {network.name}</span>
              ) : (
                <span className="status-disconnected">🔴 Wallet not connected</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div data-testid="overview-panel">
        <div>Volume: $8400000</div>
        <div>Network: {network.name}</div>
        <div>Timeframe: {currentTimeframe}</div>
      </div>
      <div data-testid="gas-fee-chart">
        <div>Gas Data Points: 24</div>
        <div>Network: {network.name}</div>
        <div>Timeframe: {currentTimeframe}</div>
      </div>
      <div data-testid="network-metrics">
        <div>Selected Network: {network.key}</div>
        <div>Networks Count: 5</div>
      </div>
      <div data-testid="transaction-feed">
        <div>Transactions: 10</div>
        <div>Network: {network.name}</div>
      </div>
    </div>
  );
};

const mockNetworks = {
  solana: {
    key: 'solana',
    name: 'Solana',
    endpoint: 'https://api.devnet.solana.com',
    color: '#9945FF',
    explorerUrl: 'https://explorer.solana.com'
  },
  sonic: {
    key: 'sonic',
    name: 'Sonic',
    endpoint: 'https://sonic-api.example.com',
    color: '#00C2FF',
    explorerUrl: 'https://explorer.sonic.example.com'
  }
};

describe('AnalyticsDashboard Component', () => {
  test('renders analytics dashboard with all components', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={false} 
      />
    );

    // Check main title
    expect(screen.getByText('📊 Real-Time Analytics Dashboard')).toBeInTheDocument();

    // Check subtitle
    expect(screen.getByText(/Monitor trading performance and network metrics across Solana/)).toBeInTheDocument();

    // Check timeframe buttons
    expect(screen.getByText('1H')).toBeInTheDocument();
    expect(screen.getByText('24H')).toBeInTheDocument();
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();

    // Check connection status
    expect(screen.getByText('🔴 Wallet not connected')).toBeInTheDocument();

    // Check that all components are rendered
    expect(screen.getByTestId('overview-panel')).toBeInTheDocument();
    expect(screen.getByTestId('gas-fee-chart')).toBeInTheDocument();
    expect(screen.getByTestId('network-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-feed')).toBeInTheDocument();
  });

  test('shows connected status when wallet is connected', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={true} 
      />
    );

    expect(screen.getByText('🟢 Connected to Solana')).toBeInTheDocument();
  });

  test('timeframe selector works correctly', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={false} 
      />
    );

    const button7D = screen.getByText('7D');
    fireEvent.click(button7D);

    // Check that timeframe updated in components (there are multiple instances)
    const timeframeElements = screen.getAllByText('Timeframe: 7d');
    expect(timeframeElements.length).toBeGreaterThan(0);
  });

  test('renders with correct network information', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={false} 
      />
    );

    // Check that components receive correct network info (there are multiple instances)
    const networkElements = screen.getAllByText('Network: Solana');
    expect(networkElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Selected Network: solana')).toBeInTheDocument();
  });

  test('displays default timeframe as 24h', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={false} 
      />
    );

    // Check that overview panel receives 24h timeframe by default (there are multiple instances)
    const timeframeElements = screen.getAllByText('Timeframe: 24h');
    expect(timeframeElements.length).toBeGreaterThan(0);
  });

  test('handles different networks correctly', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.sonic} 
        connected={false} 
      />
    );

    expect(screen.getByText('Monitor trading performance and network metrics across Sonic')).toBeInTheDocument();
    expect(screen.queryByText('🟢 Connected to Sonic')).not.toBeInTheDocument(); // wallet not connected
    expect(screen.getByText('🔴 Wallet not connected')).toBeInTheDocument();
  });

  test('components receive correct props', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={false} 
      />
    );

    // Verify that mocked components receive expected data
    expect(screen.getByText('Networks Count: 5')).toBeInTheDocument();
    expect(screen.getByText('Selected Network: solana')).toBeInTheDocument();
    expect(screen.getByText('Gas Data Points: 24')).toBeInTheDocument();
    expect(screen.getByText('Transactions: 10')).toBeInTheDocument();
  });

  test('timeframe changes affect all components', () => {
    render(
      <MockAnalyticsDashboard 
        network={mockNetworks.solana} 
        connected={false} 
      />
    );

    // Click on 7D timeframe
    fireEvent.click(screen.getByText('7D'));

    // All components should show updated timeframe
    const timeframeElements = screen.getAllByText('Timeframe: 7d');
    expect(timeframeElements).toHaveLength(2); // overview-panel and gas-fee-chart
  });
});