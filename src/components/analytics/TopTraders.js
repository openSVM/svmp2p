import React, { useState } from 'react';

export default function TopTraders({ tradersData }) {
  const [viewMode, setViewMode] = useState('pnl'); // 'pnl' or 'volume'
  const [displayCount, setDisplayCount] = useState(10); // 10, 50, or 100

  const formatPnL = (pnl) => {
    const absValue = Math.abs(pnl);
    const sign = pnl >= 0 ? '+' : '-';
    
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `${sign}$${(absValue / 1000).toFixed(2)}K`;
    }
    return `${sign}$${absValue.toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M SOL`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K SOL`;
    }
    return `${volume.toFixed(2)} SOL`;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const sortedTraders = viewMode === 'pnl' 
    ? tradersData.sort((a, b) => b.pnl - a.pnl)
    : tradersData.sort((a, b) => b.volume - a.volume);

  const displayedTraders = sortedTraders.slice(0, displayCount);

  return (
    <div className="top-traders">
      <div className="traders-header">
        <h3 className="traders-title">Top Traders</h3>
        <div className="traders-controls">
          <div className="view-mode-selector">
            <button
              className={`mode-button ${viewMode === 'pnl' ? 'active' : ''}`}
              onClick={() => setViewMode('pnl')}
            >
              By PnL
            </button>
            <button
              className={`mode-button ${viewMode === 'volume' ? 'active' : ''}`}
              onClick={() => setViewMode('volume')}
            >
              By Volume
            </button>
          </div>
          
          <select 
            value={displayCount} 
            onChange={(e) => setDisplayCount(Number(e.target.value))}
            className="count-selector"
          >
            <option value={10}>Top 10</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      <div className="traders-list">
        <div className="traders-list-header">
          <div className="rank-column">Rank</div>
          <div className="trader-column">Trader</div>
          <div className="trades-column">Trades</div>
          <div className="volume-column">Volume</div>
          <div className="pnl-column">PnL</div>
          <div className="success-column">Success Rate</div>
        </div>

        <div className="traders-list-body">
          {displayedTraders.map((trader, index) => (
            <div key={trader.address} className="trader-row">
              <div className="rank-cell">
                <span className="rank-badge">{getRankBadge(index + 1)}</span>
              </div>
              
              <div className="trader-cell">
                <div className="trader-info">
                  <div className="trader-address">{formatAddress(trader.address)}</div>
                  {trader.verified && <span className="verified-badge">[V]</span>}
                </div>
              </div>
              
              <div className="trades-cell">
                <span className="trade-count">{trader.tradeCount}</span>
              </div>
              
              <div className="volume-cell">
                <span className="volume-amount">{formatVolume(trader.volume)}</span>
              </div>
              
              <div className="pnl-cell">
                <span className={`pnl-amount ${trader.pnl >= 0 ? 'positive' : 'negative'}`}>
                  {formatPnL(trader.pnl)}
                </span>
              </div>
              
              <div className="success-cell">
                <div className="success-rate">
                  <span className="success-percentage">{trader.successRate.toFixed(1)}%</span>
                  <div className="success-bar">
                    <div 
                      className="success-fill" 
                      style={{ width: `${trader.successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="traders-footer">
        <div className="update-info">
          Updated every 30 seconds • Showing {displayedTraders.length} of {tradersData.length} traders
        </div>
      </div>
    </div>
  );
}