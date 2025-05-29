import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useSafeWallet } from '../contexts/WalletContextProvider';
import { LoadingSpinner, ButtonLoader, TransactionStatus } from './common';
import { useDebounce, VirtualizedList } from '../utils/performance';

// Component for rendering a single offer row
const OfferRow = React.memo(({ offer, type, processingAction, handleOfferAction, network }) => {
  const isProcessing = processingAction.offerId === offer.id;
  const currentAction = processingAction.action;
  
  // Calculate the rate and determine if it's a good rate
  const rate = (offer.fiatAmount / offer.solAmount).toFixed(2);
  // This would be better determined by market data, for now just using mock logic
  const isGoodRate = useMemo(() => {
    const avgRate = 150; // Mock average rate
    const threshold = 0.05; // 5% threshold
    return type === 'buy' 
      ? rate < avgRate * (1 + threshold) 
      : rate > avgRate * (1 - threshold);
  }, [rate, type]);
  
  // Calculate time since posted
  const timeSincePosted = useMemo(() => {
    const now = Date.now();
    const diffMs = now - offer.createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return `${Math.floor(diffMins / 1440)}d ago`;
    }
  }, [offer.createdAt]);
  
  // Render action buttons based on offer status and user role
  const renderActionButtons = () => {
    if (type === 'buy' && offer.status === 'Listed') {
      return (
        <ButtonLoader
          onClick={() => handleOfferAction(offer.id, 'accept')}
          isLoading={isProcessing && currentAction === 'accept'}
          loadingText="..."
          variant="primary"
          size="small"
          className="offer-action-button hover-terminal-glow focus-terminal-glow active-terminal-shrink ripple-terminal-container"
        >
          Buy
        </ButtonLoader>
      );
    }
    
    if (type === 'my' && offer.status === 'Listed') {
      return (
        <ButtonLoader
          onClick={() => handleOfferAction(offer.id, 'cancel')}
          isLoading={isProcessing && currentAction === 'cancel'}
          loadingText="..."
          variant="danger"
          size="small"
          className="offer-action-button hover-terminal-glow focus-terminal-glow active-terminal-shrink ripple-terminal-container"
        >
          X
        </ButtonLoader>
      );
    }
    
    if (type === 'my' && offer.status === 'Accepted') {
      return (
        <ButtonLoader
          onClick={() => handleOfferAction(offer.id, 'confirm')}
          isLoading={isProcessing && currentAction === 'confirm'}
          loadingText="..."
          variant="success"
          size="small"
          className="offer-action-button hover-terminal-glow focus-terminal-glow active-terminal-shrink ripple-terminal-container"
        >
          ✓
        </ButtonLoader>
      );
    }
    
    return null;
  };

  return (
    <div className="offer-card table-row animate-terminal-fadeInUp hover-terminal-lift stagger-terminal-delay-1">
      <div className="offer-card-header animate-terminal-fadeInDown">
        <div className="seller-info">
          <span className="seller-name">
            {offer.seller.substring(0, 2)}...{offer.seller.substring(offer.seller.length - 2)}
          </span>
        </div>
        <div className="time-info">
          <span className="time-posted animate-terminal-pulse">{timeSincePosted}</span>
        </div>
      </div>
      
      <div className="offer-card-body animate-terminal-fadeInLeft stagger-terminal-delay-2">
        <div className="amount-info">
          <span className="sol-amount animate-terminal-glow">{offer.solAmount.toFixed(1)} SOL</span>
        </div>
        
        <div className="price-info">
          <span className="fiat-amount hover-terminal-glow">
            {offer.fiatAmount.toFixed(0)} {offer.fiatCurrency}
          </span>
          <span className={`price-per-sol ${isGoodRate ? 'good-rate animate-terminal-highlight' : ''}`}>
            {rate} {offer.fiatCurrency}/SOL
          </span>
        </div>
        
        <div className="payment-method">
          {offer.paymentMethod.substring(0, 10)}
        </div>
      </div>
      
      <div className="offer-card-footer animate-terminal-fadeInRight stagger-terminal-delay-3">
        <div className={`status-badge status-${offer.status.toLowerCase().replace(/\s+/g, '-')} animate-terminal-pulseBorder`}>
          {offer.status.substring(0, 3)}
        </div>
        
        <div className="hover-terminal-scale active-terminal-shrink">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
});

