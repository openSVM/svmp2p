import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { LoadingSpinner, ButtonLoader, TransactionStatus, Tooltip, ConfirmationDialog } from './common';
import { useSafeWallet } from '../contexts/WalletContextProvider';
import { useDebounce, VirtualizedList } from '../utils/performance';
import { useActionDebounce } from '../hooks/useActionDebounce';
import { SUPPORTED_CURRENCIES, SUPPORTED_PAYMENT_METHODS, DEMO_MODE, DEMO_OFFERS } from '../constants/tradingConstants';
import ConnectWalletPrompt from './ConnectWalletPrompt';
import DemoIndicator from './DemoIndicator';

// Component for rendering a single offer row
const OfferRow = React.memo(({ offer, type, processingAction, handleOfferAction, network, isWalletConnected, onConnectWalletClick }) => {
  const isProcessing = processingAction.offerId === offer.id;
  const currentAction = processingAction.action;
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  // Debounced action handlers
  const { debouncedCallback: debouncedAccept, isDisabled: isAcceptDisabled } = useActionDebounce(
    () => {
      if (!isWalletConnected) {
        setShowConnectModal(true);
        return;
      }
      handleOfferAction(offer.id, 'accept');
    },
    1000
  );
  const { debouncedCallback: debouncedCancel, isDisabled: isCancelDisabled } = useActionDebounce(
    () => {
      if (!isWalletConnected) {
        setShowConnectModal(true);
        return;
      }
      handleOfferAction(offer.id, 'cancel');
    },
    1000
  );
  const { debouncedCallback: debouncedConfirm, isDisabled: isConfirmDisabled } = useActionDebounce(
    () => {
      if (!isWalletConnected) {
        setShowConnectModal(true);
        return;
      }
      handleOfferAction(offer.id, 'confirm');
    },
    1000
  );
  
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
      if (offer.isDemo && !isWalletConnected) {
        return (
          <ConnectWalletPrompt
            action="buy SOL from real traders"
            className="offer-action-button connect-wallet-button"
          />
        );
      }
      
      return (
        <ButtonLoader
          onClick={debouncedAccept}
          isLoading={isProcessing && currentAction === 'accept'}
          disabled={isAcceptDisabled}
          loadingText="..."
          variant="primary"
          size="small"
          className="offer-action-button"
        >
          Buy
        </ButtonLoader>
      );
    }
    
    if (type === 'my' && offer.status === 'Listed') {
      if (!isWalletConnected) {
        return (
          <ConnectWalletPrompt
            action="manage your offers"
            className="offer-action-button connect-wallet-button"
          />
        );
      }
      
      return (
        <ButtonLoader
          onClick={debouncedCancel}
          isLoading={isProcessing && currentAction === 'cancel'}
          disabled={isCancelDisabled}
          loadingText="..."
          variant="danger"
          size="small"
          className="offer-action-button"
        >
          Cancel
        </ButtonLoader>
      );
    }
    
    if (type === 'my' && offer.status === 'Accepted') {
      if (!isWalletConnected) {
        return (
          <ConnectWalletPrompt
            action="confirm your trades"
            className="offer-action-button connect-wallet-button"
          />
        );
      }
      
      return (
        <ButtonLoader
          onClick={debouncedConfirm}
          isLoading={isProcessing && currentAction === 'confirm'}
          disabled={isConfirmDisabled}
          loadingText="..."
          variant="success"
          size="small"
          className="offer-action-button"
        >
          Confirm
        </ButtonLoader>
      );
    }
    
    return null;
  };

  return (
    <>
      <div className={`offer-card ${offer.isDemo ? 'demo-offer' : ''}`}>
        <div className="offer-card-header">
          <div className="seller-info">
            <span className="seller-name">
              {offer.isDemo ? offer.seller : `${offer.seller.substring(0, 4)}...${offer.seller.substring(offer.seller.length - 4)}`}
            </span>
            {offer.isDemo && (
              <DemoIndicator 
                type="inline" 
                message="Demo" 
                tooltip="This is sample data for demonstration"
              />
            )}
          </div>
          <div className="time-info">
            <span className="time-posted">{timeSincePosted}</span>
          </div>
        </div>
        
        <div className="offer-card-body">
          <div className="amount-info">
            <span className="sol-amount">{offer.solAmount.toFixed(1)} SOL</span>
          </div>
          
          <div className="price-info">
            <span className="fiat-amount">
              {offer.fiatAmount.toFixed(0)} {offer.fiatCurrency}
            </span>
            <span className={`price-per-sol ${isGoodRate ? 'good-rate' : ''}`}>
              {rate} {offer.fiatCurrency}/SOL
            </span>
          </div>
          
          <div className="payment-method-container">
            <span className="payment-method">
              {offer.paymentMethod}
            </span>
          </div>
        </div>
        
        <div className="offer-card-footer">
          <div className={`status-badge status-${offer.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {offer.status}
          </div>
          
          <div className="action-button-container">
            {renderActionButtons()}
          </div>
        </div>
      </div>

      {/* Connect wallet modal */}
      {showConnectModal && (
        <ConnectWalletPrompt
          showAsModal={true}
          action="perform this action"
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </>
  );
});

// Optimized OfferList component
const OfferList = ({ type = 'buy', onStartGuidedWorkflow}) => {
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
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default'
  });
  
  
  // Memoize static data
  const currencies = useMemo(() => ['', ...SUPPORTED_CURRENCIES], []);
  const paymentMethods = useMemo(() => ['', ...SUPPORTED_PAYMENT_METHODS], []);
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
      
      // If wallet is not connected, show demo data
      if (!wallet.connected && DEMO_MODE.enabled) {
        setOffers(DEMO_OFFERS);
        return;
      }
      
      // Mock data for demonstration (real offers for connected users)
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
          createdAt: Date.now() - 3600000,
          isDemo: false
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
          createdAt: Date.now() - 7200000,
          isDemo: false
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
          createdAt: Date.now() - 10800000,
          isDemo: false
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
          createdAt: Date.now() - 21600000,
          isDemo: false
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
          createdAt: Date.now() - 36000000,
          isDemo: false
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
          createdAt: Date.now() - 43200000,
          isDemo: false
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
          createdAt: Date.now() - 86400000,
          isDemo: false
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
  }, [wallet.connected]);
  
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
    
    // Show confirmation dialog based on action
    if (action === 'accept') {
      setConfirmDialog({
        isOpen: true,
        title: 'Accept Offer',
        message: 'Are you sure you want to accept this offer? This will lock the funds in escrow until the transaction is completed.',
        onConfirm: () => processOfferAction(offerId, action),
        variant: 'default'
      });
    } else if (action === 'cancel') {
      setConfirmDialog({
        isOpen: true,
        title: 'Cancel Offer',
        message: 'Are you sure you want to cancel this offer? This action cannot be undone.',
        onConfirm: () => processOfferAction(offerId, action),
        variant: 'warning'
      });
    } else if (action === 'confirm') {
      setConfirmDialog({
        isOpen: true,
        title: 'Confirm Payment',
        message: 'Please confirm that you have received the payment. This will release funds from escrow and cannot be undone.',
        onConfirm: () => processOfferAction(offerId, action),
        variant: 'danger'
      });
    } else {
      // For other actions without confirmation
      processOfferAction(offerId, action);
    }
  }, [wallet.publicKey]);

  // Actual implementation of the offer action after confirmation
  const processOfferAction = useCallback(async (offerId, action) => {
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
  }, [fetchOffers]);
  
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
      <div className="offer-list-header">
        <h2>{listTitle}</h2>
        
        {/* Guided workflow option */}
        {onStartGuidedWorkflow && (
          <Tooltip 
            content={`Start a guided ${type === 'buy' ? 'buying' : 'selling'} process with step-by-step instructions`} 
            position="bottom"
          >
            <button 
              className="guided-workflow-button"
              onClick={() => onStartGuidedWorkflow(type)}
            >
              Need help? Use guided workflow
            </button>
          </Tooltip>
        )}
      </div>

      {/* Demo mode banner for non-connected users */}
      {!wallet.connected && DEMO_MODE.enabled && (
        <DemoIndicator
          type="banner"
          message={DEMO_MODE.sampleDataLabel}
          tooltip={type === 'buy' ? DEMO_MODE.educationalMessages.browseOnly : 
                   type === 'my' ? DEMO_MODE.educationalMessages.myOffers :
                   DEMO_MODE.educationalMessages.createOffer}
          className="demo-banner-main"
        />
      )}

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
                <label htmlFor={inputIds.minAmount}>
                  <Tooltip content="Enter minimum amount of SOL you want to trade">
                    <span>SOL Amount:</span>
                  </Tooltip>
                </label>
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
                <label htmlFor={inputIds.currency}>
                  <Tooltip content="Select the currency you want to trade in">
                    <span>Currency:</span>
                  </Tooltip>
                </label>
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
                <label htmlFor={inputIds.paymentMethod}>
                  <Tooltip content="Select your preferred payment method">
                    <span>Payment Method:</span>
                  </Tooltip>
                </label>
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
          <div className="offers-grid responsive-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedOffers.map(offer => (
              <OfferRow 
                key={offer.id} 
                offer={offer} 
                type={type} 
                processingAction={processingAction} 
                handleOfferAction={handleOfferAction}
                network={network}
                isWalletConnected={wallet.connected}
              />
            ))}
          </div>
          
          {renderPagination()}
        </>
      )}
      
      <div className="network-info glass-effect" style={{ 
        fontSize: '10px', 
        color: 'var(--color-foreground-muted)', 
        marginTop: '8px',
        padding: '4px',
        /* Use glass effect instead of solid background */
        /* backgroundColor: 'var(--color-background-alt)', */
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <p style={{ margin: '0 0 2px 0' }}>Network: {network.name}</p>
        <p style={{ margin: 0 }}>Smart contract secured trades with decentralized dispute resolution.</p>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({...confirmDialog, isOpen: false})}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
      
      <style jsx>{`
        .offer-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .guided-workflow-button {
          background-color: var(--ascii-neutral-700);
          color: var(--ascii-white);
          border: 1px solid var(--ascii-neutral-800);
          padding: 8px 16px;
          border-radius: 0;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', Courier, monospace;
          text-transform: uppercase;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }

        .guided-workflow-button::before {
          content: "?";
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background-color: var(--ascii-neutral-500);
          border: 1px solid var(--ascii-neutral-600);
          border-radius: 0;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .guided-workflow-button:hover {
          background-color: var(--ascii-neutral-600);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(OfferList);
export { OfferList };
