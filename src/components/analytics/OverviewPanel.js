import React from 'react';

export default function OverviewPanel({ data, network, timeframe }) {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatTime = (seconds) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatPercentage = (percent) => {
    return `${percent.toFixed(1)}%`;
  };

  return (
    <div className="overview-panel">
      <div className="panel-header">
        <h2 className="panel-title">Trading Overview</h2>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">Live</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card volume">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatNumber(data.totalVolume)}</div>
            <div className="kpi-label">Total Volume ({timeframe})</div>
            <div className="kpi-change positive">+12.3%</div>
          </div>
        </div>

        <div className="kpi-card confirmation">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatTime(data.avgConfirmationTime)}</div>
            <div className="kpi-label">Avg Confirmation Time</div>
            <div className="kpi-change negative">+0.2s</div>
          </div>
        </div>

        <div className="kpi-card transactions">
          <div className="kpi-icon">🔄</div>
          <div className="kpi-content">
            <div className="kpi-value">{data.activeTransactions}</div>
            <div className="kpi-label">Active Transactions</div>
            <div className="kpi-change positive">+5</div>
          </div>
        </div>

        <div className="kpi-card success-rate">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatPercentage(data.successRate)}</div>
            <div className="kpi-label">Success Rate</div>
            <div className="kpi-change positive">+0.1%</div>
          </div>
        </div>
      </div>

      <div className="network-status">
        <div className="network-info">
          <div className="network-indicator" style={{ backgroundColor: network.color }}></div>
          <span className="network-name">{network.name} Network</span>
        </div>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}