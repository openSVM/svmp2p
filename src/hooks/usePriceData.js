import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('usePriceData');

// Real price feeds - using public APIs
const PRICE_SOURCES = {
  primary: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,eur,gbp,jpy,cad,aud',
  fallback: 'https://api.coinbase.com/v2/exchange-rates?currency=SOL'
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

let priceCache = {
  data: null,
  timestamp: 0
};

/**
 * Hook to fetch real SOL prices from multiple sources
 */
export const useRealPriceData = () => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrices = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && priceCache.data && (now - priceCache.timestamp) < CACHE_DURATION) {
      setPrices(priceCache.data);
      setLastUpdated(new Date(priceCache.timestamp));
      setLoading(false);
      return priceCache.data;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching real SOL prices...');

      // Try primary source first (CoinGecko)
      let priceData = null;
      
      try {
        const response = await fetch(PRICE_SOURCES.primary);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.solana) {
          priceData = {
            USD: data.solana.usd || 0,
            EUR: data.solana.eur || 0,
            GBP: data.solana.gbp || 0,
            JPY: data.solana.jpy || 0,
            CAD: data.solana.cad || 0,
            AUD: data.solana.aud || 0,
            source: 'CoinGecko',
            timestamp: now
          };
          logger.info('Fetched prices from CoinGecko', { prices: priceData });
        }
      } catch (primaryError) {
        logger.warn('Primary price source failed, trying fallback', { error: primaryError.message });
        
        // Try fallback source (Coinbase)
        try {
          const response = await fetch(PRICE_SOURCES.fallback);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const data = await response.json();
          if (data.data && data.data.rates) {
            const rates = data.data.rates;
            priceData = {
              USD: parseFloat(rates.USD) || 0,
              EUR: parseFloat(rates.EUR) || 0,
              GBP: parseFloat(rates.GBP) || 0,
              JPY: parseFloat(rates.JPY) || 0,
              CAD: parseFloat(rates.CAD) || 0,
              AUD: parseFloat(rates.AUD) || 0,
              source: 'Coinbase',
              timestamp: now
            };
            logger.info('Fetched prices from Coinbase fallback', { prices: priceData });
          }
        } catch (fallbackError) {
          logger.error('Both price sources failed', { 
            primaryError: primaryError.message, 
            fallbackError: fallbackError.message 
          });
          throw new Error('All price sources unavailable');
        }
      }

      if (!priceData) {
        throw new Error('No valid price data received');
      }

      // Validate price data
      const hasValidPrices = Object.values(priceData).some(price => 
        typeof price === 'number' && price > 0
      );

      if (!hasValidPrices) {
        throw new Error('Invalid price data received');
      }

      // Update cache
      priceCache = {
        data: priceData,
        timestamp: now
      };

      setPrices(priceData);
      setLastUpdated(new Date(now));
      
      return priceData;
    } catch (err) {
      logger.error('Error fetching prices:', err);
      setError(`Failed to fetch prices: ${err.message}`);
      
      // If we have cached data, use it even if expired
      if (priceCache.data) {
        logger.warn('Using expired cached prices due to fetch error');
        setPrices(priceCache.data);
        setLastUpdated(new Date(priceCache.timestamp));
      } else {
        setPrices(null);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrices();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchPrices(true),
    isStale: priceCache.timestamp && (Date.now() - priceCache.timestamp) > CACHE_DURATION
  };
};

/**
 * Hook to calculate fiat amount from SOL amount using real prices
 */
export const useCalculateFiatAmount = (solAmount, currency = 'USD') => {
  const { prices, loading, error } = useRealPriceData();

  const fiatAmount = (prices && solAmount && !isNaN(solAmount)) 
    ? (parseFloat(solAmount) * (prices[currency] || 0)).toFixed(2)
    : '0.00';

  const rate = prices ? prices[currency] || 0 : 0;

  return {
    fiatAmount,
    rate,
    loading,
    error,
    isValid: !loading && !error && rate > 0
  };
};

/**
 * Hook to calculate SOL amount from fiat amount using real prices
 */
export const useCalculateSolAmount = (fiatAmount, currency = 'USD') => {
  const { prices, loading, error } = useRealPriceData();

  const solAmount = (prices && fiatAmount && !isNaN(fiatAmount)) 
    ? (parseFloat(fiatAmount) / (prices[currency] || 1)).toFixed(6)
    : '0.000000';

  const rate = prices ? prices[currency] || 0 : 0;

  return {
    solAmount,
    rate,
    loading,
    error,
    isValid: !loading && !error && rate > 0
  };
};

/**
 * Get currency symbol for display
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return symbols[currency] || currency;
};

/**
 * Format price with appropriate currency symbol and decimals
 */
export const formatPrice = (amount, currency) => {
  const symbol = getCurrencySymbol(currency);
  const numAmount = parseFloat(amount) || 0;
  
  // JPY doesn't use decimal places
  const decimals = currency === 'JPY' ? 0 : 2;
  
  return `${symbol}${numAmount.toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })}`;
};

export default {
  useRealPriceData,
  useCalculateFiatAmount,
  useCalculateSolAmount,
  getCurrencySymbol,
  formatPrice
};