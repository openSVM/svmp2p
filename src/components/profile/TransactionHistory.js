import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PropertyValueTable from '../common/PropertyValueTable';

/**
 * TransactionHistory component displays the user's transaction history with filtering and sorting
 */
const TransactionHistory = ({ transactions }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
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
  
  // Prepare transaction data for PropertyValueTable
  const getTransactionTableData = () => {
    if (selectedTransaction) {
      // Show detailed view of selected transaction
      return [
        { property: 'TRANSACTION ID', value: selectedTransaction.id },
        { property: 'TYPE', value: selectedTransaction.type.toUpperCase(), badge: selectedTransaction.type.toUpperCase(), badgeClassName: `type-badge-${selectedTransaction.type.toLowerCase()}` },
        { property: 'SOL AMOUNT', value: `${selectedTransaction.solAmount.toFixed(2)} SOL` },
        { property: 'FIAT AMOUNT', value: `${selectedTransaction.fiatAmount.toFixed(2)} ${selectedTransaction.fiatCurrency}` },
        { property: 'STATUS', value: selectedTransaction.status.toUpperCase(), badge: selectedTransaction.status.toUpperCase(), badgeClassName: `status-badge-${selectedTransaction.status.toLowerCase()}` },
        { property: 'DATE CREATED', value: selectedTransaction.createdAt },
        { property: 'RATE', value: `${(selectedTransaction.fiatAmount / selectedTransaction.solAmount).toFixed(2)} ${selectedTransaction.fiatCurrency}/SOL` },
      ];
    }

    // Show list of transactions with clickable rows
    return paginatedTransactions.map(transaction => ({
      property: `${transaction.type.toUpperCase()} - ${transaction.id}`,
      value: (
        <div 
          className="transaction-summary clickable"
          onClick={() => setSelectedTransaction(transaction)}
          style={{ cursor: 'pointer' }}
        >
          <div className="transaction-amount">
            {transaction.solAmount.toFixed(2)} SOL → {transaction.fiatAmount.toFixed(2)} {transaction.fiatCurrency}
          </div>
          <div className="transaction-meta">
            <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
              {transaction.status.toUpperCase()}
            </span>
            <span className="transaction-date">{transaction.createdAt}</span>
          </div>
        </div>
      ),
      className: `transaction-row transaction-${transaction.type.toLowerCase()}`,
      description: `Click to view details`,
    }));
  };

  const transactionActions = (
    <div className="transaction-actions">
      {selectedTransaction && (
        <button 
          className="button button-ghost button-sm"
          onClick={() => setSelectedTransaction(null)}
        >
          ← BACK TO LIST
        </button>
      )}
      <button className="button button-outline button-sm">
        EXPORT TRANSACTIONS
      </button>
    </div>
  );

  return (
    <div className="transaction-history">
      {/* Filters */}
      <div className="transaction-filters card">
        <div className="card-header">
          <h3 className="card-title">Transaction Filters</h3>
        </div>
        
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
                setPage(1);
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
                setPage(1);
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

        <div className="filter-summary">
          <span className="results-count">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Transaction Data */}
      {paginatedTransactions.length === 0 ? (
        <div className="no-transactions card">
          <div className="ascii-form-message">
            <span className="message-icon">[!]</span>
            <span className="message-text">
              {searchQuery || filter !== 'all' 
                ? 'NO TRANSACTIONS MATCH YOUR FILTERS' 
                : 'NO TRANSACTIONS FOUND'}
            </span>
          </div>
        </div>
      ) : (
        <>
          <PropertyValueTable
            title={selectedTransaction ? `Transaction Details - ${selectedTransaction.id}` : "Transaction History"}
            data={getTransactionTableData()}
            actions={transactionActions}
            className="transaction-data-table"
          />

          {!selectedTransaction && totalPages > 1 && (
            <div className="transaction-pagination card">
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
            </div>
          )}
        </>
      )}
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
