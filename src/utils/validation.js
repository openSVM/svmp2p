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
 * @returns {boolean|string} - true if valid, warning message if suspicious
 */
export const validateMarketRate = (solAmount, fiatAmount, currency) => {
  if (!solAmount || !fiatAmount) return true;
  
  const rate = fiatAmount / solAmount;
  
  // Simple market rate validation (in production, use real market data)
  const expectedRates = {
    'USD': { min: 100, max: 200 },
    'EUR': { min: 90, max: 180 },
    'GBP': { min: 80, max: 160 },
    'JPY': { min: 14000, max: 20000 },
    'CAD': { min: 130, max: 250 },
    'AUD': { min: 140, max: 280 }
  };
  
  const expected = expectedRates[currency] || expectedRates['USD'];
  
  if (rate < expected.min * 0.5) {
    return `Rate seems unusually low (${rate.toFixed(2)} ${currency}/SOL). Please verify.`;
  }
  
  if (rate > expected.max * 2) {
    return `Rate seems unusually high (${rate.toFixed(2)} ${currency}/SOL). Please verify.`;
  }
  
  return true;
};