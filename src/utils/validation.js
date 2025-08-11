import { VALIDATION_CONSTRAINTS } from '../constants/tradingConstants';

/**
 * Validation functions for trading inputs
 */

/**
 * Validate SOL amount input
 * @param {string|number} value - The SOL amount to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export const validateSolAmount = (value) => {
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return 'Please enter a valid number';
  }
  
  if (numValue <= 0) {
    return 'SOL amount must be greater than 0';
  }
  
  if (numValue < VALIDATION_CONSTRAINTS.SOL_AMOUNT.min) {
    return `Minimum SOL amount is ${VALIDATION_CONSTRAINTS.SOL_AMOUNT.min}`;
  }
  
  if (numValue > VALIDATION_CONSTRAINTS.SOL_AMOUNT.max) {
    return `Maximum SOL amount is ${VALIDATION_CONSTRAINTS.SOL_AMOUNT.max}`;
  }
  
  return true;
};

/**
 * Validate fiat amount input
 * @param {string|number} value - The fiat amount to validate
 * @param {string} currency - The currency code
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export const validateFiatAmount = (value, currency = 'USD') => {
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return 'Please enter a valid number';
  }
  
  if (numValue <= 0) {
    return 'Fiat amount must be greater than 0';
  }
  
  const minAmount = currency === 'JPY' ? 100 : VALIDATION_CONSTRAINTS.FIAT_AMOUNT.min;
  const maxAmount = currency === 'JPY' ? 10000000 : VALIDATION_CONSTRAINTS.FIAT_AMOUNT.max;
  
  if (numValue < minAmount) {
    return `Minimum amount is ${minAmount} ${currency}`;
  }
  
  if (numValue > maxAmount) {
    return `Maximum amount is ${maxAmount} ${currency}`;
  }
  
  return true;
};

/**
 * Validate if the SOL amount doesn't exceed reasonable market limits
 * @param {number} solAmount - SOL amount
 * @param {number} fiatAmount - Fiat amount
 * @param {string} currency - Currency code
 * @param {Object} marketPrices - Real market prices from price feed (optional)
 * @returns {boolean|string} - true if valid, warning message if suspicious
 */
export const validateMarketRate = (solAmount, fiatAmount, currency, marketPrices = null) => {
  if (!solAmount || !fiatAmount || solAmount <= 0) return true;
  
  const rate = fiatAmount / solAmount;
  
  // Use real market data if available
  if (marketPrices && marketPrices[currency]) {
    const marketRate = marketPrices[currency];
    const tolerance = 0.5; // 50% tolerance for market rate validation
    
    if (rate < marketRate * (1 - tolerance)) {
      return `Rate seems unusually low (${rate.toFixed(2)} ${currency}/SOL vs market ${marketRate.toFixed(2)}). Please verify.`;
    }
    
    if (rate > marketRate * (1 + tolerance)) {
      return `Rate seems unusually high (${rate.toFixed(2)} ${currency}/SOL vs market ${marketRate.toFixed(2)}). Please verify.`;
    }
    
    return true;
  }
  
  // Fallback validation ranges when no real market data available
  const fallbackRates = {
    'USD': { min: 50, max: 300 },
    'EUR': { min: 45, max: 270 },
    'GBP': { min: 40, max: 240 },
    'JPY': { min: 7000, max: 40000 },
    'CAD': { min: 65, max: 375 },
    'AUD': { min: 70, max: 420 }
  };
  
  const expected = fallbackRates[currency] || fallbackRates['USD'];
  
  if (rate < expected.min) {
    return `Rate seems unusually low (${rate.toFixed(2)} ${currency}/SOL). Please verify.`;
  }
  
  if (rate > expected.max) {
    return `Rate seems unusually high (${rate.toFixed(2)} ${currency}/SOL). Please verify.`;
  }
  
  return true;
};