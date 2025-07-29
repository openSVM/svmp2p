import React, { useState, useMemo } from 'react';

export default function TransactionFeed({ transactions, network }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesFilter = filter === 'all' || tx.status === filter;
      const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchTerm]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusClass = (status) => {
    return `transaction-status ${status}`;
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

  const formatAmount = (amount) => {
    return `${amount.toFixed(4)} SOL`;
  };

  return (
    <div className="transaction-feed">
      <div className="feed-header">
        <h3 className="feed-title">Real-Time Transaction Feed</h3>
        <div className="feed-stats">
          <span className="total-count">{filteredTransactions.length} transactions</span>
        </div>
      </div>

      <div className="feed-filters">
        <div className="filter-buttons">
          {['all', 'confirmed', 'pending', 'failed'].map(status => (
            <button
              key={status}
              className={`filter-button ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">No transactions match your filters</div>
          </div>
        ) : (
          filteredTransactions.map(tx => (
            <div key={tx.id} className={`transaction-item ${tx.status}`}>
              <div className="transaction-status-icon">
                {getStatusIcon(tx.status)}
              </div>
              
              <div className="transaction-details">
                <div className="transaction-main">
                  <div className="transaction-hash">
                    <a 
                      href={`${network.explorerUrl}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hash-link"
                    >
                      {tx.hash}
                    </a>
                  </div>
                  <div className="transaction-type">{tx.type}</div>
                </div>
                
                <div className="transaction-meta">
                  <div className="transaction-amount">{formatAmount(tx.amount)}</div>
                  <div className="transaction-time">{formatTimeAgo(tx.timestamp)}</div>
                </div>
              </div>

              <div className="transaction-network">
                <div 
                  className="network-badge"
                  style={{ backgroundColor: network.color }}
                >
                  {network.name}
                </div>
                {tx.status === 'confirmed' && (
                  <div className="confirmation-time">
                    {tx.confirmationTime.toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="feed-footer">
        <button className="load-more-button">
          Load More Transactions
        </button>
      </div>
    </div>
  );
}