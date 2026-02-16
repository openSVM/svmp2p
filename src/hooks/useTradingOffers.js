/**
 * useTradingOffers - Custom hook for trading offers state management
 * 
 * Extracted from OfferList.js as part of modular refactoring
 * Manages offer filtering, searching, and CRUD operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export const useTradingOffers = (filters = {}) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
    type: 'all', // 'buy' | 'sell' | 'all'
    paymentMethod: 'all',
    currency: 'all',
    amountMin: 0,
    amountMax: Infinity,
    searchQuery: '',
    sortBy: 'rate',
    sortOrder: 'asc',
    ...filters
  });

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulated API call - replace with actual offer fetching
      const mockOffers = [
        {
          id: '1',
          type: 'sell',
          cryptoAmount: 1.5,
          cryptoSymbol: 'SOL',
          fiatAmount: 150,
          fiatCurrency: 'USD',
          rate: 100.00,
          paymentMethod: 'bank',
          userId: 'user1',
          userRating: 4.8,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'buy',
          cryptoAmount: 2.0,
          cryptoSymbol: 'SOL',
          fiatAmount: 195,
          fiatCurrency: 'USD',
          rate: 97.50,
          paymentMethod: 'paypal',
          userId: 'user2',
          userRating: 4.5,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          type: 'sell',
          cryptoAmount: 0.5,
          cryptoSymbol: 'SOL',
          fiatAmount: 48,
          fiatCurrency: 'EUR',
          rate: 96.00,
          paymentMethod: 'cash',
          userId: 'user3',
          userRating: 4.9,
          createdAt: new Date().toISOString()
        }
      ];

      setOffers(mockOffers);
    } catch (err) {
      setError(err.message || 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOffer = useCallback(async (offerData) => {
    setLoading(true);
    try {
      const newOffer = {
        id: 'new-' + Date.now(),
        ...offerData,
        createdAt: new Date().toISOString()
      };
      setOffers(prev => [...prev, newOffer]);
      return { success: true, offer: newOffer };
    } catch (err) {
      setError(err.message || 'Failed to create offer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOffer = useCallback(async (offerId, updates) => {
    setLoading(true);
    try {
      setOffers(prev =>
        prev.map(offer =>
          offer.id === offerId ? { ...offer, ...updates } : offer
        )
      );
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to update offer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOffer = useCallback(async (offerId) => {
    setLoading(true);
    try {
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete offer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({
      type: 'all',
      paymentMethod: 'all',
      currency: 'all',
      amountMin: 0,
      amountMax: Infinity,
      searchQuery: '',
      sortBy: 'rate',
      sortOrder: 'asc'
    });
  }, []);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    // Filter by type
    if (activeFilters.type !== 'all') {
      result = result.filter(offer => offer.type === activeFilters.type);
    }

    // Filter by payment method
    if (activeFilters.paymentMethod !== 'all') {
      result = result.filter(
        offer => offer.paymentMethod === activeFilters.paymentMethod
      );
    }

    // Filter by currency
    if (activeFilters.currency !== 'all') {
      result = result.filter(
        offer => offer.fiatCurrency === activeFilters.currency
      );
    }

    // Filter by amount range
    result = result.filter(offer => {
      const amount = offer.fiatAmount;
      return amount >= activeFilters.amountMin && 
             (activeFilters.amountMax === Infinity || amount <= activeFilters.amountMax);
    });

    // Filter by search query
    if (activeFilters.searchQuery) {
      const query = activeFilters.searchQuery.toLowerCase();
      result = result.filter(offer =>
        offer.cryptoSymbol.toLowerCase().includes(query) ||
        offer.userId.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[activeFilters.sortBy];
      const bVal = b[activeFilters.sortBy];
      const order = activeFilters.sortOrder === 'asc' ? 1 : -1;
      return (aVal > bVal ? 1 : -1) * order;
    });

    return result;
  }, [offers, activeFilters]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return {
    offers: filteredOffers,
    allOffers: offers,
    loading,
    error,
    selectedOffer,
    filters: activeFilters,
    setSelectedOffer,
    updateFilter,
    clearFilters,
    createOffer,
    updateOffer,
    deleteOffer,
    refresh: fetchOffers
  };
};

export default useTradingOffers;
