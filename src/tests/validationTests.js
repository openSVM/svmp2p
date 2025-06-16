/**
 * Simple validation test runner without Solana web3.js dependency
 * Tests core validation logic without PublicKey objects
 */

const {
  isValidNetwork,
  isValidAmount,
  sanitizeAmount,
  getErrorMessage,
  WalletValidationError,
  VALIDATION_ERRORS,
  ERROR_MESSAGES,
  SUPPORTED_NETWORKS
} = require('../utils/walletValidation.js');

console.log('🧪 Running Wallet Validation Tests...\n');

let testsRun = 0;
let testsPassed = 0;

function test(name, testFn) {
  testsRun++;
  try {
    testFn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain: (item) => {
      if (!actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}`);
      }
    },
    toHaveLength: (length) => {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${actual.length}`);
      }
    }
  };
}

// Network validation tests
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

test('should reject invalid network input types', () => {
  expect(isValidNetwork(null)).toBe(false);
  expect(isValidNetwork(undefined)).toBe(false);
  expect(isValidNetwork(123)).toBe(false);
  expect(isValidNetwork({})).toBe(false);
  expect(isValidNetwork('')).toBe(false);
});

// Amount validation tests
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
  expect(isValidAmount(1.123456789, 9)).toBe(true);
  expect(isValidAmount('0.12345', 9)).toBe(true);
  expect(isValidAmount(1.1234567890123, 9)).toBe(false);
  expect(isValidAmount('0.123456789012', 9)).toBe(false);
});

// Amount sanitization tests
test('should normalize valid amount string', () => {
  expect(sanitizeAmount('1.5')).toBe(1.5);
});

test('should normalize valid amount number', () => {
  expect(sanitizeAmount(2.5)).toBe(2.5);
});

test('should return null for amounts with too many decimals', () => {
  const result = sanitizeAmount(1.123456789012, 9);
  expect(result).toBe(null);
});

test('should return null for invalid input', () => {
  expect(sanitizeAmount('invalid')).toBe(null);
  expect(sanitizeAmount(-1)).toBe(null);
  expect(sanitizeAmount(null)).toBe(null);
});

test('should handle zero as invalid', () => {
  expect(sanitizeAmount(0)).toBe(null);
});

// Error message tests
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

// WalletValidationError tests
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

// Summary
console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} tests passed`);

if (testsPassed === testsRun) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}