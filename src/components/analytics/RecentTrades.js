import React, { useState, useMemo } from 'react';

export default function RecentTrades({ trades, network }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchesFilter = filter === 'all' || trade.status === filter;
      const matchesSearch = 
        trade.tradeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.seller.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [trades, filter, searchTerm]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '[C]';
      case 'in_progress': return '[P]';
      case 'cancelled': return '[X]';
      case 'disputed': return '[!]';
      default: return '[?]';
    }
  };

  const getTradeTypeIcon = (type) => {
    switch (type) {
      case 'buy': return '[B]';
      case 'sell': return '[S]';
      default: return '[T]';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatAmount = (amount, currency = 'SOL') => {
    return `${amount.toFixed(4)} ${currency}`;
  };

  const formatFiatAmount = (amount, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLoadMoreTrades = () => {
    // In a real implementation, this would fetch more trades from the API
    // For now, we'll simulate loading behavior
    alert('LOAD MORE TRADES: Feature coming soon! This would fetch additional trade history from the protocol.');
  };

  return (
    <div className="recent-trades">
      <div className="trades-header">
        <h3 className="trades-title">Recent Protocol Trades</h3>
        <div className="trades-stats">
          <span className="total-count">{filteredTrades.length} trades</span>
        </div>
      </div>

      <div className="trades-filters">
        <div className="filter-buttons">
          {['all', 'completed', 'in_progress', 'cancelled', 'disputed'].map(status => (
            <button
              key={status}
              className={`filter-button ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="trades-list">
        {filteredTrades.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">[*]</div>
            <div className="empty-text">No trades match your filters</div>
          </div>
        ) : (
          filteredTrades.map(trade => (
            <div key={trade.tradeId} className={`trade-item ${trade.status}`}>
              <div className="trade-status-icon">
                {getStatusIcon(trade.status)}
              </div>
              
              <div className="trade-type-icon">
                {getTradeTypeIcon(trade.type)}
              </div>
              
              <div className="trade-details">
                <div className="trade-main">
                  <div className="trade-id">
                    <span className="trade-label">Trade ID:</span>
                    <span className="trade-value">{trade.tradeId}</span>
                  </div>
                  <div className="trade-type-label">{trade.type.toUpperCase()}</div>
                </div>
                
                <div className="trade-participants">
                  <div className="participant buyer">
                    <span className="participant-label">Buyer:</span>
                    <span className="participant-address">{formatAddress(trade.buyer)}</span>
                  </div>
                  <div className="participant seller">
                    <span className="participant-label">Seller:</span>
                    <span className="participant-address">{formatAddress(trade.seller)}</span>
                  </div>
                </div>
                
                <div className="trade-amounts">
                  <div className="sol-amount">{formatAmount(trade.solAmount)}</div>
                  <div className="fiat-amount">{formatFiatAmount(trade.fiatAmount, trade.currency)}</div>
                  <div className="exchange-rate">
                    Rate: {formatFiatAmount(trade.rate, trade.currency)}/SOL
                  </div>
                </div>
              </div>

              <div className="trade-meta">
                <div className="trade-time">{formatTimeAgo(trade.timestamp)}</div>
                <div className="trade-network">
                  <div 
                    className="network-badge"
                    style={{ backgroundColor: network.color }}
                  >
                    {network.name}
                  </div>
                </div>
                {trade.completionTime && (
                  <div className="completion-time">
                    Completed in {trade.completionTime}
                  </div>
                )}
                {trade.protocolFee && (
                  <div className="protocol-fee">
                    Fee: {formatAmount(trade.protocolFee)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="trades-footer">
        <button 
          className="load-more-button" 
          onClick={handleLoadMoreTrades}
        >
          Load More Trades
        </button>
        <div className="trades-info">
          Showing last 100 protocol trades
        </div>
      </div>
    </div>
  );
}