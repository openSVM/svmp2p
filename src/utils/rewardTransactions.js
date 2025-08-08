/**
 * Reward System Transaction Utilities
 * 
 * Functions for executing reward-related transactions on the Solana blockchain
 * including claiming rewards, creating user reward accounts, and checking balances.
 * Enhanced with cooldown logic and jitter-based retry mechanisms.
 * 
 * Fixed for Netlify deployment compatibility.
 */

import { PROGRAM_CONFIG, COOLDOWN_CONFIG, UI_CONFIG } from '../constants/rewardConstants';
import { createLogger } from './logger';
import { getErrorMessage, getUIText } from './i18n';
import { getRateLimiter } from './claimRateLimit';
import { TransactionBuilder, TransactionExecutor, TransactionFactory, SignatureVerification } from './transactionCPI';

// Initialize logger for this module
const logger = createLogger('RewardTransactions');

// Conditional imports to handle test environment
let web3, PublicKey, Connection;

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const solanaWeb3 = require('@solana/web3.js');
    
    web3 = solanaWeb3;
    PublicKey = solanaWeb3.PublicKey;
    Connection = solanaWeb3.Connection;
  } catch (error) {
    logger.warn('Solana libraries not available, using mock implementation', { error: error.message });
  }
}

// Program ID - should match the deployed program
const PROGRAM_ID_STRING = PROGRAM_CONFIG.PROGRAM_ID;

// PDA seeds
const REWARD_TOKEN_SEED = PROGRAM_CONFIG.PDA_SEEDS.REWARD_TOKEN;
const USER_REWARDS_SEED = PROGRAM_CONFIG.PDA_SEEDS.USER_REWARDS;
const REWARD_MINT_SEED = PROGRAM_CONFIG.PDA_SEEDS.REWARD_MINT;

// Enhanced cooldown and retry configuration
const ENHANCED_COOLDOWN_CONFIG = {
  claimCooldown: COOLDOWN_CONFIG.CLAIM_COOLDOWN,
  failedClaimCooldown: COOLDOWN_CONFIG.FAILED_CLAIM_COOLDOWN, // New: cooldown for failed attempts
  maxRetries: COOLDOWN_CONFIG.MAX_RETRIES,
  baseRetryDelay: COOLDOWN_CONFIG.BASE_RETRY_DELAY,
  maxRetryDelay: COOLDOWN_CONFIG.MAX_RETRY_DELAY,
  jitterFactor: COOLDOWN_CONFIG.JITTER_FACTOR,
  backoffMultiplier: COOLDOWN_CONFIG.BACKOFF_MULTIPLIER,
};

// Enhanced cooldown tracking
const claimCooldowns = new Map(); // userKey -> timestamp
const failedClaimCooldowns = new Map(); // userKey -> { timestamp, attemptCount }

/**
 * Enhanced retry logic with exponential backoff and jitter
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} jitterFactor - Jitter factor (0-1)
 * @returns {Promise} Result of the operation
 */
