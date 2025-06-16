/**
 * Wallet Validation Utilities Tests
 * 
 * Comprehensive unit tests for wallet input validation functions
 * covering all validation scenarios and edge cases.
 */

import { PublicKey } from '@solana/web3.js';
import {
  isValidPublicKey,
  isValidNetwork,
  isValidAmount,
  validateWalletConnection,
  validateTransactionParams,
  validateCrossNetworkTrade,
  sanitizePublicKey,
  sanitizeAmount,
  getErrorMessage,
  WalletValidationError,
  VALIDATION_ERRORS,
  ERROR_MESSAGES,
  SUPPORTED_NETWORKS
} from '../utils/walletValidation';

describe('Wallet Validation Utilities', () => {
  // Test data
  const validPublicKey = new PublicKey('11111111111111111111111111111112');
  const validPublicKeyString = validPublicKey.toString();
  const invalidPublicKeyString = 'invalid-key';
  const shortPublicKey = '123';
  const longPublicKey = 'a'.repeat(50);

  describe('isValidPublicKey', () => {
    test('should validate valid PublicKey object', () => {
      expect(isValidPublicKey(validPublicKey)).toBe(true);
    });

    test('should validate valid public key string', () => {
      expect(isValidPublicKey(validPublicKeyString)).toBe(true);
    });

    test('should reject invalid public key string', () => {
      expect(isValidPublicKey(invalidPublicKeyString)).toBe(false);
    });

    test('should reject short public key', () => {
      expect(isValidPublicKey(shortPublicKey)).toBe(false);
    });

    test('should reject overly long public key', () => {
      expect(isValidPublicKey(longPublicKey)).toBe(false);
    });

    test('should reject null/undefined values', () => {
      expect(isValidPublicKey(null)).toBe(false);
      expect(isValidPublicKey(undefined)).toBe(false);
      expect(isValidPublicKey('')).toBe(false);
    });

    test('should reject default PublicKey (all zeros)', () => {
      expect(isValidPublicKey(PublicKey.default)).toBe(false);
    });

    test('should handle non-string, non-PublicKey inputs', () => {
      expect(isValidPublicKey(123)).toBe(false);
      expect(isValidPublicKey({})).toBe(false);
      expect(isValidPublicKey([])).toBe(false);
    });
  });

  describe('isValidNetwork', () => {
    test('should validate supported networks', () => {
      SUPPORTED_NETWORKS.forEach(network => {
        expect(isValidNetwork(network)).toBe(true);
      });
    });

    test('should validate networks case-insensitively', () => {
      expect(isValidNetwork('SOLANA')).toBe(true);
      expect(isValidNetwork('Solana')).toBe(true);
      expect(isValidNetwork('sonic')).toBe(true);
    });

    test('should reject unsupported networks', () => {
      expect(isValidNetwork('ethereum')).toBe(false);
      expect(isValidNetwork('bitcoin')).toBe(false);
      expect(isValidNetwork('unsupported')).toBe(false);
    });

    test('should reject invalid input types', () => {
      expect(isValidNetwork(null)).toBe(false);
      expect(isValidNetwork(undefined)).toBe(false);
      expect(isValidNetwork(123)).toBe(false);
      expect(isValidNetwork({})).toBe(false);
      expect(isValidNetwork('')).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    test('should validate positive numbers', () => {
      expect(isValidAmount(1)).toBe(true);
      expect(isValidAmount(0.5)).toBe(true);
      expect(isValidAmount(1000)).toBe(true);
      expect(isValidAmount('1.5')).toBe(true);
    });

    test('should reject zero and negative amounts', () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-1)).toBe(false);
      expect(isValidAmount('-0.5')).toBe(false);
    });

    test('should reject non-numeric values', () => {
      expect(isValidAmount('not-a-number')).toBe(false);
      expect(isValidAmount(null)).toBe(false);
      expect(isValidAmount(undefined)).toBe(false);
      expect(isValidAmount('')).toBe(false);
      expect(isValidAmount({})).toBe(false);
    });

    test('should reject overly large amounts', () => {
      expect(isValidAmount(2_000_000_000)).toBe(false);
      expect(isValidAmount('1500000000')).toBe(false);
    });

    test('should validate decimal precision', () => {
      // Should accept amounts within decimal limit
      expect(isValidAmount(1.123456789, 9)).toBe(true);
      expect(isValidAmount('0.12345', 9)).toBe(true);
      
      // Should reject amounts exceeding decimal precision
      expect(isValidAmount(1.1234567890123, 9)).toBe(false);
      expect(isValidAmount('0.1234567890', 9)).toBe(false);
    });

    test('should handle different decimal configurations', () => {
      expect(isValidAmount(1.12, 2)).toBe(true);
      expect(isValidAmount(1.123, 2)).toBe(false);
      expect(isValidAmount(1.123456, 6)).toBe(true);
      expect(isValidAmount(1.1234567, 6)).toBe(false);
    });
  });

  describe('validateWalletConnection', () => {
    test('should validate correct connection parameters', () => {
      const result = validateWalletConnection({
        publicKey: validPublicKey,
        network: 'solana'
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid public key', () => {
      const result = validateWalletConnection({
        publicKey: invalidPublicKeyString,
        network: 'solana'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(VALIDATION_ERRORS.INVALID_PUBLIC_KEY);
    });

    test('should reject invalid network', () => {
      const result = validateWalletConnection({
        publicKey: validPublicKey,
        network: 'ethereum'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(VALIDATION_ERRORS.INVALID_NETWORK);
    });

    test('should handle missing parameters', () => {
      const result = validateWalletConnection(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    test('should accumulate multiple errors', () => {
      const result = validateWalletConnection({
        publicKey: invalidPublicKeyString,
        network: 'invalid-network'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('validateTransactionParams', () => {
    const validParams = {
      from: validPublicKey,
      to: new PublicKey('22222222222222222222222222222223'),
      amount: 1.5,
      network: 'solana',
      decimals: 9
    };

    test('should validate correct transaction parameters', () => {
      const result = validateTransactionParams(validParams);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid sender address', () => {
      const result = validateTransactionParams({
        ...validParams,
        from: invalidPublicKeyString
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.INVALID_PUBLIC_KEY)).toBe(true);
    });

    test('should reject invalid recipient address', () => {
      const result = validateTransactionParams({
        ...validParams,
        to: invalidPublicKeyString
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.INVALID_ADDRESS)).toBe(true);
    });

    test('should reject invalid amount', () => {
      const result = validateTransactionParams({
        ...validParams,
        amount: -1
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.INVALID_AMOUNT)).toBe(true);
    });

    test('should reject same sender and recipient', () => {
      const result = validateTransactionParams({
        ...validParams,
        from: validPublicKey,
        to: validPublicKey
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.INVALID_ADDRESS)).toBe(true);
    });

    test('should handle missing parameters', () => {
      const result = validateTransactionParams(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validateCrossNetworkTrade', () => {
    const validTradeParams = {
      sourceNetwork: 'solana',
      destinationNetwork: 'sonic',
      sourceToken: 'SOL',
      destinationToken: 'SONIC'
    };

    test('should validate correct cross-network trade parameters', () => {
      const result = validateCrossNetworkTrade(validTradeParams);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid source network', () => {
      const result = validateCrossNetworkTrade({
        ...validTradeParams,
        sourceNetwork: 'ethereum'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.INVALID_NETWORK)).toBe(true);
    });

    test('should reject invalid destination network', () => {
      const result = validateCrossNetworkTrade({
        ...validTradeParams,
        destinationNetwork: 'bitcoin'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.INVALID_NETWORK)).toBe(true);
    });

    test('should reject same source and destination networks', () => {
      const result = validateCrossNetworkTrade({
        ...validTradeParams,
        sourceNetwork: 'solana',
        destinationNetwork: 'solana'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === VALIDATION_ERRORS.NETWORK_MISMATCH)).toBe(true);
    });

    test('should handle missing parameters', () => {
      const result = validateCrossNetworkTrade(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('sanitizePublicKey', () => {
    test('should normalize valid public key string', () => {
      const result = sanitizePublicKey(' ' + validPublicKeyString + ' ');
      expect(result).toBe(validPublicKeyString);
    });

    test('should normalize PublicKey object', () => {
      const result = sanitizePublicKey(validPublicKey);
      expect(result).toBe(validPublicKeyString);
    });

    test('should return null for invalid input', () => {
      expect(sanitizePublicKey(invalidPublicKeyString)).toBe(null);
      expect(sanitizePublicKey(null)).toBe(null);
      expect(sanitizePublicKey('')).toBe(null);
    });
  });

  describe('sanitizeAmount', () => {
    test('should normalize valid amount string', () => {
      const result = sanitizeAmount('1.5');
      expect(result).toBe(1.5);
    });

    test('should normalize valid amount number', () => {
      const result = sanitizeAmount(2.5);
      expect(result).toBe(2.5);
    });

    test('should handle decimal precision rounding', () => {
      const result = sanitizeAmount(1.123456789012, 9);
      expect(result).toBe(1.123456789);
    });

    test('should return null for invalid input', () => {
      expect(sanitizeAmount('invalid')).toBe(null);
      expect(sanitizeAmount(-1)).toBe(null);
      expect(sanitizeAmount(null)).toBe(null);
    });

    test('should handle zero', () => {
      expect(sanitizeAmount(0)).toBe(null);  // Zero amounts are not valid
    });
  });

  describe('getErrorMessage', () => {
    test('should return message for WalletValidationError', () => {
      const error = new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY);
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[VALIDATION_ERRORS.INVALID_PUBLIC_KEY]);
    });

    test('should handle user rejection errors', () => {
      const error = new Error('User rejected the request');
      const message = getErrorMessage(error);
      expect(message).toBe('Transaction was cancelled by user');
    });

    test('should handle insufficient funds errors', () => {
      const error = new Error('insufficient funds for transaction');
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[VALIDATION_ERRORS.INSUFFICIENT_BALANCE]);
    });

    test('should provide default message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = getErrorMessage(error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('WalletValidationError', () => {
    test('should create error with type and default message', () => {
      const error = new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY);
      
      expect(error.name).toBe('WalletValidationError');
      expect(error.type).toBe(VALIDATION_ERRORS.INVALID_PUBLIC_KEY);
      expect(error.message).toBe(ERROR_MESSAGES[VALIDATION_ERRORS.INVALID_PUBLIC_KEY]);
      expect(error.field).toBe(null);
    });

    test('should create error with custom message and field', () => {
      const customMessage = 'Custom error message';
      const field = 'testField';
      const error = new WalletValidationError(VALIDATION_ERRORS.INVALID_AMOUNT, customMessage, field);
      
      expect(error.message).toBe(customMessage);
      expect(error.field).toBe(field);
    });

    test('should inherit from Error', () => {
      const error = new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof WalletValidationError).toBe(true);
    });
  });
});