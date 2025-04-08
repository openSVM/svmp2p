import React from 'react';
import PropTypes from 'prop-types';

/**
 * TradingStats component displays the user's trading statistics
 */
const TradingStats = ({ stats }) => {
  return (
    <div className="trading-stats card">
      <div className="card-header">
        <h3 className="card-title">Trading Statistics</h3>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.totalTrades || 0}</div>
          <div className="stat-label">Total Trades</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{stats.successfulTrades || 0}</div>
          <div className="stat-label">Successful</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{stats.completionRate || 0}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">${stats.totalVolume?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Total Volume</div>
        </div>
      </div>
      
      <div className="stats-details">
        <div className="stats-section">
          <h4>Trade Breakdown</h4>
          <div className="stats-bar-chart">
            <div className="stats-bar-item">
              <div className="stats-bar-label">Buy Orders</div>
              <div className="stats-bar-container">
                <div 
                  className="stats-bar stats-bar-buy" 
                  style={{ width: `${(stats.buyOrders / stats.totalTrades) * 100}%` }}
                ></div>
                <div className="stats-bar-value">{stats.buyOrders || 0}</div>
              </div>
            </div>
            
            <div className="stats-bar-item">
              <div className="stats-bar-label">Sell Orders</div>
              <div className="stats-bar-container">
                <div 
                  className="stats-bar stats-bar-sell" 
                  style={{ width: `${(stats.sellOrders / stats.totalTrades) * 100}%` }}
                ></div>
                <div className="stats-bar-value">{stats.sellOrders || 0}</div>
              </div>
            </div>
            
            <div className="stats-bar-item">
              <div className="stats-bar-label">Disputed</div>
              <div className="stats-bar-container">
                <div 
                  className="stats-bar stats-bar-disputed" 
                  style={{ width: `${(stats.disputedTrades / stats.totalTrades) * 100}%` }}
                ></div>
                <div className="stats-bar-value">{stats.disputedTrades || 0}</div>
              </div>
            </div>
            
            <div className="stats-bar-item">
              <div className="stats-bar-label">Cancelled</div>
              <div className="stats-bar-container">
                <div 
                  className="stats-bar stats-bar-cancelled" 
                  style={{ width: `${(stats.cancelledTrades / stats.totalTrades) * 100}%` }}
                ></div>
                <div className="stats-bar-value">{stats.cancelledTrades || 0}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-section">
          <h4>Response Time</h4>
          <div className="response-time-container">
            <div className="response-time-value">
              {stats.averageResponseTime || 'N/A'}
            </div>
            <div className="response-time-label">
              Average Response Time
            </div>
          </div>
          
          <div className="response-time-rating">
            {stats.responseTimeRating === 'excellent' && (
              <div className="rating-badge rating-excellent">Excellent</div>
            )}
            {stats.responseTimeRating === 'good' && (
              <div className="rating-badge rating-good">Good</div>
            )}
            {stats.responseTimeRating === 'average' && (
              <div className="rating-badge rating-average">Average</div>
            )}
            {stats.responseTimeRating === 'slow' && (
              <div className="rating-badge rating-slow">Slow</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="stats-footer">
        <div className="stats-period">
          Statistics from {stats.periodStart} to {stats.periodEnd}
        </div>
        
        <button className="button button-ghost button-sm">
          View Detailed Analytics
        </button>
      </div>
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
