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

// Demo mode configuration
export const DEMO_MODE = {
  enabled: true,
  sampleDataLabel: 'Demo Data',
  educationalMessages: {
    walletRequired: 'Connect your wallet to buy SOL from real traders',
    browseOnly: 'You\'re browsing demo offers. Connect your wallet to see real trading opportunities.',
    createOffer: 'Connect your wallet to create real offers and start trading',
    myOffers: 'Connect your wallet to view and manage your active offers'
  }
};

// Sample demo offers for non-connected users
export const DEMO_OFFERS = [
  {
    id: 'demo-offer-1',
    seller: 'Demo Trader A',
    buyer: null,
    solAmount: 1.5,
    fiatAmount: 225,
    fiatCurrency: 'USD',
    paymentMethod: 'Bank Transfer',
    status: 'Listed',
    createdAt: Date.now() - 3600000, // 1 hour ago
    isDemo: true,
    rate: 150
  },
  {
    id: 'demo-offer-2',
    seller: 'Demo Trader B',
    buyer: null,
    solAmount: 2.0,
    fiatAmount: 300,
    fiatCurrency: 'USD',
    paymentMethod: 'Zelle',
    status: 'Listed',
    createdAt: Date.now() - 7200000, // 2 hours ago
    isDemo: true,
    rate: 150
  },
  {
    id: 'demo-offer-3',
    seller: 'Demo Trader C',
    buyer: null,
    solAmount: 0.8,
    fiatAmount: 112,
    fiatCurrency: 'EUR',
    paymentMethod: 'SEPA Transfer',
    status: 'Listed',
    createdAt: Date.now() - 10800000, // 3 hours ago
    isDemo: true,
    rate: 140
  },
  {
    id: 'demo-offer-4',
    seller: 'Demo Trader D',
    buyer: null,
    solAmount: 3.2,
    fiatAmount: 384,
    fiatCurrency: 'GBP',
    paymentMethod: 'Faster Payments',
    status: 'Listed',
    createdAt: Date.now() - 14400000, // 4 hours ago
    isDemo: true,
    rate: 120
  }
];