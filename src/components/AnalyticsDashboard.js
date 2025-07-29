import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { useSwigWallet } from '@/contexts/SwigWalletProvider';
import OverviewPanel from '@/components/analytics/OverviewPanel';
import TransactionFeed from '@/components/analytics/TransactionFeed';
import GasFeeChart from '@/components/analytics/GasFeeChart';
import NetworkMetrics from '@/components/analytics/NetworkMetrics';

export default function AnalyticsDashboard() {
  const { network, selectedNetwork, networks } = useContext(AppContext);
  const { connected, publicKey } = useSwigWallet();
  const [timeframe, setTimeframe] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Real-time data states
  const [overviewData, setOverviewData] = useState({
    totalVolume: 0,
    avgConfirmationTime: 0,
    activeTransactions: 0,
    successRate: 0
  });
  
  const [transactions, setTransactions] = useState([]);
  const [gasData, setGasData] = useState([]);
  const [networkStats, setNetworkStats] = useState({});

  // Initialize real-time data fetching
  useEffect(() => {
    // Initial data fetch
    fetchAllData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchAllData, 5000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedNetwork, timeframe]);

  const fetchAllData = async () => {
    try {
      // Simulate API calls to fetch real-time data
      // In a real implementation, these would be actual API calls or WebSocket connections
      await Promise.all([
        fetchOverviewData(),
        fetchTransactionData(),
        fetchGasData(),
        fetchNetworkMetrics()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const fetchOverviewData = async () => {
    // Simulate fetching overview metrics
    // In production, this would call your backend API
    const mockData = {
      totalVolume: Math.random() * 10000000, // Random volume
      avgConfirmationTime: 2.3 + (Math.random() * 2), // 2-4 seconds
      activeTransactions: Math.floor(Math.random() * 50) + 10,
      successRate: 95 + (Math.random() * 4) // 95-99%
    };
    setOverviewData(mockData);
  };

  const fetchTransactionData = async () => {
    // Simulate fetching recent transactions
    const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
      id: `tx_${Date.now()}_${i}`,
      hash: `${Math.random().toString(36).substring(2, 15)}...`,
      type: ['swap', 'transfer', 'trade'][Math.floor(Math.random() * 3)],
      status: ['confirmed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
      amount: Math.random() * 1000,
      network: selectedNetwork,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      confirmationTime: Math.random() * 5
    }));
    setTransactions(mockTransactions);
  };

  const fetchGasData = async () => {
    // Simulate fetching gas fee data for the last 24 hours
    const now = new Date();
    const gasPoints = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: time.toISOString(),
        fee: 0.00001 + (Math.random() * 0.00005), // Mock gas fees
        network: selectedNetwork
      };
    });
    setGasData(gasPoints);
  };

  const fetchNetworkMetrics = async () => {
    // Simulate fetching network-specific metrics
    const mockNetworkStats = {};
    Object.keys(networks).forEach(networkKey => {
      mockNetworkStats[networkKey] = {
        tps: Math.floor(Math.random() * 3000 + 1000), // Transactions per second
        blockTime: Math.random() * 2 + 0.4, // Block time in seconds
        activeValidators: Math.floor(Math.random() * 500 + 1000),
        networkHealth: Math.random() * 100
      };
    });
    setNetworkStats(mockNetworkStats);
  };

  const timeframeOptions = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="analytics-title">
              📊 Real-Time Analytics Dashboard
            </h1>
            <p className="analytics-subtitle">
              Monitor trading performance and network metrics across {network.name}
            </p>
          </div>
          
          <div className="header-controls">
            <div className="timeframe-selector">
              {timeframeOptions.map(option => (
                <button
                  key={option.value}
                  className={`timeframe-button ${timeframe === option.value ? 'active' : ''}`}
                  onClick={() => setTimeframe(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div className="connection-status">
              {connected ? (
                <span className="status-connected">
                  🟢 Connected to {network.name}
                </span>
              ) : (
                <span className="status-disconnected">
                  🔴 Wallet not connected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* Overview Panel - KPI Summary */}
        <OverviewPanel 
          data={overviewData} 
          network={network}
          timeframe={timeframe}
        />

        <div className="analytics-grid">
          {/* Left Column - Charts and Metrics */}
          <div className="analytics-column-left">
            {/* Gas Fee Trends Chart */}
            <GasFeeChart 
              data={gasData}
              network={network}
              timeframe={timeframe}
            />
            
            {/* Network Metrics */}
            <NetworkMetrics 
              stats={networkStats}
              networks={networks}
              selectedNetwork={selectedNetwork}
            />
          </div>

          {/* Right Column - Transaction Feed */}
          <div className="analytics-column-right">
            <TransactionFeed 
              transactions={transactions}
              network={network}
            />
          </div>
        </div>
      </div>
    </div>
  );
}