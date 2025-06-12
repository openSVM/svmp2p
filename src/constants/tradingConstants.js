/**
 * Trading-related constants and configurations
 */

// Mock SOL prices for different currencies (in a real app, use an oracle or price feed)
export const MOCK_SOL_PRICES = {
  'USD': 150,
  'EUR': 140,
  'GBP': 120,
  'JPY': 16500,
  'CAD': 200,
  'AUD': 220
};

// Supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

// Supported payment methods
export const SUPPORTED_PAYMENT_METHODS = [
  'Bank Transfer', 
  'PayPal', 
  'Venmo', 
  'Cash App', 
  'Zelle', 
  'Revolut'
];

// Input validation constraints
export const VALIDATION_CONSTRAINTS = {
  SOL_AMOUNT: {
    min: 0.01,
    max: 1000, // Reasonable max to prevent fat-finger errors
    step: 0.01
  },
  FIAT_AMOUNT: {
    min: 1, // Minimum $1 equivalent
    max: 100000, // Reasonable max
    step: 0.01
  }
};

// Debounce timing for action buttons (in milliseconds)
export const ACTION_DEBOUNCE_TIME = 1000;

// Currency symbols for display
export const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$'
};