/**
 * Enhanced RPC Connection Utility
 * 
 * Provides improved RPC connection handling with:
 * - Built-in rate limit handling with exponential backoff
 * - Automatic retry for common transient errors
 * - Better timeout handling for RPC requests
 * - Comprehensive error reporting for debugging
 * 
 * @fileoverview RPC connection utility with resilience features
 */

import { Connection, Commitment } from '@solana/web3.js';

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 5,
  initialBackoffMs: 500,
  maxBackoffMs: 30000,
  backoffFactor: 1.5,
};

/**
 * Parses retry information from Solana RPC error messages
 * 
 * @param {Error} error - The error thrown by the RPC call
 * @returns {number|null} - Milliseconds to wait before retry, or null if not found
 */
const parseRetryAfter = (error) => {
  // Handle explicit "Retry after" responses
  const retryAfterMatch = error.message.match(/Retry after (\d+)ms/i);
  if (retryAfterMatch && retryAfterMatch[1]) {
    return parseInt(retryAfterMatch[1], 10);
  }
  
  // Handle "Too many requests" errors that don't specify retry time
  if (error.message.includes('Too many requests') || 
      error.message.includes('429 Too Many Requests')) {
    return DEFAULT_RETRY_CONFIG.initialBackoffMs;
  }
  
  // Handle common transient errors
  if (error.message.includes('timeout') || 
      error.message.includes('Socket disconnected') ||
      error.message.includes('exceeded') ||
      error.message.includes('TCP provider error')) {
    return DEFAULT_RETRY_CONFIG.initialBackoffMs;
  }
  
  return null; // Not a retryable error
};

/**
 * Creates an enhanced Connection to a Solana RPC endpoint with resilient error handling
 * 
 * @param {string} rpcEndpoint - The RPC endpoint to connect to
 * @param {Object} [options] - Connection options
 * @param {Commitment} [options.commitment='confirmed'] - Commitment level
 * @param {number} [options.confirmTransactionInitialTimeout=60000] - Initial transaction timeout
 * @param {Object} [retryConfig] - Retry configuration
 * @returns {Connection} - Enhanced Connection object with retry capabilities
 */
export const createConnection = (rpcEndpoint, options = {}, retryConfig = DEFAULT_RETRY_CONFIG) => {
  const connectionOptions = {
    commitment: options.commitment || 'confirmed',
    confirmTransactionInitialTimeout: options.confirmTransactionInitialTimeout || 60000,
    disableRetryOnRateLimit: true, // We'll handle retries manually for better control
    ...options
  };

  // Create Solana Connection with options
  const connection = new Connection(rpcEndpoint, connectionOptions);
  const originalRpcRequest = connection._rpcRequest.bind(connection);
  
  // Current retry attempts per method+params combination
  const retryState = {};
  
  // Override the internal RPC request method with our retry logic
  connection._rpcRequest = async (method, params) => {
    const requestId = `${method}:${JSON.stringify(params || [])}`;
    retryState[requestId] = retryState[requestId] || { attempts: 0, backoffMs: retryConfig.initialBackoffMs };
    
    try {
      // Attempt the RPC call
      const response = await originalRpcRequest(method, params);
      
      // Success: reset retry state for this request
      delete retryState[requestId];
      
      return response;
    } catch (error) {
      const state = retryState[requestId];
      const retryAfter = parseRetryAfter(error);
      
      // If the error is retryable and we haven't exceeded max retries
      if (retryAfter !== null && state.attempts < retryConfig.maxRetries) {
        // Calculate backoff with exponential increases and some jitter
        const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 randomization factor
        const backoff = Math.min(
          state.backoffMs * retryConfig.backoffFactor * jitter,
          retryConfig.maxBackoffMs
        );
        
        // Use the larger of parsed retry time or calculated backoff
        const waitTime = Math.max(retryAfter, backoff);
        
        console.warn(
          `RPC ${method} call failed (attempt ${state.attempts + 1}/${retryConfig.maxRetries}): ${error.message}. ` +
          `Retrying in ${Math.round(waitTime)}ms...`
        );
        
        // Update retry state for next attempt
        state.attempts++;
        state.backoffMs = backoff;
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return connection._rpcRequest(method, params);
      }
      
      // Exceeded retries or non-retryable error
      if (state.attempts >= retryConfig.maxRetries) {
        console.error(`RPC ${method} call failed after ${retryConfig.maxRetries} retry attempts: ${error.message}`);
      }
      
      // Clear retry state and re-throw the error
      delete retryState[requestId];
      throw error;
    }
  };
  
  // Add event handlers for connection errors
  connection.on('error', (error) => {
    console.error('RPC connection error:', error.message);
  });
  
  connection.on('timeout', () => {
    console.warn('RPC connection timeout - will automatically retry');
  });
  
  connection.on('end', () => {
    console.warn('RPC connection ended unexpectedly');
  });
  
  return connection;
};

/**
 * Creates a Connection using the appropriate endpoint and configurations for different environments
 * 
 * @param {string} network - The network to connect to (e.g., 'mainnet', 'devnet')
 * @returns {Connection} - Enhanced Connection object with retry capabilities
 */
export const getNetworkConnection = (network) => {
  const networkConfigs = {
    mainnet: {
      endpoint: 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed',
    },
    devnet: {
      endpoint: 'https://api.devnet.solana.com',
      commitment: 'confirmed',
    },
    testnet: {
      endpoint: 'https://api.testnet.solana.com',
      commitment: 'confirmed',
    },
    // Add any other networks as needed
  };
  
  const config = networkConfigs[network.toLowerCase()] || networkConfigs.devnet;
  
  return createConnection(config.endpoint, {
    commitment: config.commitment,
    confirmTransactionInitialTimeout: 60000,
  });
};

export default createConnection;