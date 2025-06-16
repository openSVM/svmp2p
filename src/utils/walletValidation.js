/**
 * Wallet Input Validation Utilities
 * 
 * Provides comprehensive validation for wallet operations including:
 * - Public key validation (base58, 32 bytes)
 * - Network identifier validation
 * - Transaction parameter validation
 * - Cross-network compatibility validation
 * 
 * Security Features:
 * - Strict validation before any blockchain interaction
 * - Prevents invalid data from reaching wallet adapters
 * - User-friendly error messages for validation failures
 * 
 * @fileoverview Comprehensive wallet input validation utilities
 */

import { PublicKey } from '@solana/web3.js';

// Supported SVM network identifiers
export const SUPPORTED_NETWORKS = [
  'solana',
  'sonic', 
  'eclipse',
  'svmbnb',
  's00n'
];

// Validation error types
export const VALIDATION_ERRORS = {
  INVALID_PUBLIC_KEY: 'INVALID_PUBLIC_KEY',
  INVALID_NETWORK: 'INVALID_NETWORK', 
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  UNSUPPORTED_TOKEN: 'UNSUPPORTED_TOKEN'
};

// User-friendly error messages
export const ERROR_MESSAGES = {
  [VALIDATION_ERRORS.INVALID_PUBLIC_KEY]: 'Invalid wallet address format. Please check your wallet connection.',
  [VALIDATION_ERRORS.INVALID_NETWORK]: 'Unsupported network. Please select a valid SVM network.',
  [VALIDATION_ERRORS.INVALID_AMOUNT]: 'Invalid amount. Please enter a positive number.',
  [VALIDATION_ERRORS.INVALID_ADDRESS]: 'Invalid recipient address format. Please verify the address.',
  [VALIDATION_ERRORS.NETWORK_MISMATCH]: 'Network mismatch. Source and destination networks are incompatible.',
  [VALIDATION_ERRORS.INSUFFICIENT_BALANCE]: 'Insufficient balance for this transaction.',
  [VALIDATION_ERRORS.UNSUPPORTED_TOKEN]: 'Token is not supported on the selected network.'
};

/**
 * Custom validation error class
 */
export class WalletValidationError extends Error {
  constructor(type, message, field = null) {
    super(message || ERROR_MESSAGES[type] || 'Validation error');
    this.name = 'WalletValidationError';
    this.type = type;
    this.field = field;
  }
}

/**
 * Validate a Solana public key
 * @param {string|PublicKey} publicKey - Public key to validate
 * @returns {boolean} True if valid
 */
export const isValidPublicKey = (publicKey) => {
  if (!publicKey) return false;
  
  try {
    // Handle both string and PublicKey objects
    const keyString = typeof publicKey === 'string' ? publicKey : publicKey.toString();
    
    // Check if it's a valid base58 string with correct length
    if (typeof keyString !== 'string' || keyString.length < 32 || keyString.length > 44) {
      return false;
    }
    
    // Try to create PublicKey object - this validates base58 encoding and length
    const pubKey = new PublicKey(keyString);
    
    // Additional check for valid key (not all zeros)
    return !pubKey.equals(PublicKey.default);
  } catch (error) {
    return false;
  }
};

/**
 * Validate network identifier
 * @param {string} network - Network identifier to validate
 * @returns {boolean} True if valid
 */
export const isValidNetwork = (network) => {
  return typeof network === 'string' && SUPPORTED_NETWORKS.includes(network.toLowerCase());
};

/**
 * Validate transaction amount
 * @param {number|string} amount - Amount to validate
 * @param {number} decimals - Token decimals (default 9 for SOL)
 * @returns {boolean} True if valid
 */
export const isValidAmount = (amount, decimals = 9) => {
  if (!amount && amount !== 0) return false;
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid positive number
  if (isNaN(numAmount) || numAmount <= 0) return false;
  
  // Check for reasonable upper limit (1 billion tokens)
  if (numAmount > 1_000_000_000) return false;
  
  // Check decimal precision doesn't exceed token decimals
  const amountString = numAmount.toString();
  if (amountString.includes('.')) {
    const decimalPlaces = amountString.split('.')[1].length;
    if (decimalPlaces > decimals) return false;
  }
  
  return true;
};

/**
 * Validate wallet connection parameters
 * @param {Object} params - Connection parameters
 * @param {string|PublicKey} params.publicKey - Wallet public key
 * @param {string} params.network - Network identifier
 * @returns {Object} Validation result
 */