// Optimized OfferList component
const OfferList = ({ type = 'buy' }) => {
  const wallet = useSafeWallet();
  const { program, network } = useContext(AppContext);
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [txStatus, setTxStatus] = useState(null);
  
  // Filter states
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Sorting states
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Saved search states
  const [savedSearches, setSavedSearches] = useState([]);
  const [searchName, setSearchName] = useState('');
  
  // Action states
  const [processingAction, setProcessingAction] = useState({
    offerId: null,
    action: null
  });
  
  // Memoize static data
  const currencies = useMemo(() => ['', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'], []);
  const paymentMethods = useMemo(() => ['', 'Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'], []);
  const sortOptions = useMemo(() => [
    { value: 'createdAt', label: 'Date Posted' },
    { value: 'solAmount', label: 'SOL Amount' },
    { value: 'fiatAmount', label: 'Fiat Amount' },
    { value: 'rate', label: 'Rate' },
  ], []);
  
  // Generate unique IDs for form inputs - memoized to prevent recalculation
  const inputIds = useMemo(() => ({
    minAmount: `min-amount-${type}`,
    maxAmount: `max-amount-${type}`,
    currency: `currency-${type}`,
    paymentMethod: `payment-method-${type}`
  }), [type]);
  
  // Load saved searches from localStorage on component mount
  useEffect(() => {
    const loadSavedSearches = () => {
      const savedSearchesStr = localStorage.getItem(`svmp2p-saved-searches-${type}`);
      if (savedSearchesStr) {
        try {
          setSavedSearches(JSON.parse(savedSearchesStr));
        } catch (err) {
          console.error('Failed to parse saved searches:', err);
        }
      }
    };
    
    loadSavedSearches();
    
    // Load last used filters if available
    const lastUsedFilters = localStorage.getItem(`svmp2p-last-filters-${type}`);
    if (lastUsedFilters) {
      try {
        const filters = JSON.parse(lastUsedFilters);
        setMinAmount(filters.minAmount || '');
        setMaxAmount(filters.maxAmount || '');
        setSelectedCurrency(filters.selectedCurrency || '');
        setSelectedPaymentMethod(filters.selectedPaymentMethod || '');
        setSortBy(filters.sortBy || 'createdAt');
        setSortDirection(filters.sortDirection || 'desc');
        setItemsPerPage(filters.itemsPerPage || 5);
      } catch (err) {
        console.error('Failed to parse last used filters:', err);
      }
    }
  }, [type]);
  
  // Save current filters to localStorage when they change
  useEffect(() => {
    const currentFilters = {
      minAmount,
      maxAmount,
      selectedCurrency,
      selectedPaymentMethod,
      sortBy,
      sortDirection,
      itemsPerPage
    };
    
    localStorage.setItem(`svmp2p-last-filters-${type}`, JSON.stringify(currentFilters));
  }, [minAmount, maxAmount, selectedCurrency, selectedPaymentMethod, sortBy, sortDirection, itemsPerPage, type]);
  
  // Fetch offers on component mount - useCallback to prevent recreation on each render
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockOffers = [
        {
          id: '58JrMFgW3NHLtYnU2vEv9rGBZGNpJhRVQQnKvYVZZdmG',
          seller: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
          buyer: null,
          solAmount: 1.5,
          fiatAmount: 225,
          fiatCurrency: 'USD',
          paymentMethod: 'Bank Transfer',
          status: 'Listed',
          createdAt: Date.now() - 3600000
        },
        {
          id: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
          seller: '2xRW7Ld9XwHegUMeqsS8VxEYbsZYPxnaVdqTSLLNBjAT',
          buyer: null,
          solAmount: 0.5,
          fiatAmount: 75,
          fiatCurrency: 'USD',
          paymentMethod: 'PayPal',
          status: 'Listed',
          createdAt: Date.now() - 7200000
        },
        {
          id: '3pRNuDKxwVMgTJAHUZ6SgxMm9iSfaAzKtdKxVbVKsw2U',
          seller: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          buyer: null,
          solAmount: 2.0,
          fiatAmount: 300,
          fiatCurrency: 'USD',
          paymentMethod: 'Zelle',
          status: 'Listed',
          createdAt: Date.now() - 10800000
        },
        {
          id: '9sTxzFK2GpJzVGJje3oDqC2QNFpAMvYh1qUQpsCoUsS',
          seller: '6Yjk8PEgYJVB3DnGw4cUzBH9RWXLmiuw4i3GgUPyUVp8',
          buyer: null,
          solAmount: 3.2,
          fiatAmount: 480,
          fiatCurrency: 'EUR',
          paymentMethod: 'Bank Transfer',
          status: 'Listed',
          createdAt: Date.now() - 21600000
        },
        {
          id: '5KDV2s93SRvinJTjVeYzsHPMrsvpTPJVj4i41zJWxUs8',
          seller: '8NDuR9LispHKCxMEFtQCNbY9A3mWqac4WhUJJ64KfDF7',
          buyer: null,
          solAmount: 0.75,
          fiatAmount: 112.5,
          fiatCurrency: 'USD',
          paymentMethod: 'Cash App',
          status: 'Listed',
          createdAt: Date.now() - 36000000
        },
        {
          id: '6wRuMi8VJMHx8dCKQ3wPvBjwEwRKAXNhEGp8CMeBvVXV',
          seller: '2fg7mSNVVXbQKqKZYoK2Y3ahFZ7zLH8GHjqBMD5D4PHx',
          buyer: null,
          solAmount: 1.0,
          fiatAmount: 150,
          fiatCurrency: 'GBP',
          paymentMethod: 'Revolut',
          status: 'Listed',
          createdAt: Date.now() - 43200000
        },
        {
          id: '2rW9EXyaSjY8ETgpV6KYcPK2WvRJGbDELKZjZtpB24ri',
          seller: '5TtdUkSZ9D7q8NsZ1pj6rWVTntQLbMHuPh1VG6cLhxhF',
          buyer: null,
          solAmount: 4.5,
          fiatAmount: 675,
          fiatCurrency: 'USD',
          paymentMethod: 'Venmo',
          status: 'Listed',
          createdAt: Date.now() - 86400000
        }
      ];
      
      setOffers(mockOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(`Failed to fetch offers: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Failed to fetch offers: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Use effect with proper dependencies
  useEffect(() => {
    fetchOffers();
  }, [type, network, fetchOffers]);
  
  // Calculate rate for each offer for sorting purposes
  const offersWithRate = useMemo(() => {
    return offers.map(offer => ({
      ...offer,
      rate: offer.fiatAmount / offer.solAmount
    }));
  }, [offers]);

  // Filter offers based on user criteria - memoized to prevent recalculation on every render
  const filteredOffers = useMemo(() => {
    return offersWithRate.filter(offer => {
      // Filter by min amount
      if (minAmount && offer.solAmount < parseFloat(minAmount)) {
        return false;
      }
      
      // Filter by max amount
      if (maxAmount && offer.solAmount > parseFloat(maxAmount)) {
        return false;
      }
      
      // Filter by currency
      if (selectedCurrency && offer.fiatCurrency !== selectedCurrency) {
        return false;
      }
      
      // Filter by payment method
      if (selectedPaymentMethod && offer.paymentMethod !== selectedPaymentMethod) {
        return false;
      }
      
      return true;
    });
  }, [offersWithRate, minAmount, maxAmount, selectedCurrency, selectedPaymentMethod]);
  
  // Sort the filtered offers
  const sortedOffers = useMemo(() => {
    return [...filteredOffers].sort((a, b) => {
      let comparison;
      
      switch (sortBy) {
        case 'solAmount':
          comparison = a.solAmount - b.solAmount;
          break;
        case 'fiatAmount':
          comparison = a.fiatAmount - b.fiatAmount;
          break;
        case 'rate':
          comparison = a.rate - b.rate;
          break;
        case 'createdAt':
        default:
          comparison = a.createdAt - b.createdAt;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredOffers, sortBy, sortDirection]);
  
  // Get paginated offers
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedOffers.slice(startIndex, endIndex);
  }, [sortedOffers, currentPage, itemsPerPage]);
  
  // Total number of pages
  const totalPages = useMemo(() => {
    return Math.ceil(sortedOffers.length / itemsPerPage);
  }, [sortedOffers.length, itemsPerPage]);
  
  // Handle sort change
  const handleSortChange = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, [sortBy, sortDirection]);
  
  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);
  
  // Handle items per page change
  const handleItemsPerPageChange = useCallback((e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);
  
  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setMinAmount('');
    setMaxAmount('');
    setSelectedCurrency('');
    setSelectedPaymentMethod('');
    setSortBy('createdAt');
    setSortDirection('desc');
    setCurrentPage(1);
  }, []);
  
  // Handle save search
  const handleSaveSearch = useCallback(() => {
    if (!searchName.trim()) return;
    
    const newSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: {
        minAmount,
        maxAmount,
        selectedCurrency,
        selectedPaymentMethod,
        sortBy,
        sortDirection,
        itemsPerPage
      }
    };
    
    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem(`svmp2p-saved-searches-${type}`, JSON.stringify(updatedSearches));
    setSearchName('');
  }, [searchName, minAmount, maxAmount, selectedCurrency, selectedPaymentMethod, sortBy, sortDirection, itemsPerPage, savedSearches, type]);
  
  // Handle load saved search
  const handleLoadSearch = useCallback((searchId) => {
    const savedSearch = savedSearches.find(search => search.id === searchId);
    if (savedSearch) {
      const { filters } = savedSearch;
      setMinAmount(filters.minAmount);
      setMaxAmount(filters.maxAmount);
      setSelectedCurrency(filters.selectedCurrency);
      setSelectedPaymentMethod(filters.selectedPaymentMethod);
      setSortBy(filters.sortBy);
      setSortDirection(filters.sortDirection);
      setItemsPerPage(filters.itemsPerPage);
      setCurrentPage(1); // Reset to first page
    }
  }, [savedSearches]);
  
  // Handle delete saved search
  const handleDeleteSearch = useCallback((searchId) => {
    const updatedSearches = savedSearches.filter(search => search.id !== searchId);
    setSavedSearches(updatedSearches);
    localStorage.setItem(`svmp2p-saved-searches-${type}`, JSON.stringify(updatedSearches));
  }, [savedSearches, type]);
  
  // Handle offer actions (accept, cancel, etc.) - useCallback to prevent recreation on each render
  const handleOfferAction = useCallback(async (offerId, action) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      setTxStatus({
        status: 'error',
        message: 'Please connect your wallet first'
      });
      return;
    }
    
    setProcessingAction({
      offerId,
      action
    });
    
    setTxStatus({
      status: 'pending',
      message: `Processing ${action}...`
    });
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful transaction
      setStatusMessage(`Successfully ${action === 'accept' ? 'accepted' : action + 'ed'} offer`);
      setTxStatus({
        status: 'success',
        message: `Successfully ${action === 'accept' ? 'accepted' : action + 'ed'} offer`
      });
      
      // Refresh offers after action
      fetchOffers();
    } catch (err) {
      console.error(`Error ${action}ing offer:`, err);
      setError(`Failed to ${action} offer: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Failed to ${action} offer: ${err.message}`
      });
    } finally {
      setProcessingAction({
        offerId: null,
        action: null
      });
    }
  }, [wallet.publicKey, fetchOffers]);
  
  // Clear transaction status - useCallback to prevent recreation on each render
  const handleClearTxStatus = useCallback(() => {
    setTxStatus(null);
  }, []);
  
  // Memoize the title to prevent recreation on each render
  const listTitle = useMemo(() => {
    return type === 'buy' ? 'Buy SOL Offers' : 
           type === 'sell' ? 'Sell SOL Offers' : 
           'My Offers';
  }, [type]);
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="pagination-controls">
        <div className="pagination-info">
          <span>Page {currentPage} of {totalPages}</span>
          <select 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            aria-label="Items per page"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
        
        <div className="pagination-buttons">
          <button 
            className="pagination-button" 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
            aria-label="First page"
          >
            &laquo;
          </button>
          <button 
            className="pagination-button" 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            &lsaquo;
          </button>
          
          {/* Page number buttons */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              // Show all pages if 5 or fewer
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // Near the start
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // Near the end
              pageNum = totalPages - 4 + i;
            } else {
              // In the middle
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            className="pagination-button" 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Next page"
          >
            &rsaquo;
          </button>
          <button 
            className="pagination-button" 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
            aria-label="Last page"
          >
            &raquo;
          </button>
        </div>
      </div>
    );
  };
  
  // Render saved searches
  const renderSavedSearches = () => {
    if (savedSearches.length === 0) return null;
    
    return (
      <div className="saved-searches">
        <h4>Saved Searches</h4>
        <div className="saved-search-list">
          {savedSearches.map(search => (
            <div key={search.id} className="saved-search-item">
              <button 
                onClick={() => handleLoadSearch(search.id)}
                className="saved-search-button"
              >
                {search.name}
              </button>
              <button 
                onClick={() => handleDeleteSearch(search.id)}
                className="saved-search-delete"
                aria-label={`Delete ${search.name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="offer-list-container">
      <h2>{listTitle}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {statusMessage && <div className="status-message">{statusMessage}</div>}
      
      {txStatus && (
        <TransactionStatus
          status={txStatus.status}
          message={txStatus.message}
          onClose={handleClearTxStatus}
        />
      )}
      
      <div className="filter-section">
        <div className="filter-toggle-container">
          <button 
            className={`filter-toggle ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <span className="filter-icon">🔍</span>
            <span>{showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          
          <div className="sort-dropdown">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by" 
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button 
              className="sort-direction" 
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              aria-label="Toggle sort direction"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {showAdvancedFilters && (
          <>
            <div className="filters">
              <div className="filter-group">
                <label htmlFor={inputIds.minAmount}>SOL Amount:</label>
                <input
                  id={inputIds.minAmount}
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  aria-label="Minimum SOL amount"
                />
                <span>to</span>
                <input
                  id={inputIds.maxAmount}
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  aria-label="Maximum SOL amount"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor={inputIds.currency}>Currency:</label>
                <select
                  id={inputIds.currency}
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  aria-label="Select currency"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency || 'All Currencies'}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor={inputIds.paymentMethod}>Payment Method:</label>
                <select
                  id={inputIds.paymentMethod}
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  aria-label="Select payment method"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method || 'All Payment Methods'}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filter-actions">
              <button className="reset-filters" onClick={handleResetFilters}>Reset Filters</button>
              
              <div className="save-search">
                <input
                  type="text"
                  placeholder="Name this search"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                <button onClick={handleSaveSearch} disabled={!searchName.trim()}>Save</button>
              </div>
            </div>
            
            {renderSavedSearches()}
          </>
        )}
      </div>
      
      {loading ? (
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading offers..." />
        </div>
      ) : sortedOffers.length === 0 ? (
        <div className="no-offers">No offers found matching your criteria.</div>
      ) : (
        <>
          <div className="offers-grid">
            {paginatedOffers.map(offer => (
              <OfferRow 
                key={offer.id} 
                offer={offer} 
                type={type} 
                processingAction={processingAction} 
                handleOfferAction={handleOfferAction}
                network={network}
              />
            ))}
          </div>
          
          {renderPagination()}
        </>
      )}
      
      <div className="network-info">
        <p>Network: {network.name}</p>
        <p>All trades are secured by smart contracts on the {network.name} network.</p>
        <p>Disputes are resolved through a decentralized juror system.</p>
      </div>
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(OfferList);
export { OfferList };
