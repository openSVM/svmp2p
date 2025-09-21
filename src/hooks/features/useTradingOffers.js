/**
 * Custom hook for trading offers management
 * 
 * Extracted business logic from the monolithic OfferList component
 * Provides a clean interface for offers operations and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePhantomWallet } from '../../../contexts/PhantomWalletProvider';
import { useOffers } from '../../../hooks/useOnChainData';
import { useDebounce } from '../../../utils/performance';

/**
 * Custom hook for managing trading offers
 */
export const useTradingOffers = (type = 'buy') => {
  const { connected, publicKey } = usePhantomWallet();
  
  // Core state
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processingAction, setProcessingAction] = useState({ offerId: null, action: null });

  // Debounced search to optimize performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get offers from on-chain data
  const { 
    offers: rawOffers, 
    loading, 
    error, 
    refreshOffers,
    createOffer,
    acceptOffer,
    cancelOffer,
    confirmOffer
  } = useOffers();

  /**
   * Filter offers based on search term and filters
   */
  const filteredOffers = useMemo(() => {
    if (!rawOffers) return [];

    let filtered = rawOffers.filter(offer => {
      // Filter by type (buy/sell)
      const isCorrectType = type === 'buy' ? offer.type === 'sell' : offer.type === 'buy';
      if (!isCorrectType) return false;

      // Search term filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch = 
          offer.paymentMethod.toLowerCase().includes(searchLower) ||
          offer.fiatCurrency.toLowerCase().includes(searchLower) ||
          offer.solAmount.toString().includes(searchLower) ||
          offer.fiatAmount.toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Currency filter
      if (filters.currency && offer.fiatCurrency !== filters.currency) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod && offer.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // Amount range filters
      if (filters.minAmount && offer.solAmount < parseFloat(filters.minAmount)) {
        return false;
      }

      if (filters.maxAmount && offer.solAmount > parseFloat(filters.maxAmount)) {
        return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'amount-high':
          return b.solAmount - a.solAmount;
        case 'amount-low':
          return a.solAmount - b.solAmount;
        case 'rate-high':
          return (b.fiatAmount / b.solAmount) - (a.fiatAmount / a.solAmount);
        case 'rate-low':
          return (a.fiatAmount / a.solAmount) - (b.fiatAmount / b.solAmount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [rawOffers, type, debouncedSearchTerm, filters, sortBy]);

  /**
   * Handle offer actions (accept, cancel, confirm)
   */
  const handleOfferAction = useCallback(async (offerId, action) => {
    if (!connected || !publicKey) {
      console.error('Wallet not connected');
      return;
    }

    setProcessingAction({ offerId, action });

    try {
      switch (action) {
        case 'accept':
          await acceptOffer(offerId);
          break;
        case 'cancel':
          await cancelOffer(offerId);
          break;
        case 'confirm':
          await confirmOffer(offerId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Refresh offers after successful action
      setTimeout(() => {
        refreshOffers();
      }, 1000);

    } catch (error) {
      console.error(`Failed to ${action} offer:`, error);
      // Error handling is typically done in the UI layer
    } finally {
      setProcessingAction({ offerId: null, action: null });
    }
  }, [connected, publicKey, acceptOffer, cancelOffer, confirmOffer, refreshOffers]);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Handle search term changes
   */
  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  /**
   * Handle sort changes
   */
  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
  }, []);

  /**
   * Toggle advanced filters
   */
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  /**
   * Refresh offers data
   */
  const handleRefresh = useCallback(() => {
    refreshOffers();
  }, [refreshOffers]);

  /**
   * Get statistics about filtered offers
   */
  const offerStats = useMemo(() => {
    if (!filteredOffers.length) {
      return {
        total: 0,
        avgAmount: 0,
        avgRate: 0,
        totalVolume: 0
      };
    }

    const total = filteredOffers.length;
    const totalSolAmount = filteredOffers.reduce((sum, offer) => sum + offer.solAmount, 0);
    const totalFiatAmount = filteredOffers.reduce((sum, offer) => sum + offer.fiatAmount, 0);
    
    return {
      total,
      avgAmount: totalSolAmount / total,
      avgRate: totalFiatAmount / totalSolAmount,
      totalVolume: totalSolAmount
    };
  }, [filteredOffers]);

  /**
   * Check if user owns any of the displayed offers
   */
  const userOffers = useMemo(() => {
    if (!publicKey) return [];
    return filteredOffers.filter(offer => offer.owner === publicKey.toString());
  }, [filteredOffers, publicKey]);

  // Auto-refresh offers periodically
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      refreshOffers();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [connected, refreshOffers]);

  return {
    // Data
    offers: filteredOffers,
    rawOffers,
    userOffers,
    offerStats,
    
    // State
    loading,
    error,
    filters,
    searchTerm,
    sortBy,
    showAdvanced,
    processingAction,
    
    // Actions
    handleOfferAction,
    handleFiltersChange,
    handleSearchChange,
    handleSortChange,
    toggleAdvancedFilters,
    handleRefresh,
    createOffer,
    
    // Computed
    isWalletConnected: connected,
    hasOffers: filteredOffers.length > 0,
    isEmpty: !loading && filteredOffers.length === 0,
  };
};

export default useTradingOffers;