export const validateWalletConnection = (params) => {
  const errors = [];
  
  if (!params) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY, 'Missing connection parameters'));
    return { valid: false, errors };
  }
  
  // Validate public key
  if (!isValidPublicKey(params.publicKey)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY, null, 'publicKey'));
  }
  
  // Validate network
  if (!isValidNetwork(params.network)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_NETWORK, null, 'network'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate transaction parameters
 * @param {Object} params - Transaction parameters
 * @param {string|PublicKey} params.from - Sender public key
 * @param {string|PublicKey} params.to - Recipient public key  
 * @param {number|string} params.amount - Transaction amount
 * @param {string} params.network - Network identifier
 * @param {number} params.decimals - Token decimals
 * @returns {Object} Validation result
 */
export const validateTransactionParams = (params) => {
  const errors = [];
  
  if (!params) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_AMOUNT, 'Missing transaction parameters'));
    return { valid: false, errors };
  }
  
  // Validate sender address
  if (!isValidPublicKey(params.from)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY, 'Invalid sender address', 'from'));
  }
  
  // Validate recipient address
  if (!isValidPublicKey(params.to)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_ADDRESS, null, 'to'));
  }
  
  // Validate amount
  if (!isValidAmount(params.amount, params.decimals)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_AMOUNT, null, 'amount'));
  }
  
  // Validate network
  if (!isValidNetwork(params.network)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_NETWORK, null, 'network'));
  }
  
  // Check that sender and recipient are different
  if (params.from && params.to && params.from.toString() === params.to.toString()) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_ADDRESS, 'Sender and recipient cannot be the same', 'to'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate cross-network trade parameters
 * @param {Object} params - Cross-network trade parameters
 * @param {string} params.sourceNetwork - Source network
 * @param {string} params.destinationNetwork - Destination network
 * @param {string} params.sourceToken - Source token identifier
 * @param {string} params.destinationToken - Destination token identifier
 * @returns {Object} Validation result
 */
export const validateCrossNetworkTrade = (params) => {
  const errors = [];
  
  if (!params) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.NETWORK_MISMATCH, 'Missing trade parameters'));
    return { valid: false, errors };
  }
  
  // Validate both networks
  if (!isValidNetwork(params.sourceNetwork)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_NETWORK, 'Invalid source network', 'sourceNetwork'));
  }
  
  if (!isValidNetwork(params.destinationNetwork)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.INVALID_NETWORK, 'Invalid destination network', 'destinationNetwork'));
  }
  
  // Check network compatibility (for now, all SVM networks are compatible)
  // This can be extended with specific compatibility rules
  const compatibleNetworks = SUPPORTED_NETWORKS;
  if (params.sourceNetwork && !compatibleNetworks.includes(params.sourceNetwork)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.NETWORK_MISMATCH, 'Source network not supported for cross-network trades', 'sourceNetwork'));
  }
  
  if (params.destinationNetwork && !compatibleNetworks.includes(params.destinationNetwork)) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.NETWORK_MISMATCH, 'Destination network not supported for cross-network trades', 'destinationNetwork'));
  }
  
  // Validate that networks are different (no point in same-network "cross-network" trade)
  if (params.sourceNetwork === params.destinationNetwork) {
    errors.push(new WalletValidationError(VALIDATION_ERRORS.NETWORK_MISMATCH, 'Source and destination networks must be different', 'destinationNetwork'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize and normalize public key input
 * @param {string|PublicKey} input - Public key input
 * @returns {string|null} Normalized public key string or null if invalid
 */
export const sanitizePublicKey = (input) => {
  if (!input) return null;
  
  try {
    const keyString = typeof input === 'string' ? input.trim() : input.toString();
    
    if (isValidPublicKey(keyString)) {
      return new PublicKey(keyString).toString();
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Sanitize and normalize amount input
 * @param {string|number} input - Amount input
 * @param {number} decimals - Token decimals
 * @returns {number|null} Normalized amount or null if invalid
 */
export const sanitizeAmount = (input, decimals = 9) => {
  if (!input && input !== 0) return null;
  
  try {
    const numAmount = typeof input === 'string' ? parseFloat(input) : input;
    
    if (isValidAmount(numAmount, decimals)) {
      // Round to appropriate decimal places
      return Math.round(numAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get user-friendly error message for validation error
 * @param {WalletValidationError|Error} error - Validation error
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error instanceof WalletValidationError) {
    return error.message;
  }
  
  // Handle other error types
  if (error.message && error.message.includes('User rejected')) {
    return 'Transaction was cancelled by user';
  }
  
  if (error.message && error.message.includes('insufficient funds')) {
    return ERROR_MESSAGES[VALIDATION_ERRORS.INSUFFICIENT_BALANCE];
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export default {
  isValidPublicKey,
  isValidNetwork,
  isValidAmount,
  validateWalletConnection,
  validateTransactionParams,
  validateCrossNetworkTrade,
  sanitizePublicKey,
  sanitizeAmount,
  getErrorMessage,
  VALIDATION_ERRORS,
  ERROR_MESSAGES,
  WalletValidationError
};