const retryWithJitter = async (operation, maxRetries = ENHANCED_COOLDOWN_CONFIG.maxRetries, baseDelay = ENHANCED_COOLDOWN_CONFIG.baseRetryDelay, jitterFactor = ENHANCED_COOLDOWN_CONFIG.jitterFactor) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on user rejection or certain error types
      if (error.message?.includes('User rejected') || 
          error.message?.includes('insufficient funds') ||
          attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(ENHANCED_COOLDOWN_CONFIG.backoffMultiplier, attempt);
      const maxDelay = Math.min(exponentialDelay, ENHANCED_COOLDOWN_CONFIG.maxRetryDelay);
      
      // Add jitter to prevent thundering herd
      const jitter = maxDelay * jitterFactor * (Math.random() - 0.5);
      const delayWithJitter = Math.max(0, maxDelay + jitter);
      
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(delayWithJitter)}ms`, { 
        error: error.message,
        attempt: attempt + 1,
        delay: delayWithJitter
      });
      
      await new Promise(resolve => setTimeout(resolve, delayWithJitter));
    }
  }
  
  throw lastError;
};

/**
 * Check if user is on cooldown for claims (successful claims)
 * @param {PublicKey} userPublicKey - User's public key
 * @returns {boolean} True if user is on cooldown
 */
export const isUserOnClaimCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  const lastClaim = claimCooldowns.get(userKey);
  
  if (!lastClaim) return false;
  
  const timeSinceLastClaim = Date.now() - lastClaim;
  return timeSinceLastClaim < ENHANCED_COOLDOWN_CONFIG.claimCooldown;
};

/**
 * Check if user is on cooldown for failed claims  
 * @param {PublicKey} userPublicKey - User's public key
 * @returns {boolean} True if user is on failed claim cooldown
 */
export const isUserOnFailedClaimCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  const failedClaim = failedClaimCooldowns.get(userKey);
  
  if (!failedClaim) return false;
  
  const timeSinceFailedClaim = Date.now() - failedClaim.timestamp;
  return timeSinceFailedClaim < ENHANCED_COOLDOWN_CONFIG.failedClaimCooldown;
};

/**
 * Get remaining cooldown time for user (successful claims)
 * @param {PublicKey} userPublicKey - User's public key  
 * @returns {number} Remaining cooldown time in milliseconds (0 if no cooldown)
 */
export const getRemainingCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  const lastClaim = claimCooldowns.get(userKey);
  
  if (!lastClaim) return 0;
  
  const timeSinceLastClaim = Date.now() - lastClaim;
  const remaining = ENHANCED_COOLDOWN_CONFIG.claimCooldown - timeSinceLastClaim;
  
  return Math.max(0, remaining);
};

/**
 * Get remaining cooldown time for failed claims
 * @param {PublicKey} userPublicKey - User's public key
 * @returns {number} Remaining failed claim cooldown time in milliseconds (0 if no cooldown)
 */
export const getRemainingFailedClaimCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  const failedClaim = failedClaimCooldowns.get(userKey);
  
  if (!failedClaim) return 0;
  
  const timeSinceFailedClaim = Date.now() - failedClaim.timestamp;
  const remaining = ENHANCED_COOLDOWN_CONFIG.failedClaimCooldown - timeSinceFailedClaim;
  
  return Math.max(0, remaining);
};

/**
 * Set claim cooldown for user (successful claim)
 * @param {PublicKey} userPublicKey - User's public key
 */
const setClaimCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  claimCooldowns.set(userKey, Date.now());
  
  // Clear failed claim cooldown on successful claim
  failedClaimCooldowns.delete(userKey);
};

/**
 * Set failed claim cooldown for user
 * @param {PublicKey} userPublicKey - User's public key
 */
const setFailedClaimCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  const existingFailure = failedClaimCooldowns.get(userKey);
  const attemptCount = existingFailure ? existingFailure.attemptCount + 1 : 1;
  
  failedClaimCooldowns.set(userKey, {
    timestamp: Date.now(),
    attemptCount
  });
};

/**
 * Clear claim cooldown for user (admin function)
 * @param {PublicKey} userPublicKey - User's public key
 */
export const clearClaimCooldown = (userPublicKey) => {
  const userKey = userPublicKey.toString();
  claimCooldowns.delete(userKey);
  failedClaimCooldowns.delete(userKey);
};

/**
 * Get enhanced cooldown statistics
 * @returns {Object} Cooldown statistics
 */
export const getCooldownStats = () => {
  const now = Date.now();
  const successCooldownUsers = Array.from(claimCooldowns.entries())
    .filter(([_, timestamp]) => now - timestamp < ENHANCED_COOLDOWN_CONFIG.claimCooldown);
  
  const failedCooldownUsers = Array.from(failedClaimCooldowns.entries())
    .filter(([_, data]) => now - data.timestamp < ENHANCED_COOLDOWN_CONFIG.failedClaimCooldown);
  
  return {
    totalTrackedUsers: claimCooldowns.size,
    usersOnSuccessCooldown: successCooldownUsers.length,
    usersOnFailedCooldown: failedCooldownUsers.length,
    totalFailedAttempts: Array.from(failedClaimCooldowns.values()).reduce((sum, data) => sum + data.attemptCount, 0),
    cooldownDuration: ENHANCED_COOLDOWN_CONFIG.claimCooldown,
    failedClaimCooldown: ENHANCED_COOLDOWN_CONFIG.failedClaimCooldown,
    config: ENHANCED_COOLDOWN_CONFIG
  };
};

/**
 * Claims accumulated rewards for a user with enhanced cooldown, rate limiting, and retry logic
 * @param {Object} wallet - Wallet adapter instance
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @param {Object} options - Options for claiming (bypassCooldown, retryConfig, useQueue, priority)
 * @returns {Promise<string>} Transaction signature
 */
export const claimRewards = async (wallet, connection, userPublicKey, options = {}) => {
  const { bypassCooldown = false, retryConfig = {}, useQueue = true, priority = 5 } = options;
  const userId = userPublicKey.toString();
  
  // Check successful claim cooldown unless bypassed
  if (!bypassCooldown && isUserOnClaimCooldown(userPublicKey)) {
    const remaining = getRemainingCooldown(userPublicKey);
    const remainingSeconds = Math.ceil(remaining / 1000);
    throw new Error(`${getErrorMessage(UI_CONFIG.ERROR_MESSAGES.CLAIM_FAILED)} ${getUIText('WAIT_SECONDS', { seconds: remainingSeconds })}`);
  }
  
  // Check failed claim cooldown
  if (!bypassCooldown && isUserOnFailedClaimCooldown(userPublicKey)) {
    const remaining = getRemainingFailedClaimCooldown(userPublicKey);
    const remainingSeconds = Math.ceil(remaining / 1000);
    throw new Error(`${getErrorMessage('TOO_MANY_REQUESTS')} ${getUIText('WAIT_SECONDS', { seconds: remainingSeconds })}`);
  }
  
  // Use queue system for rate limiting and abuse prevention
  if (useQueue) {
    const rateLimiter = getRateLimiter();
    
    try {
      const queueId = await rateLimiter.queueClaim({
        userId,
        userPublicKey,
        wallet,
        connection,
        options: { ...options, useQueue: false }, // Prevent infinite recursion
        priority
      });
      
      // Wait for queue processing with periodic status checks
      return await waitForQueuedClaim(queueId, rateLimiter);
    } catch (error) {
      logger.error('Failed to queue claim request', { userId, error: error.message });
      
      // If queueing fails, fall back to direct processing (with rate limiting)
      const rateLimitResult = rateLimiter.checkRateLimit(userId, priority);
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limited: ${rateLimitResult.reason}. ${rateLimitResult.waitTime ? `Wait ${Math.ceil(rateLimitResult.waitTime / 1000)}s` : ''}`);
      }
    }
  }
  
  if (!web3 || !PublicKey) {
    // Real blockchain environment required - no mock data
    throw new Error('Web3 connection required for claiming rewards');
  }

  const operation = async () => {
    // Use the new modular transaction factory
    const transaction = await TransactionFactory.createClaimRewardsTransaction(
      PROGRAM_ID_STRING,
      userPublicKey,
      connection
    );

    // Execute transaction with enhanced error handling
    const executor = new TransactionExecutor(connection, wallet, {
      maxRetries: finalRetryConfig.maxRetries,
      retryDelay: finalRetryConfig.baseRetryDelay,
      commitment: 'confirmed',
      waitForConfirmation: true
    });

    const signature = await executor.executeTransaction(transaction);
    
    // Verify signature format
    if (!SignatureVerification.isValidSignature(signature)) {
      throw new Error(`Invalid transaction signature: ${signature}`);
    }
    
    // Set cooldown on successful claim
    setClaimCooldown(userPublicKey);
    
    return signature;
  };

  try {
    // Apply retry logic with custom config if provided
    const finalRetryConfig = { ...ENHANCED_COOLDOWN_CONFIG, ...retryConfig };
    
    return await retryWithJitter(
      operation,
      finalRetryConfig.maxRetries,
      finalRetryConfig.baseRetryDelay,
      finalRetryConfig.jitterFactor
    );
  } catch (error) {
    // Set failed claim cooldown on failure (unless it's a user rejection)
    if (!error.message?.includes('User rejected')) {
      setFailedClaimCooldown(userPublicKey);
    }
    throw error;
  }
};

