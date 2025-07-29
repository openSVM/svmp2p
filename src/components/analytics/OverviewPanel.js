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

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M SOL`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K SOL`;
    }
    return `${volume.toFixed(2)} SOL`;
  };

  const formatPercentage = (percent) => {
    return `${percent.toFixed(1)}%`;
  };

  const formatPercentageChange = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className="overview-panel">
      <div className="panel-header">
        <h2 className="panel-title">Protocol Trading Overview</h2>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">[LIVE]</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card trades">
          <div className="kpi-icon">[T]</div>
          <div className="kpi-content">
            <div className="kpi-value">{data.totalTrades?.toLocaleString() || 0}</div>
            <div className="kpi-label">Total Trades ({timeframe})</div>
            <div className={`kpi-change ${data.tradesChange >= 0 ? 'positive' : 'negative'}`}>{formatPercentageChange(data.tradesChange || 0)}</div>
          </div>
        </div>

        <div className="kpi-card volume">
          <div className="kpi-icon">[$]</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatVolume(data.protocolVolume)}</div>
            <div className="kpi-label">Protocol Volume ({timeframe})</div>
            <div className={`kpi-change ${data.volumeChange >= 0 ? 'positive' : 'negative'}`}>{formatPercentageChange(data.volumeChange || 0)}</div>
          </div>
        </div>

        <div className="kpi-card fees">
          <div className="kpi-icon">[F]</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatNumber(data.totalFees)}</div>
            <div className="kpi-label">Total Fees Collected</div>
            <div className={`kpi-change ${data.feesChange >= 0 ? 'positive' : 'negative'}`}>{formatPercentageChange(data.feesChange || 0)}</div>
          </div>
        </div>

        <div className="kpi-card completion-rate">
          <div className="kpi-icon">[%]</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatPercentage(data.completionRate)}</div>
            <div className="kpi-label">Trade Completion Rate</div>
            <div className={`kpi-change ${data.completionChange >= 0 ? 'positive' : 'negative'}`}>{formatPercentageChange(data.completionChange || 0)}</div>
          </div>
        </div>
      </div>

      <div className="protocol-stats">
        <div className="protocol-info">
          <div className="protocol-indicator" style={{ backgroundColor: network.color }}></div>
          <span className="protocol-name">svmp2p Protocol on {network.name}</span>
        </div>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}