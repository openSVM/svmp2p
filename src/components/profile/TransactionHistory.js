import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * TransactionHistory component displays the user's transaction history with filtering and sorting
 */
const TransactionHistory = ({ transactions }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const itemsPerPage = 5;
  
  // Filter transactions based on selected filter and search query
  const filteredTransactions = transactions.filter(transaction => {
    // Apply type filter
    if (filter !== 'all' && transaction.type.toLowerCase() !== filter) {
      return false;
    }
    
    // Apply search query (if any)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.type.toLowerCase().includes(query) ||
        transaction.status.toLowerCase().includes(query) ||
        transaction.fiatCurrency.toLowerCase().includes(query) ||
        transaction.id.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Sort filtered transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      case 'amount':
        comparison = a.solAmount - b.solAmount;
        break;
      case 'fiat':
        comparison = a.fiatAmount - b.fiatAmount;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Paginate transactions
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (column) => {
    if (sortBy !== column) return null;
    
    return (
      <span className="sort-indicator">
        {sortOrder === 'asc' ? ' ↑' : ' ↓'}
      </span>
    );
  };
  
  return (
    <div className="transaction-history card">
      <div className="card-header">
        <h3 className="card-title">Transaction History</h3>
        
        <div className="ascii-form-row-4">
          <div className="ascii-field">
            <label htmlFor="search">SEARCH</label>
            <input
              id="search"
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on search
              }}
            />
          </div>
          
          <div className="ascii-field">
            <label htmlFor="filter">TYPE FILTER</label>
            <select 
              id="filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1); // Reset to first page on filter change
              }}
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          
          <div className="ascii-field">
            <label htmlFor="sortBy">SORT BY</label>
            <select 
              id="sortBy"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="fiat">Fiat</option>
              <option value="status">Status</option>
              <option value="type">Type</option>
            </select>
          </div>
          
          <div className="ascii-field">
            <label htmlFor="sortOrder">ORDER</label>
            <select 
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">DESC</option>
              <option value="asc">ASC</option>
            </select>
          </div>
        </div>
      </div>
      
      {paginatedTransactions.length === 0 ? (
        <div className="ascii-form-message no-transactions">
          <span className="message-icon">[!]</span>
          <span className="message-text">
            {searchQuery || filter !== 'all' 
              ? 'NO TRANSACTIONS MATCH YOUR FILTERS' 
              : 'NO TRANSACTIONS FOUND'}
          </span>
        </div>
      ) : (
        <>
          <div className="ascii-form-table transactions-table">
            <div className="table-header">
              <div 
                className={`col type ${sortBy === 'type' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('type')}
              >
                TYPE{getSortIndicator('type')}
              </div>
              <div 
                className={`col amount ${sortBy === 'amount' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('amount')}
              >
                AMOUNT{getSortIndicator('amount')}
              </div>
              <div 
                className={`col fiat ${sortBy === 'fiat' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('fiat')}
              >
                FIAT{getSortIndicator('fiat')}
              </div>
              <div 
                className={`col status ${sortBy === 'status' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('status')}
              >
                STATUS{getSortIndicator('status')}
              </div>
              <div 
                className={`col date ${sortBy === 'date' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('date')}
              >
                DATE{getSortIndicator('date')}
              </div>
              <div className="col actions">
                ACTION
              </div>
            </div>
            
            {paginatedTransactions.map(transaction => (
              <div key={transaction.id} className="table-row">
                <div className={`col type ${transaction.type.toLowerCase()}`}>
                  <span className="type-badge">{transaction.type.toUpperCase()}</span>
                </div>
                <div className="col amount">
                  <span className="amount-value">{transaction.solAmount.toFixed(2)}</span>
                  <span className="amount-unit">SOL</span>
                </div>
                <div className="col fiat">
                  <span className="fiat-value">{transaction.fiatAmount.toFixed(2)}</span>
                  <span className="fiat-currency">{transaction.fiatCurrency}</span>
                </div>
                <div className={`col status status-${transaction.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="status-badge">{transaction.status.toUpperCase()}</span>
                </div>
                <div className="col date">
                  {transaction.createdAt}
                </div>
                <div className="col actions">
                  <button 
                    className="button button-ghost button-xs"
                    onClick={() => alert(`View details for transaction ${transaction.id}`)}
                    aria-label={`View details for transaction ${transaction.id}`}
                  >
                    VIEW
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="ascii-form-inline pagination">
              <div className="ascii-field-inline">
                <button 
                  className="pagination-button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Previous page"
                >
                  ← PREV
                </button>
              </div>
              
              <div className="ascii-field-inline">
                <span className="pagination-info">
                  PAGE {page} OF {totalPages}
                </span>
              </div>
              
              <div className="ascii-field-inline">
                <button 
                  className="pagination-button"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                >
                  NEXT →
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="ascii-form-actions ascii-form-actions-spread">
        <div className="ascii-form-actions-left">
          <button className="button button-outline button-sm">
            Export Transactions
          </button>
          <button className="button button-ghost button-sm">
            View All
          </button>
        </div>
        <div className="ascii-form-actions-right">
          <span className="results-count">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

TransactionHistory.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      solAmount: PropTypes.number.isRequired,
      fiatAmount: PropTypes.number.isRequired,
      fiatCurrency: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
    })
  ),
};

TransactionHistory.defaultProps = {
  transactions: [],
};

export default TransactionHistory;