/**
 * Creates a user rewards account if it doesn't exist with retry logic
 * @param {Object} wallet - Wallet adapter instance
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @param {Object} options - Options for creation (retryConfig)
 * @returns {Promise<string>} Transaction signature
 */
export const createUserRewardsAccount = async (wallet, connection, userPublicKey, options = {}) => {
  const { retryConfig = {} } = options;
  
  if (!web3 || !PublicKey) {
    // Real blockchain environment required - no mock data
    throw new Error('Web3 connection required for creating user rewards account');
  }

  const operation = async () => {
    // Use the new modular transaction factory
    const transaction = await TransactionFactory.createUserRewardsAccountTransaction(
      PROGRAM_ID_STRING,
      userPublicKey
    );

    // Execute transaction with enhanced error handling
    const executor = new TransactionExecutor(connection, wallet, {
      maxRetries: finalRetryConfig.maxRetries,
      retryDelay: finalRetryConfig.baseRetryDelay,
      commitment: 'confirmed',
      waitForConfirmation: true
    });

    const signature = await executor.executeTransaction(transaction);
    
    // Verify signature format
    if (!SignatureVerification.isValidSignature(signature)) {
      throw new Error(`Invalid transaction signature: ${signature}`);
    }
    
    return signature;
  };

  // Apply retry logic
  const finalRetryConfig = { ...ENHANCED_COOLDOWN_CONFIG, ...retryConfig };
  
  return retryWithJitter(
    operation,
    finalRetryConfig.maxRetries,
    finalRetryConfig.baseRetryDelay,
    finalRetryConfig.jitterFactor
  );
};

