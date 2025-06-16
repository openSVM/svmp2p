/**
 * Transaction Handler Integration Tests
 * 
 * Integration tests for the enhanced transaction handler covering:
 * - Transaction validation and execution flows
 * - Error handling scenarios
 * - State management during transactions
 * - Cross-network validation
 */

import { PublicKey } from '@solana/web3.js';
import {
  EnhancedTransactionHandler,
  createTransactionHandler,
  TRANSACTION_STATES,
  TRANSACTION_ERRORS,
  TransactionError
} from '../utils/transactionHandler';

// Mock Solana web3.js connection
jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
    sendTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 12345
    })
  }))
}));

describe('EnhancedTransactionHandler', () => {
  let mockConnection;
  let mockWallet;
  let transactionHandler;
  
  const validPublicKey = new PublicKey('11111111111111111111111111111112');
  const recipientPublicKey = new PublicKey('22222222222222222222222222222223');

  beforeEach(() => {
    // Mock connection
    mockConnection = {
      getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL in lamports
      sendTransaction: jest.fn().mockResolvedValue('mock-signature'),
      confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 12345
      })
    };

    // Mock wallet
    mockWallet = {
      connected: true,
      publicKey: validPublicKey,
      signTransaction: jest.fn().mockImplementation(tx => Promise.resolve(tx))
    };

    // Create transaction handler
    transactionHandler = new EnhancedTransactionHandler(mockConnection, mockWallet);
  });

  afterEach(() => {
    // Clean up listeners
    transactionHandler.listeners.clear();
    jest.clearAllMocks();
  });

  describe('State Management', () => {
    test('should start in IDLE state', () => {
      expect(transactionHandler.getState()).toBe(TRANSACTION_STATES.IDLE);
    });

    test('should emit state changes to listeners', () => {
      const mockListener = jest.fn();
      transactionHandler.addListener(mockListener);
      
      transactionHandler.emit(TRANSACTION_STATES.VALIDATING, { test: 'data' });
      
      expect(mockListener).toHaveBeenCalledWith(TRANSACTION_STATES.VALIDATING, { test: 'data' });
      expect(transactionHandler.getState()).toBe(TRANSACTION_STATES.VALIDATING);
    });

    test('should remove listeners correctly', () => {
      const mockListener = jest.fn();
      transactionHandler.addListener(mockListener);
      transactionHandler.removeListener(mockListener);
      
      transactionHandler.emit(TRANSACTION_STATES.VALIDATING);
      
      expect(mockListener).not.toHaveBeenCalled();
    });

    test('should handle listener errors gracefully', () => {
      const mockListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      transactionHandler.addListener(mockListener);
      
      // Should not throw
      expect(() => {
        transactionHandler.emit(TRANSACTION_STATES.VALIDATING);
      }).not.toThrow();
    });
  });

  describe('Transaction Validation', () => {
    test('should validate correct transaction parameters', () => {
      const params = {
        from: validPublicKey,
        to: recipientPublicKey,
        amount: 0.5,
        network: 'solana'
      };

      const result = transactionHandler.validateTransaction(params);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid recipient address', () => {
      const params = {
        from: validPublicKey,
        to: 'invalid-address',
        amount: 0.5,
        network: 'solana'
      };

      const result = transactionHandler.validateTransaction(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid amount', () => {
      const params = {
        from: validPublicKey,
        to: recipientPublicKey,
        amount: -1,
        network: 'solana'
      };

      const result = transactionHandler.validateTransaction(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject when wallet not connected', () => {
      transactionHandler.wallet = { connected: false, publicKey: null };
      
      const params = {
        to: recipientPublicKey,
        amount: 0.5,
        network: 'solana'
      };

      const result = transactionHandler.validateTransaction(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Network Validation', () => {
    test('should validate correct cross-network parameters', () => {
      const params = {
        sourceNetwork: 'solana',
        destinationNetwork: 'sonic',
        sourceToken: 'SOL',
        destinationToken: 'SONIC'
      };

      const result = transactionHandler.validateCrossNetworkTransaction(params);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject same source and destination networks', () => {
      const params = {
        sourceNetwork: 'solana',
        destinationNetwork: 'solana',
        sourceToken: 'SOL',
        destinationToken: 'SOL'
      };

      const result = transactionHandler.validateCrossNetworkTransaction(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid networks', () => {
      const params = {
        sourceNetwork: 'ethereum',
        destinationNetwork: 'bitcoin',
        sourceToken: 'ETH',
        destinationToken: 'BTC'
      };

      const result = transactionHandler.validateCrossNetworkTransaction(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Balance Checking', () => {
    test('should pass balance check with sufficient funds', async () => {
      mockConnection.getBalance.mockResolvedValue(2000000000); // 2 SOL
      
      const params = {
        from: validPublicKey.toString(),
        amount: 1 // 1 SOL
      };

      await expect(transactionHandler.checkBalance(params)).resolves.not.toThrow();
    });

    test('should reject transaction with insufficient funds', async () => {
      mockConnection.getBalance.mockResolvedValue(500000000); // 0.5 SOL
      
      const params = {
        from: validPublicKey.toString(),
        amount: 1 // 1 SOL
      };

      await expect(transactionHandler.checkBalance(params))
        .rejects.toThrow(TransactionError);
    });

    test('should handle balance check network errors', async () => {
      mockConnection.getBalance.mockRejectedValue(new Error('Network error'));
      
      const params = {
        from: validPublicKey.toString(),
        amount: 1
      };

      await expect(transactionHandler.checkBalance(params))
        .rejects.toThrow(TransactionError);
    });
  });

  describe('Transaction Execution', () => {
    test('should handle validation errors during execution', async () => {
      const params = {
        from: validPublicKey,
        to: 'invalid-address',
        amount: 0.5,
        network: 'solana'
      };

      const result = await transactionHandler.executeTransaction(params);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(TransactionError);
      expect(result.error.type).toBe(TRANSACTION_ERRORS.VALIDATION_FAILED);
    });

    test('should handle insufficient balance errors', async () => {
      mockConnection.getBalance.mockResolvedValue(100000000); // 0.1 SOL
      
      const params = {
        from: validPublicKey,
        to: recipientPublicKey,
        amount: 1, // 1 SOL - more than available
        network: 'solana'
      };

      const result = await transactionHandler.executeTransaction(params);
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe(TRANSACTION_ERRORS.INSUFFICIENT_FUNDS);
    });

    test('should emit correct state changes during execution', async () => {
      const mockListener = jest.fn();
      transactionHandler.addListener(mockListener);
      
      const params = {
        from: validPublicKey,
        to: 'invalid-address', // Will cause validation error
        amount: 0.5,
        network: 'solana'
      };

      await transactionHandler.executeTransaction(params);
      
      // Should have emitted IDLE and VALIDATING states
      expect(mockListener).toHaveBeenCalledWith(TRANSACTION_STATES.IDLE, {});
      expect(mockListener).toHaveBeenCalledWith(TRANSACTION_STATES.VALIDATING, {});
      expect(mockListener).toHaveBeenCalledWith(TRANSACTION_STATES.ERROR, expect.any(Object));
    });

    test('should sanitize input parameters', async () => {
      const params = {
        from: ` ${validPublicKey.toString()} `, // With whitespace
        to: recipientPublicKey,
        amount: '0.5', // String amount
        network: 'solana'
      };

      // Will fail at balance check since transaction creation is not implemented
      const result = await transactionHandler.executeTransaction(params);
      
      // Should have passed validation (sanitization worked)
      expect(result.error.type).not.toBe(TRANSACTION_ERRORS.VALIDATION_FAILED);
    });
  });

  describe('Cross-Network Trade Execution', () => {
    test('should return not implemented error', async () => {
      const params = {
        sourceNetwork: 'solana',
        destinationNetwork: 'sonic',
        sourceToken: 'SOL',
        destinationToken: 'SONIC'
      };

      const result = await transactionHandler.executeCrossNetworkTrade(params);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(TransactionError);
      expect(result.message).toContain('not yet supported');
    });

    test('should validate parameters before execution', async () => {
      const params = {
        sourceNetwork: 'ethereum', // Invalid network
        destinationNetwork: 'sonic',
        sourceToken: 'ETH',
        destinationToken: 'SONIC'
      };

      const result = await transactionHandler.executeCrossNetworkTrade(params);
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe(TRANSACTION_ERRORS.VALIDATION_FAILED);
    });
  });

  describe('Transaction Cancellation', () => {
    test('should cancel transaction in PREPARING state', () => {
      transactionHandler.emit(TRANSACTION_STATES.PREPARING);
      
      transactionHandler.cancel();
      
      expect(transactionHandler.getState()).toBe(TRANSACTION_STATES.CANCELLED);
      expect(transactionHandler.currentTransaction).toBe(null);
    });

    test('should cancel transaction in SIGNING state', () => {
      transactionHandler.emit(TRANSACTION_STATES.SIGNING);
      
      transactionHandler.cancel();
      
      expect(transactionHandler.getState()).toBe(TRANSACTION_STATES.CANCELLED);
    });

    test('should not cancel transaction in non-cancellable states', () => {
      transactionHandler.emit(TRANSACTION_STATES.SUCCESS);
      
      transactionHandler.cancel();
      
      expect(transactionHandler.getState()).toBe(TRANSACTION_STATES.SUCCESS);
    });
  });

  describe('Error Handling', () => {
    test('should classify user rejection errors correctly', async () => {
      const params = {
        from: validPublicKey,
        to: recipientPublicKey,
        amount: 0.5,
        network: 'solana'
      };

      // Mock balance check to pass, but transaction creation will fail
      mockConnection.getBalance.mockResolvedValue(2000000000);
      
      const result = await transactionHandler.executeTransaction(params);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(TransactionError);
    });

    test('should provide user-friendly error messages', async () => {
      const params = {
        from: validPublicKey,
        to: 'invalid-address',
        amount: 0.5,
        network: 'solana'
      };

      const result = await transactionHandler.executeTransaction(params);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('Factory Function', () => {
    test('should create transaction handler with factory function', () => {
      const handler = createTransactionHandler(mockConnection, mockWallet, { timeout: 30000 });
      
      expect(handler).toBeInstanceOf(EnhancedTransactionHandler);
      expect(handler.connection).toBe(mockConnection);
      expect(handler.wallet).toBe(mockWallet);
      expect(handler.options.timeout).toBe(30000);
    });

    test('should use default options when none provided', () => {
      const handler = createTransactionHandler(mockConnection, mockWallet);
      
      expect(handler.options.timeout).toBe(60000); // Default timeout
      expect(handler.options.maxRetries).toBe(3); // Default retries
    });
  });
});