/**
 * Reward System Transaction Utilities
 * 
 * Functions for executing reward-related transactions on the Solana blockchain
 * including claiming rewards, creating user reward accounts, and checking balances.
 * Enhanced with cooldown logic and jitter-based retry mechanisms.
 */

import { PROGRAM_CONFIG, COOLDOWN_CONFIG, UI_CONFIG } from '../constants/rewardConstants';

// Conditional imports to handle test environment
let web3, PublicKey, Transaction, SystemProgram, Connection;
let getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID;

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const solanaWeb3 = require('@solana/web3.js');
    const splToken = require('@solana/spl-token');
    
    web3 = solanaWeb3;
    PublicKey = solanaWeb3.PublicKey;
    Transaction = solanaWeb3.Transaction;
    SystemProgram = solanaWeb3.SystemProgram;
    Connection = solanaWeb3.Connection;
    
    getAssociatedTokenAddress = splToken.getAssociatedTokenAddress;
    createAssociatedTokenAccountInstruction = splToken.createAssociatedTokenAccountInstruction;
    TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID;
  } catch (error) {
    console.warn('Solana libraries not available, using mock implementation');
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
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${Math.round(delayWithJitter)}ms:`, error.message);
      
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
 * Claims accumulated rewards for a user with enhanced cooldown and retry logic
 * @param {Object} wallet - Wallet adapter instance
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @param {Object} options - Options for claiming (bypassCooldown, retryConfig)
 * @returns {Promise<string>} Transaction signature
 */
export const claimRewards = async (wallet, connection, userPublicKey, options = {}) => {
  const { bypassCooldown = false, retryConfig = {} } = options;
  
  // Check successful claim cooldown unless bypassed
  if (!bypassCooldown && isUserOnClaimCooldown(userPublicKey)) {
    const remaining = getRemainingCooldown(userPublicKey);
    const remainingSeconds = Math.ceil(remaining / 1000);
    throw new Error(`${UI_CONFIG.ERROR_MESSAGES.CLAIM_FAILED} Please wait ${remainingSeconds} seconds before claiming again.`);
  }
  
  // Check failed claim cooldown
  if (!bypassCooldown && isUserOnFailedClaimCooldown(userPublicKey)) {
    const remaining = getRemainingFailedClaimCooldown(userPublicKey);
    const remainingSeconds = Math.ceil(remaining / 1000);
    throw new Error(`Too many failed attempts. Please wait ${remainingSeconds} seconds before trying again.`);
  }
  
  if (!web3 || !PublicKey) {
    // Mock implementation for test environment with enhanced cooldown
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 10% chance of failure for demonstration
        if (Math.random() < 0.1) {
          setFailedClaimCooldown(userPublicKey);
          reject(new Error('Simulated transaction failure: Network congestion'));
        } else {
          // Set cooldown for successful mock claim
          setClaimCooldown(userPublicKey);
          resolve('mock_transaction_signature_' + Date.now());
        }
      }, 2000);
    });
  }

  const operation = async () => {
    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

    // Derive PDAs
    const [rewardTokenPda] = await PublicKey.findProgramAddress(
      [Buffer.from(REWARD_TOKEN_SEED)],
      PROGRAM_ID
    );

    const [userRewardsPda] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );

    const [rewardMintPda] = await PublicKey.findProgramAddress(
      [Buffer.from(REWARD_MINT_SEED)],
      PROGRAM_ID
    );

    // Get or create associated token account for user
    const userTokenAccount = await getAssociatedTokenAddress(
      rewardMintPda,
      userPublicKey
    );

    // Check if token account exists
    const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
    
    const transaction = new Transaction();

    // Create associated token account if it doesn't exist
    if (!tokenAccountInfo) {
      const createTokenAccountIx = createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        userTokenAccount, // ata
        userPublicKey, // owner
        rewardMintPda // mint
      );
      transaction.add(createTokenAccountIx);
    }

    // Add claim rewards instruction
    // Note: This would need to be replaced with actual program instruction
    const claimInstruction = SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: userPublicKey, // Placeholder
      lamports: 0, // Placeholder
    });
    
    transaction.add(claimInstruction);

    // Send transaction
    const signature = await wallet.sendTransaction(transaction, connection);
    
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
    // Mock implementation
    return Promise.resolve('mock_create_account_signature_' + Date.now());
  }

  const operation = async () => {
    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

    const [userRewardsPda] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );

    // Check if account already exists
    const accountInfo = await connection.getAccountInfo(userRewardsPda);
    if (accountInfo) {
      throw new Error('User rewards account already exists');
    }

    const transaction = new Transaction();

    // Create user rewards account instruction
    // Note: This would need to be built using the actual Anchor IDL
    const createAccountIx = {
      keys: [
        { pubkey: userRewardsPda, isSigner: false, isWritable: true },
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([]) // Would contain serialized instruction data
    };

    transaction.add(createAccountIx);

    // Send transaction
    const signature = await wallet.sendTransaction(transaction, connection);
    
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
export const hasUserRewardsAccount = async (connection, userPublicKey, options = {}) => {
  const { retryConfig = {} } = options;
  
  if (!web3 || !PublicKey) {
    // Mock implementation - randomly return true/false
    return Math.random() > 0.5;
  }

  const operation = async () => {
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
    console.error('Error checking user rewards account:', error);
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
  console.warn('retryTransaction is deprecated, use retryWithJitter for better retry logic');
  
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
  console.log('Cooldown configuration updated:', ENHANCED_COOLDOWN_CONFIG);
};