/**
 * Checks if the user has an existing rewards account with retry logic
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @param {Object} options - Options for checking (retryConfig)
 * @returns {Promise<boolean>} True if account exists
 */
export const hasUserRewardsAccount = async (
  connection, 
  userPublicKey, 
  options = {}
) => {
  const { retryConfig = {} } = options;
  
  if (!web3 || !PublicKey) {
    // Real blockchain environment required - no mock data
    throw new Error('Web3 connection required for checking user rewards account');
  }

  const operation = async () => {
    // Use the new modular transaction builder for account checking
    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
    const [userRewardsPda] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(userRewardsPda);
    return accountInfo !== null;
  };

  try {
    // Apply retry logic with reduced retries for read operations
    const finalRetryConfig = { 
      ...ENHANCED_COOLDOWN_CONFIG, 
      maxRetries: 2, // Fewer retries for read operations
      ...retryConfig 
    };
    
    return await retryWithJitter(
      operation,
      finalRetryConfig.maxRetries,
      finalRetryConfig.baseRetryDelay,
      finalRetryConfig.jitterFactor
    );
  } catch (error) {
    logger.error('Error checking user rewards account', { error: error.message, userPublicKey: userPublicKey.toString() });
    return false;
  }
};

/**
 * Enhanced retry logic for transactions (legacy function - use retryWithJitter for new code)
 * @param {Function} transactionFn - Function that returns a promise
 * @param {number} maxRetries - Maximum number of retry attempts  
 * @param {number} delayMs - Initial delay between retries in milliseconds
 * @returns {Promise} Result of the transaction function
 */
export const retryTransaction = async (transactionFn, maxRetries = 3, delayMs = 1000) => {
  logger.warn('retryTransaction is deprecated, use retryWithJitter for better retry logic');
  
  // Use the new enhanced retry logic for consistency
  return retryWithJitter(
    transactionFn, 
    maxRetries, 
    delayMs, 
    ENHANCED_COOLDOWN_CONFIG.jitterFactor
  );
};

/**
 * Get enhanced retry configuration options
 * @returns {Object} Available retry configuration options
 */
export const getRetryConfigOptions = () => ({
  default: ENHANCED_COOLDOWN_CONFIG,
  fast: {
    ...ENHANCED_COOLDOWN_CONFIG,
    maxRetries: 2,
    baseRetryDelay: 500,
    maxRetryDelay: 5000,
  },
  robust: {
    ...ENHANCED_COOLDOWN_CONFIG,
    maxRetries: 8,
    baseRetryDelay: 2000,
    maxRetryDelay: 60000,
    jitterFactor: 0.5,
  },
  readOnly: {
    ...ENHANCED_COOLDOWN_CONFIG,
    maxRetries: 2,
    baseRetryDelay: 200,
    maxRetryDelay: 2000,
    jitterFactor: 0.1,
  }
});

/**
 * Update cooldown configuration (admin function)
 * @param {Object} newConfig - New cooldown configuration
 */
export const updateCooldownConfig = (newConfig) => {
  Object.assign(ENHANCED_COOLDOWN_CONFIG, newConfig);
  logger.info('Cooldown configuration updated', { config: ENHANCED_COOLDOWN_CONFIG });
};

/**
 * Wait for a queued claim to complete
 * @param {string} queueId - Queue ID
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Promise<string>} Transaction signature
 */
const waitForQueuedClaim = async (queueId, rateLimiter) => {
  const maxWaitTime = 300000; // 5 minutes max wait
  const checkInterval = 2000; // Check every 2 seconds
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkStatus = () => {
      const status = rateLimiter.getQueueStatus(queueId);
      
      if (!status) {
        reject(new Error('Queue entry not found'));
        return;
      }
      
      if (status.status === 'completed') {
        // Find the completed entry to get the signature
        const entry = rateLimiter.claimQueue.find(e => e.queueId === queueId);
        if (entry && entry.signature) {
          resolve(entry.signature);
        } else {
          reject(new Error('Claim completed but no signature found'));
        }
        return;
      }
      
      if (status.status === 'failed') {
        const entry = rateLimiter.claimQueue.find(e => e.queueId === queueId);
        const errorMessage = entry?.lastError || 'Claim failed in queue';
        reject(new Error(errorMessage));
        return;
      }
      
      // Check timeout
      if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('Queue wait timeout exceeded'));
        return;
      }
      
      // Continue waiting
      setTimeout(checkStatus, checkInterval);
    };
    
    // Start checking
    setTimeout(checkStatus, checkInterval);
  });
};