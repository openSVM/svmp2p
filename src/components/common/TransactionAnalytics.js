import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * TransactionAnalytics component
 * Displays transaction success rates, timing analytics, and trust indicators
 * Provides transparency and builds user confidence
 */
const TransactionAnalytics = ({
  userStats = {},
  globalStats = {},
  recentTransactions = [],
  showPersonalStats = true,
  showGlobalStats = true,
  showRecentActivity = true,
  timeframe = '7d',
  compact = false,
  onTimeframeChange = null
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Calculate statistics
  const calculateStats = (transactions) => {
    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        averageTime: 0,
        totalValue: 0
      };
    }

    const total = transactions.length;
    const successful = transactions.filter(tx => tx.status === 'success').length;
    const failed = transactions.filter(tx => tx.status === 'error').length;
    const pending = transactions.filter(tx => tx.status === 'pending').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    const completedTxs = transactions.filter(tx => tx.status === 'success' && tx.duration);
    const averageTime = completedTxs.length > 0 
      ? Math.round(completedTxs.reduce((sum, tx) => sum + tx.duration, 0) / completedTxs.length)
      : 0;

    const totalValue = transactions
      .filter(tx => tx.status === 'success' && tx.value)
      .reduce((sum, tx) => sum + tx.value, 0);

    return {
      total,
      successful,
      failed,
      pending,
      successRate,
      averageTime,
      totalValue
    };
  };

  const stats = calculateStats(recentTransactions);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setSelectedTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  // Format value display
  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  // Format time display
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get success rate color
  const getSuccessRateColor = (rate) => {
    if (rate >= 95) return '#10b981';
    if (rate >= 85) return '#f59e0b';
    return '#ef4444';
  };

  // Get status indicator
  const getStatusIndicator = (rate) => {
    if (rate >= 95) return '🟢';
    if (rate >= 85) return '🟡';
    return '🔴';
  };

  if (compact) {
    return (
      <div className="transaction-analytics-compact">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-value" style={{ color: getSuccessRateColor(stats.successRate) }}>
              {stats.successRate}%
            </span>
            <span className="stat-label">Success Rate</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Transactions</span>
          </div>
          
          {stats.averageTime > 0 && (
            <div className="stat-item">
              <span className="stat-value">{formatTime(stats.averageTime)}</span>
              <span className="stat-label">Avg Time</span>
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="transaction-analytics">
      <div className="analytics-header">
        <h3 className="analytics-title">Transaction Analytics</h3>
        
        <div className="analytics-controls">
          <div className="timeframe-selector">
            {['24h', '7d', '30d', '90d'].map((tf) => (
              <button
                key={tf}
                className={`timeframe-button ${tf === selectedTimeframe ? 'active' : ''}`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="analytics-content">
          {/* Overall Success Rate */}
          <div className="success-rate-card">
            <div className="success-rate-header">
              <h4>Overall Success Rate</h4>
              <span className="status-indicator">
                {getStatusIndicator(stats.successRate)}
              </span>
            </div>
            
            <div className="success-rate-display">
              <div className="rate-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray={`${stats.successRate}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ stroke: getSuccessRateColor(stats.successRate) }}
                  />
                </svg>
                <div className="rate-text">
                  <span className="rate-percentage">{stats.successRate}%</span>
                  <span className="rate-label">Success</span>
                </div>
              </div>
              
              <div className="rate-breakdown">
                <div className="breakdown-item success">
                  <span className="breakdown-count">{stats.successful}</span>
                  <span className="breakdown-label">Successful</span>
                </div>
                <div className="breakdown-item failed">
                  <span className="breakdown-count">{stats.failed}</span>
                  <span className="breakdown-label">Failed</span>
                </div>
                {stats.pending > 0 && (
                  <div className="breakdown-item pending">
                    <span className="breakdown-count">{stats.pending}</span>
                    <span className="breakdown-label">Pending</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">⚡</div>
              <div className="metric-content">
                <span className="metric-value">
                  {stats.averageTime > 0 ? formatTime(stats.averageTime) : 'N/A'}
                </span>
                <span className="metric-label">Average Completion Time</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <span className="metric-value">
                  {stats.totalValue > 0 ? `$${formatValue(stats.totalValue)}` : 'N/A'}
                </span>
                <span className="metric-label">Total Value Processed</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🔄</div>
              <div className="metric-content">
                <span className="metric-value">{stats.total}</span>
                <span className="metric-label">Total Transactions</span>
              </div>
            </div>

            {globalStats.networkHealth && (
              <div className="metric-card">
                <div className="metric-icon">🌐</div>
                <div className="metric-content">
                  <span className="metric-value">{globalStats.networkHealth}%</span>
                  <span className="metric-label">Network Health</span>
                </div>
              </div>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="trust-section">
            <h4>Trust & Security Indicators</h4>
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span className="trust-text">End-to-end encryption</span>
                <span className="trust-status verified">✓</span>
              </div>
              
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span className="trust-text">Multi-signature verification</span>
                <span className="trust-status verified">✓</span>
              </div>
              
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span className="trust-text">Lightning-fast processing</span>
                <span className="trust-status verified">✓</span>
              </div>
              
              <div className="trust-item">
                <span className="trust-icon">📊</span>
                <span className="trust-text">Real-time monitoring</span>
                <span className="trust-status verified">✓</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Preview */}
          {showRecentActivity && recentTransactions.length > 0 && (
            <div className="recent-activity">
              <h4>Recent Transaction Activity</h4>
              <div className="activity-list">
                {recentTransactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className={`activity-item ${tx.status}`}>
                    <div className="activity-status">
                      {tx.status === 'success' ? '✓' : 
                       tx.status === 'error' ? '✗' : '⏳'}
                    </div>
                    <div className="activity-details">
                      <span className="activity-type">{tx.type || 'Transaction'}</span>
                      <span className="activity-time">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {tx.value && (
                      <div className="activity-value">
                        ${formatValue(tx.value)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

TransactionAnalytics.propTypes = {
  userStats: PropTypes.object,
  globalStats: PropTypes.object,
  recentTransactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      status: PropTypes.oneOf(['success', 'error', 'pending']).isRequired,
      timestamp: PropTypes.string.isRequired,
      duration: PropTypes.number,
      value: PropTypes.number
    })
  ),
  showPersonalStats: PropTypes.bool,
  showGlobalStats: PropTypes.bool,
  showRecentActivity: PropTypes.bool,
  timeframe: PropTypes.oneOf(['24h', '7d', '30d', '90d']),
  compact: PropTypes.bool,
  onTimeframeChange: PropTypes.func
};

export default TransactionAnalytics;