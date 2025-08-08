import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { usePhantomWallet } from '@/contexts/PhantomWalletProvider';
import OverviewPanel from '@/components/analytics/OverviewPanel';
import RecentTrades from '@/components/analytics/RecentTrades';
import VolumePerDayChart from '@/components/analytics/VolumePerDayChart';
import TopTraders from '@/components/analytics/TopTraders';

export default function AnalyticsDashboard() {
  const { network, selectedNetwork, networks } = useContext(AppContext);
  const { connected, publicKey } = usePhantomWallet();
  const [timeframe, setTimeframe] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Real-time protocol data states
  const [protocolOverview, setProtocolOverview] = useState({
    totalTrades: 0,
    protocolVolume: 0,
    totalFees: 0,
    completionRate: 0,
    tradesChange: 0,
    volumeChange: 0,
    feesChange: 0,
    completionChange: 0
  });
  
  const [recentTrades, setRecentTrades] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [topTradersData, setTopTradersData] = useState([]);

  // Initialize real-time data fetching
  useEffect(() => {
    // Initial data fetch
    fetchAllProtocolData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchAllProtocolData, 5000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedNetwork, timeframe]);

  const fetchAllProtocolData = async () => {
    try {
      // Simulate API calls to fetch real-time protocol data
      await Promise.all([
        fetchProtocolOverview(),
        fetchRecentTradesData(),
        fetchVolumeData(),
        fetchTopTradersData()
      ]);
    } catch (error) {
      console.error('Error fetching protocol analytics data:', error);
    }
  };

  const fetchProtocolOverview = async () => {
    // Simulate fetching protocol overview metrics
    const mockData = {
      totalTrades: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 trades
      protocolVolume: Math.random() * 50000 + 10000, // 10K-60K SOL
      totalFees: Math.random() * 50000 + 5000, // $5K-$55K in fees
      completionRate: 85 + (Math.random() * 10), // 85-95%
      tradesChange: Math.random() * 20 - 5, // -5% to +15%
      volumeChange: Math.random() * 30 - 10, // -10% to +20%
      feesChange: Math.random() * 25 - 5, // -5% to +20%
      completionChange: Math.random() * 5 - 2 // -2% to +3%
    };
    setProtocolOverview(mockData);
  };

  const fetchRecentTradesData = async () => {
    // Simulate fetching recent protocol trades (last 100)
    const mockTrades = Array.from({ length: 100 }, (_, i) => {
      const tradeId = `T${Date.now().toString().slice(-6)}_${i.toString().padStart(3, '0')}`;
      const types = ['buy', 'sell'];
      const statuses = ['completed', 'in_progress', 'cancelled', 'disputed'];
      const currencies = ['USD', 'EUR', 'GBP'];
      
      const solAmount = Math.random() * 10 + 0.1; // 0.1-10 SOL
      const rate = 130 + (Math.random() * 40); // $130-170 per SOL
      const fiatAmount = solAmount * rate;
      
      return {
        tradeId,
        type: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        buyer: `${Math.random().toString(36).substring(2, 15)}`,
        seller: `${Math.random().toString(36).substring(2, 15)}`,
        solAmount,
        fiatAmount,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        rate,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7), // Last 7 days
        completionTime: Math.random() > 0.7 ? `${Math.floor(Math.random() * 30 + 5)}min` : null,
        protocolFee: solAmount * 0.005 // 0.5% protocol fee
      };
    });
    
    // Sort by timestamp, newest first
    mockTrades.sort((a, b) => b.timestamp - a.timestamp);
    setRecentTrades(mockTrades);
  };

  const fetchVolumeData = async () => {
    // Simulate fetching volume data based on timeframe
    let dataPointsCount;
    let timeIncrement;
    
    switch (timeframe) {
      case '1h':
        dataPointsCount = 60; // 60 minutes
        timeIncrement = 60 * 1000; // 1 minute
        break;
      case '24h':
        dataPointsCount = 24; // 24 hours
        timeIncrement = 60 * 60 * 1000; // 1 hour
        break;
      case '7d':
        dataPointsCount = 7; // 7 days
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '30d':
        dataPointsCount = 30; // 30 days
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day
        break;
      default:
        dataPointsCount = 24;
        timeIncrement = 60 * 60 * 1000;
    }

    const now = new Date();
    const volumePoints = Array.from({ length: dataPointsCount }, (_, i) => {
      const time = new Date(now.getTime() - (dataPointsCount - 1 - i) * timeIncrement);
      const baseVolume = 1000 + Math.random() * 5000; // Base volume
      const volume = baseVolume + Math.sin(i / 5) * 1000; // Add some wave pattern
      
      return {
        time: time.toISOString(),
        volume: Math.max(0, volume) // Ensure non-negative
      };
    });
    
    setVolumeData(volumePoints);
  };

  const fetchTopTradersData = async () => {
    // Simulate fetching top 100 traders data
    const mockTraders = Array.from({ length: 100 }, (_, i) => {
      const baseAddress = Math.random().toString(36).substring(2, 15);
      const address = `${baseAddress}...${Math.random().toString(36).substring(2, 6)}`;
      
      const tradeCount = Math.floor(Math.random() * 500) + 10; // 10-510 trades
      const volume = Math.random() * 100000 + 1000; // 1K-101K SOL
      const pnl = (Math.random() - 0.3) * 50000; // -15K to +35K (bias towards positive)
      const successRate = 60 + Math.random() * 35; // 60-95%
      
      return {
        address,
        tradeCount,
        volume,
        pnl,
        successRate,
        verified: Math.random() > 0.8 // 20% are verified
      };
    });
    
    setTopTradersData(mockTraders);
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
              Protocol Analytics Dashboard
            </h1>
            <p className="analytics-subtitle">
              Monitor svmp2p trading performance and user metrics on {network.name}
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
                  [ONLINE] {network.name}
                </span>
              ) : (
                <span className="status-disconnected">
                  [OFFLINE] WALLET NOT CONNECTED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* Protocol Overview Panel - KPI Summary */}
        <OverviewPanel 
          data={protocolOverview} 
          network={network}
          timeframe={timeframe}
        />

        <div className="analytics-grid">
          {/* Left Column - Volume Chart and Top Traders */}
          <div className="analytics-column-left">
            {/* Volume Per Day Chart */}
            <VolumePerDayChart 
              data={volumeData}
              network={network}
              timeframe={timeframe}
            />
            
            {/* Top Traders Rankings */}
            <TopTraders 
              tradersData={topTradersData}
            />
          </div>

          {/* Right Column - Recent Trades Feed */}
          <div className="analytics-column-right">
            <RecentTrades 
              trades={recentTrades}
              network={network}
            />
          </div>
        </div>
      </div>
    </div>
  );
}