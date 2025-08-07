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
        
        <div className="ascii-form-filters">
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
        <div className="no-transactions">
          {searchQuery || filter !== 'all' 
            ? 'No transactions match your filters.' 
            : 'No transactions found.'}
        </div>
      ) : (
        <>
          <div className="transactions-table">
            <div className="table-header">
              <div 
                className={`col type ${sortBy === 'type' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('type')}
              >
                Type{getSortIndicator('type')}
              </div>
              <div 
                className={`col amount ${sortBy === 'amount' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('amount')}
              >
                Amount{getSortIndicator('amount')}
              </div>
              <div 
                className={`col fiat ${sortBy === 'fiat' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('fiat')}
              >
                Fiat{getSortIndicator('fiat')}
              </div>
              <div 
                className={`col status ${sortBy === 'status' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('status')}
              >
                Status{getSortIndicator('status')}
              </div>
              <div 
                className={`col date ${sortBy === 'date' ? 'sorted' : ''}`}
                onClick={() => handleSortChange('date')}
              >
                Date{getSortIndicator('date')}
              </div>
              <div className="col actions">
                Actions
              </div>
            </div>
            
            {paginatedTransactions.map(transaction => (
              <div key={transaction.id} className="table-row">
                <div className={`col type ${transaction.type.toLowerCase()}`}>
                  {transaction.type}
                </div>
                <div className="col amount">
                  {transaction.solAmount.toFixed(2)} SOL
                </div>
                <div className="col fiat">
                  {transaction.fiatAmount.toFixed(2)} {transaction.fiatCurrency}
                </div>
                <div className={`col status status-${transaction.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {transaction.status}
                </div>
                <div className="col date">
                  {transaction.createdAt}
                </div>
                <div className="col actions">
                  <button 
                    className="button button-ghost button-sm"
                    onClick={() => alert(`View details for transaction ${transaction.id}`)}
                    aria-label={`View details for transaction ${transaction.id}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                &laquo;
              </button>
              
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              
              <button 
                className="pagination-button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
      
      <div className="transaction-actions">
        <button className="button button-outline button-sm">
          Export Transactions
        </button>
        <button className="button button-ghost button-sm">
          View All
        </button>
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
