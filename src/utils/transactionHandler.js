/**
 * Enhanced Transaction Handler
 * 
 * Provides secure transaction handling with comprehensive validation and error handling:
 * - Pre-transaction validation of all parameters
 * - Cross-network transaction safeguards
 * - User-friendly error messages and recovery options
 * - Transaction state management with proper error handling
 * 
 * Security Features:
 * - Validates all inputs before blockchain interaction
 * - Prevents invalid transactions from being submitted
 * - Handles common error scenarios gracefully
 * - Provides clear user feedback for all error conditions
 * 
 * @fileoverview Enhanced transaction handling with comprehensive validation
 */

import { Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  validateTransactionParams, 
  validateCrossNetworkTrade,
  getErrorMessage,
  WalletValidationError,
  VALIDATION_ERRORS,
  sanitizePublicKey,
  sanitizeAmount
} from './walletValidation';

// Transaction state constants
export const TRANSACTION_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  PREPARING: 'preparing',
  SIGNING: 'signing',
  SENDING: 'sending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

// Transaction error types
export const TRANSACTION_ERRORS = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  BLOCKHASH_EXPIRED: 'BLOCKHASH_EXPIRED'
};

// User-friendly transaction error messages
export const TRANSACTION_ERROR_MESSAGES = {
  [TRANSACTION_ERRORS.VALIDATION_FAILED]: 'Transaction parameters are invalid. Please check your inputs.',
  [TRANSACTION_ERRORS.USER_REJECTED]: 'Transaction was cancelled by user.',
  [TRANSACTION_ERRORS.INSUFFICIENT_FUNDS]: 'Insufficient balance to complete this transaction.',
  [TRANSACTION_ERRORS.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
  [TRANSACTION_ERRORS.TRANSACTION_FAILED]: 'Transaction failed to execute. Please try again.',
  [TRANSACTION_ERRORS.TIMEOUT_ERROR]: 'Transaction timed out. Please try again.',
  [TRANSACTION_ERRORS.BLOCKHASH_EXPIRED]: 'Transaction expired. Please try again with a fresh transaction.'
};

/**
 * Enhanced transaction error class
 */
export class TransactionError extends Error {
  constructor(type, message, signature = null, details = null) {
    super(message || TRANSACTION_ERROR_MESSAGES[type] || 'Transaction error');
    this.name = 'TransactionError';
    this.type = type;
    this.signature = signature;
    this.details = details;
  }
}

/**
 * Transaction handler class with comprehensive validation and error handling
 */
export class EnhancedTransactionHandler {
  constructor(connection, wallet, options = {}) {
    this.connection = connection;
    this.wallet = wallet;
    this.options = {
      timeout: 60000, // 60 second timeout
      maxRetries: 3,
      ...options
    };
    this.state = TRANSACTION_STATES.IDLE;
    this.currentTransaction = null;
    this.listeners = new Set();
  }

  /**
   * Add state change listener
   * @param {Function} listener - State change callback
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove state change listener
   * @param {Function} listener - State change callback
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Emit state change to all listeners
   * @param {string} state - New state
   * @param {Object} data - Additional data
   */
  emit(state, data = {}) {
    this.state = state;
    this.listeners.forEach(listener => {
      try {
        listener(state, data);
      } catch (error) {
        console.error('[TransactionHandler] Error in state listener:', error);
      }
    });
  }

  /**
   * Validate transaction parameters before execution
   * @param {Object} params - Transaction parameters
   * @returns {Object} Validation result
   */
  validateTransaction(params) {
    this.emit(TRANSACTION_STATES.VALIDATING);

    // Basic parameter validation
    const validation = validateTransactionParams({
      from: params.from || this.wallet.publicKey,
      to: params.to,
      amount: params.amount,
      network: params.network || 'solana',
      decimals: params.decimals || 9
    });

    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors
      };
    }

    // Additional checks for wallet connection
    if (!this.wallet.connected || !this.wallet.publicKey) {
      return {
        valid: false,
        errors: [new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY, 'Wallet not connected')]
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Validate cross-network trade parameters
   * @param {Object} params - Cross-network trade parameters
   * @returns {Object} Validation result
   */
  validateCrossNetworkTransaction(params) {
    this.emit(TRANSACTION_STATES.VALIDATING);

    const validation = validateCrossNetworkTrade({
      sourceNetwork: params.sourceNetwork,
      destinationNetwork: params.destinationNetwork,
      sourceToken: params.sourceToken,
      destinationToken: params.destinationToken
    });

    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors
      };
    }

    // Additional cross-network specific validations
    // This can be extended with network-specific compatibility checks
    
    return { valid: true, errors: [] };
  }

  /**
   * Execute a standard transaction with comprehensive validation
   * @param {Object} params - Transaction parameters
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(params) {
    try {
      // Reset state
      this.emit(TRANSACTION_STATES.IDLE);
      this.currentTransaction = null;

      // Sanitize inputs
      const sanitizedParams = {
        ...params,
        from: sanitizePublicKey(params.from || this.wallet.publicKey),
        to: sanitizePublicKey(params.to),
        amount: sanitizeAmount(params.amount, params.decimals || 9)
      };

      // Validate transaction parameters
      const validation = this.validateTransaction(sanitizedParams);
      if (!validation.valid) {
        const errorMessage = validation.errors.map(e => getErrorMessage(e)).join(', ');
        throw new TransactionError(TRANSACTION_ERRORS.VALIDATION_FAILED, errorMessage);
      }

      this.emit(TRANSACTION_STATES.PREPARING);

      // Check balance before proceeding
      await this.checkBalance(sanitizedParams);

      // Create and execute transaction
      const signature = await this.createAndSendTransaction(sanitizedParams);

      this.emit(TRANSACTION_STATES.SUCCESS, { signature });

      return {
        success: true,
        signature,
        message: 'Transaction completed successfully'
      };

    } catch (error) {
      console.error('[TransactionHandler] Transaction failed:', error);
      
      this.emit(TRANSACTION_STATES.ERROR, { error });
      
      // Determine error type and provide appropriate message
      let transactionError;
      if (error instanceof WalletValidationError || error instanceof TransactionError) {
        transactionError = error;
      } else if (error.message?.includes('User rejected')) {
        transactionError = new TransactionError(TRANSACTION_ERRORS.USER_REJECTED);
      } else if (error.message?.includes('insufficient funds')) {
        transactionError = new TransactionError(TRANSACTION_ERRORS.INSUFFICIENT_FUNDS);
      } else if (error.message?.includes('timeout')) {
        transactionError = new TransactionError(TRANSACTION_ERRORS.TIMEOUT_ERROR);
      } else if (error.message?.includes('blockhash')) {
        transactionError = new TransactionError(TRANSACTION_ERRORS.BLOCKHASH_EXPIRED);
      } else {
        transactionError = new TransactionError(TRANSACTION_ERRORS.TRANSACTION_FAILED, error.message);
      }

      return {
        success: false,
        error: transactionError,
        message: getErrorMessage(transactionError)
      };
    }
  }

  /**
   * Execute cross-network trade with comprehensive validation
   * @param {Object} params - Cross-network trade parameters
   * @returns {Promise<Object>} Transaction result
   */
  async executeCrossNetworkTrade(params) {
    try {
      this.emit(TRANSACTION_STATES.IDLE);

      // Validate cross-network parameters
      const validation = this.validateCrossNetworkTransaction(params);
      if (!validation.valid) {
        const errorMessage = validation.errors.map(e => getErrorMessage(e)).join(', ');
        throw new TransactionError(TRANSACTION_ERRORS.VALIDATION_FAILED, errorMessage);
      }

      // For now, cross-network trades are not fully implemented
      // This is a placeholder for future cross-network functionality
      throw new TransactionError(
        TRANSACTION_ERRORS.NETWORK_ERROR, 
        'Cross-network trading is not yet supported. Please use single-network transactions.'
      );

    } catch (error) {
      console.error('[TransactionHandler] Cross-network trade failed:', error);
      
      this.emit(TRANSACTION_STATES.ERROR, { error });
      
      return {
        success: false,
        error: error instanceof TransactionError ? error : new TransactionError(TRANSACTION_ERRORS.TRANSACTION_FAILED, error.message),
        message: getErrorMessage(error)
      };
    }
  }

  /**
   * Check if user has sufficient balance for transaction
   * @param {Object} params - Transaction parameters
   * @returns {Promise<void>}
   */
  async checkBalance(params) {
    try {
      const fromPubkey = new PublicKey(params.from);
      const balance = await this.connection.getBalance(fromPubkey);
      const requiredBalance = params.amount * LAMPORTS_PER_SOL;

      if (balance < requiredBalance) {
        throw new TransactionError(
          TRANSACTION_ERRORS.INSUFFICIENT_FUNDS,
          `Insufficient balance. Required: ${params.amount} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`
        );
      }
    } catch (error) {
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new TransactionError(TRANSACTION_ERRORS.NETWORK_ERROR, 'Failed to check balance');
    }
  }

  /**
   * Create and send transaction
   * @param {Object} params - Transaction parameters
   * @returns {Promise<string>} Transaction signature
   */
  async createAndSendTransaction(params) {
    this.emit(TRANSACTION_STATES.SIGNING);

    // This is a placeholder for actual transaction creation
    // In a real implementation, this would create the appropriate transaction
    // based on the transaction type (transfer, swap, etc.)
    throw new TransactionError(
      TRANSACTION_ERRORS.TRANSACTION_FAILED,
      'Transaction creation not implemented in this validation layer'
    );
  }

  /**
   * Cancel current transaction if possible
   */
  cancel() {
    if (this.state === TRANSACTION_STATES.SIGNING || this.state === TRANSACTION_STATES.PREPARING) {
      this.emit(TRANSACTION_STATES.CANCELLED);
      this.currentTransaction = null;
    }
  }

  /**
   * Get current transaction state
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }
}

/**
 * Create enhanced transaction handler instance
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} options - Configuration options
 * @returns {EnhancedTransactionHandler} Transaction handler instance
 */
export const createTransactionHandler = (connection, wallet, options = {}) => {
  return new EnhancedTransactionHandler(connection, wallet, options);
};

export default {
  EnhancedTransactionHandler,
  createTransactionHandler,
  TRANSACTION_STATES,
  TRANSACTION_ERRORS,
  TransactionError
};