import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import PropertyValueTable from '../common/PropertyValueTable';

/**
 * TradingStats component displays the user's trading statistics
 */
const TradingStats = ({ stats }) => {
  const router = useRouter();

  // Handle navigation to detailed analytics
  const handleViewDetailedAnalytics = () => {
    router.push('/analytics');
  };
  // Prepare trading statistics data for PropertyValueTable
  const tradingStatsData = [
    { property: 'TOTAL TRADES', value: stats.totalTrades || 0 },
    { property: 'SUCCESSFUL TRADES', value: stats.successfulTrades || 0, badge: 'SUCCESS', badgeClassName: 'badge-success' },
    { property: 'COMPLETION RATE', value: `${stats.completionRate || 0}%`, valueClassName: 'completion-rate' },
    { property: 'TOTAL VOLUME', value: `$${stats.totalVolume?.toFixed(2) || '0.00'}`, valueClassName: 'total-volume' },
    { property: 'BUY ORDERS', value: stats.buyOrders || 0, description: `${((stats.buyOrders / stats.totalTrades) * 100).toFixed(1)}% of total trades` },
    { property: 'SELL ORDERS', value: stats.sellOrders || 0, description: `${((stats.sellOrders / stats.totalTrades) * 100).toFixed(1)}% of total trades` },
    { property: 'DISPUTED TRADES', value: stats.disputedTrades || 0, badge: stats.disputedTrades > 0 ? 'DISPUTED' : null, badgeClassName: 'badge-warning' },
    { property: 'CANCELLED TRADES', value: stats.cancelledTrades || 0, badge: stats.cancelledTrades > 0 ? 'CANCELLED' : null, badgeClassName: 'badge-error' },
  ];

  // Prepare performance metrics data
  const performanceData = [
    { property: 'AVERAGE RESPONSE TIME', value: stats.averageResponseTime || 'N/A' },
    { 
      property: 'RESPONSE TIME RATING', 
      value: stats.responseTimeRating?.toUpperCase() || 'AVERAGE',
      badge: stats.responseTimeRating?.toUpperCase() || 'AVERAGE',
      badgeClassName: `rating-${stats.responseTimeRating || 'average'}`
    },
    { property: 'STATISTICS PERIOD START', value: stats.periodStart || '30 days ago' },
    { property: 'STATISTICS PERIOD END', value: stats.periodEnd || 'Today' },
  ];

  const statsActions = (
    <button 
      className="button button-ghost button-sm ascii-button-animate" 
      onClick={handleViewDetailedAnalytics}
    >
      VIEW DETAILED ANALYTICS
    </button>
  );

  return (
    <div className="trading-stats">
      <PropertyValueTable
        title="Trading Statistics"
        data={tradingStatsData}
        className="trading-stats-table"
      />
      
      <PropertyValueTable
        title="Performance Metrics"
        data={performanceData}
        actions={statsActions}
        className="performance-metrics-table"
      />
    </div>
  );
};

TradingStats.propTypes = {
  stats: PropTypes.shape({
    totalTrades: PropTypes.number,
    successfulTrades: PropTypes.number,
    completionRate: PropTypes.number,
    totalVolume: PropTypes.number,
    buyOrders: PropTypes.number,
    sellOrders: PropTypes.number,
    disputedTrades: PropTypes.number,
    cancelledTrades: PropTypes.number,
    averageResponseTime: PropTypes.string,
    responseTimeRating: PropTypes.string,
    periodStart: PropTypes.string,
    periodEnd: PropTypes.string,
  }),
};

TradingStats.defaultProps = {
  stats: {
    totalTrades: 0,
    successfulTrades: 0,
    completionRate: 0,
    totalVolume: 0,
    buyOrders: 0,
    sellOrders: 0,
    disputedTrades: 0,
    cancelledTrades: 0,
    averageResponseTime: 'N/A',
    responseTimeRating: 'average',
    periodStart: '30 days ago',
    periodEnd: 'Today',
  },
};

export default TradingStats;
