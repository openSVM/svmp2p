import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { usePhantomWallet } from '@/contexts/PhantomWalletProvider';
import { useProgram } from '../hooks/useProgram';
import { useProgramStatistics, useOffers, useUserHistory } from '../hooks/useOnChainData';
import { useRealPriceData } from '../hooks/usePriceData';
import OverviewPanel from '@/components/analytics/OverviewPanel';
import RecentTrades from '@/components/analytics/RecentTrades';
import VolumePerDayChart from '@/components/analytics/VolumePerDayChart';
import TopTraders from '@/components/analytics/TopTraders';

export default function AnalyticsDashboard() {
  const { network, selectedNetwork, networks } = useContext(AppContext);
  const { connected, publicKey, connection } = usePhantomWallet();
  const [timeframe, setTimeframe] = useState('24h');
  
  // Initialize program with connection and wallet
  const program = useProgram(connection, { publicKey, signTransaction: () => {} });
  
  // Real blockchain data hooks
  const { statistics: programStats, loading: statsLoading, error: statsError } = useProgramStatistics(program);
  const { offers: allOffers, loading: offersLoading, error: offersError } = useOffers(program);
  const { prices: solPrices } = useRealPriceData();
  
  // Real-time protocol data states - derived from blockchain data
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

  // Process real blockchain data when it becomes available
  useEffect(() => {
    if (programStats && allOffers && solPrices) {
      // Only process data when real SOL price is available
      if (!solPrices.USD || solPrices.USD <= 0) {
        console.warn('Waiting for valid SOL price data from RPC...');
        return;
      }
      const solPrice = solPrices.USD;
      // Calculate protocol overview from real blockchain data
      const overview = calculateProtocolOverview(programStats, allOffers, solPrice);
      setProtocolOverview(overview);
      
      // Process recent trades from real offers
      const trades = processRecentTrades(allOffers, solPrice);
      setRecentTrades(trades);
      
      // Generate volume data from real offers
      const volume = calculateVolumeData(allOffers, timeframe, solPrice);
      setVolumeData(volume);
      
      // Calculate top traders from real reputation data
      const topTraders = calculateTopTraders(allOffers);
      setTopTradersData(topTraders);
    }
  }, [programStats, allOffers, solPrices, timeframe]);

  // Calculate protocol overview from real blockchain data
  const calculateProtocolOverview = (stats, offers, price) => {
    const completedOffers = offers.filter(offer => offer.status === 'Completed');
    const totalVolume = completedOffers.reduce((sum, offer) => sum + offer.solAmount, 0);
    const totalFiatValue = totalVolume * price;
    const totalFees = totalFiatValue * 0.005; // 0.5% protocol fee
    
    return {
      totalTrades: stats.offers.total,
      protocolVolume: totalVolume,
      totalFees: totalFees,
      completionRate: stats.offers.completionRate,
      tradesChange: 0, // Would need historical data to calculate
      volumeChange: 0, // Would need historical data to calculate  
      feesChange: 0, // Would need historical data to calculate
      completionChange: 0 // Would need historical data to calculate
    };
  };

  // Process real offers into recent trades format
  const processRecentTrades = (offers, price) => {
    return offers
      .filter(offer => offer.status !== 'Created')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 100)
      .map(offer => ({
        tradeId: offer.id.slice(-8),
        type: offer.buyer ? 'sell' : 'buy',
        status: offer.status.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase(),
        buyer: offer.buyer || 'pending',
        seller: offer.seller,
        solAmount: offer.solAmount,
        fiatAmount: offer.fiatAmount,
        currency: offer.fiatCurrency,
        rate: offer.solAmount > 0 ? offer.fiatAmount / offer.solAmount : 0,
        timestamp: new Date(offer.updatedAt),
        completionTime: offer.status === 'Completed' ? 
          `${Math.floor((offer.updatedAt - offer.createdAt) / 60000)}min` : null,
        protocolFee: offer.solAmount * 0.005
      }));
  };

  // Calculate volume data from real offers
  const calculateVolumeData = (offers, timeframe, price) => {
    const completedOffers = offers.filter(offer => offer.status === 'Completed');
    
    let dataPointsCount, timeIncrement;
    switch (timeframe) {
      case '1h':
        dataPointsCount = 60;
        timeIncrement = 60 * 1000;
        break;
      case '24h':
        dataPointsCount = 24;
        timeIncrement = 60 * 60 * 1000;
        break;
      case '7d':
        dataPointsCount = 7;
        timeIncrement = 24 * 60 * 60 * 1000;
        break;
      case '30d':
        dataPointsCount = 30;
        timeIncrement = 24 * 60 * 60 * 1000;
        break;
      default:
        dataPointsCount = 24;
        timeIncrement = 60 * 60 * 1000;
    }

    const now = new Date();
    const volumePoints = Array.from({ length: dataPointsCount }, (_, i) => {
      const timeStart = new Date(now.getTime() - (dataPointsCount - i) * timeIncrement);
      const timeEnd = new Date(timeStart.getTime() + timeIncrement);
      
      const volumeInPeriod = completedOffers
        .filter(offer => {
          const offerTime = new Date(offer.updatedAt);
          return offerTime >= timeStart && offerTime < timeEnd;
        })
        .reduce((sum, offer) => sum + offer.solAmount, 0);
      
      return {
        time: timeStart.toISOString(),
        volume: volumeInPeriod
      };
    });
    
    return volumePoints;
  };

  // Calculate top traders from real offer data
  const calculateTopTraders = (offers) => {
    const traderStats = {};
    
    offers.forEach(offer => {
      // Process seller stats
      if (!traderStats[offer.seller]) {
        traderStats[offer.seller] = {
          address: offer.seller,
          tradeCount: 0,
          volume: 0,
          successfulTrades: 0,
          disputedTrades: 0
        };
      }
      
      traderStats[offer.seller].tradeCount++;
      traderStats[offer.seller].volume += offer.solAmount;
      
      if (offer.status === 'Completed') {
        traderStats[offer.seller].successfulTrades++;
      } else if (offer.status === 'DisputeOpened') {
        traderStats[offer.seller].disputedTrades++;
      }
      
      // Process buyer stats if exists
      if (offer.buyer && offer.buyer !== 'pending') {
        if (!traderStats[offer.buyer]) {
          traderStats[offer.buyer] = {
            address: offer.buyer,
            tradeCount: 0,
            volume: 0,
            successfulTrades: 0,
            disputedTrades: 0
          };
        }
        
        traderStats[offer.buyer].tradeCount++;
        traderStats[offer.buyer].volume += offer.solAmount;
        
        if (offer.status === 'Completed') {
          traderStats[offer.buyer].successfulTrades++;
        } else if (offer.status === 'DisputeOpened') {
          traderStats[offer.buyer].disputedTrades++;
        }
      }
    });

    // Convert to array and calculate derived metrics
    return Object.values(traderStats)
      .map(trader => ({
        ...trader,
        successRate: trader.tradeCount > 0 ? 
          (trader.successfulTrades / trader.tradeCount) * 100 : 0,
        pnl: 0, // Would need more complex calculation with buy/sell price differences
        verified: false // Would need verification system
      }))
      .filter(trader => trader.tradeCount > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 100);
  };

  const timeframeOptions = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ];

  // Show loading state while fetching real blockchain data
  const isLoading = statsLoading || offersLoading;
  const hasError = statsError || offersError;

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
              {isLoading && " [LOADING BLOCKCHAIN DATA...]"}
              {hasError && " [ERROR LOADING DATA]"}
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
                  [ONLINE] {network.name} - BLOCKCHAIN DATA
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
        {/* Protocol Overview Panel - Real KPI Summary from Blockchain */}
        <OverviewPanel 
          data={protocolOverview} 
          network={network}
          timeframe={timeframe}
          loading={isLoading}
          error={hasError}
        />

        <div className="analytics-grid">
          {/* Left Column - Volume Chart and Top Traders */}
          <div className="analytics-column-left">
            {/* Volume Per Day Chart - Real Blockchain Data */}
            <VolumePerDayChart 
              data={volumeData}
              network={network}
              timeframe={timeframe}
              loading={isLoading}
            />
            
            {/* Top Traders Rankings - Real Blockchain Data */}
            <TopTraders 
              tradersData={topTradersData}
              loading={isLoading}
            />
          </div>

          {/* Right Column - Recent Trades Feed */}
          <div className="analytics-column-right">
            <RecentTrades 
              trades={recentTrades}
              network={network}
              loading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}