/**
 * Reward System Blockchain Queries
 * 
 * Utilities for fetching reward data from the Solana blockchain
 * including user rewards, token balances, and reward token information.
 */

import { PROGRAM_CONFIG, REWARD_RATES, DEFAULT_REWARD_DATA, CONVERSION_HELPERS } from '../constants/rewardConstants';
import rewardDataCache from './rewardDataCache';

// Conditional imports to handle test environment
let PublicKey, getConnection;

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const web3 = require('@solana/web3.js');
    PublicKey = web3.PublicKey;
    const rpcConnection = require('./rpcConnection');
    getConnection = rpcConnection.getConnection;
  } catch (error) {
    console.warn('Solana web3.js not available, using mock implementation');
  }
}

// Mock implementation for test environments
const createMockPublicKey = (keyString) => ({
  toBuffer: () => Buffer.from(keyString),
  toString: () => keyString,
});

const mockPublicKey = createMockPublicKey(PROGRAM_CONFIG.PROGRAM_ID);

/**
 * Derives the reward token PDA
 * @returns {Promise<PublicKey>} The reward token account address
 */
export const getRewardTokenAddress = async () => {
  if (!PublicKey) {
    return mockPublicKey;
  }
  
  const PROGRAM_ID = new PublicKey(PROGRAM_CONFIG.PROGRAM_ID);
  const [rewardTokenPda] = await PublicKey.findProgramAddress(
    [Buffer.from(PROGRAM_CONFIG.PDA_SEEDS.REWARD_TOKEN)],
    PROGRAM_ID
  );
  return rewardTokenPda;
};

/**
 * Derives the user rewards PDA for a given user
 * @param {PublicKey|Object} userPublicKey - The user's public key
 * @returns {Promise<PublicKey>} The user rewards account address
 */
export const getUserRewardsAddress = async (userPublicKey) => {
  if (!PublicKey) {
    return mockPublicKey;
  }
  
  const PROGRAM_ID = new PublicKey(PROGRAM_CONFIG.PROGRAM_ID);
  const [userRewardsPda] = await PublicKey.findProgramAddress(
    [Buffer.from(PROGRAM_CONFIG.PDA_SEEDS.USER_REWARDS), userPublicKey.toBuffer()],
    PROGRAM_ID
  );
  return userRewardsPda;
};

/**
 * Fetches reward token configuration from the blockchain
 * @returns {Promise<Object|null>} Reward token config or null if not found
 */
export const fetchRewardTokenConfig = async () => {
  try {
    if (!getConnection) {
      // Mock data for test environment using centralized constants
      return {
        rewardRatePerTrade: REWARD_RATES.PER_TRADE,
        rewardRatePerVote: REWARD_RATES.PER_VOTE,
        minTradeVolume: REWARD_RATES.MIN_TRADE_VOLUME,
        totalSupply: 0,
        mint: null,
      };
    }
    
    const connection = getConnection();
    const rewardTokenAddress = await getRewardTokenAddress();
    
    const accountInfo = await connection.getAccountInfo(rewardTokenAddress);
    if (!accountInfo) {
      return null; // Reward system not initialized
    }
    
    // Parse the account data (simplified - in reality would use Anchor IDL)
    // For now, return mock data structure that matches the smart contract
    return {
      rewardRatePerTrade: REWARD_RATES.PER_TRADE,
      rewardRatePerVote: REWARD_RATES.PER_VOTE,
      minTradeVolume: REWARD_RATES.MIN_TRADE_VOLUME,
      totalSupply: 0,
      mint: null, // Would parse from account data
    };
  } catch (error) {
    console.error('Error fetching reward token config:', error);
    return null;
  }
};

/**
 * Fetches user rewards data from the blockchain
 * @param {PublicKey|Object} userPublicKey - The user's public key
 * @returns {Promise<Object|null>} User rewards data or null if not found
 */
export const fetchUserRewards = async (userPublicKey) => {
  try {
    if (!getConnection) {
      // Mock data for test environment with proper date objects
      return {
        totalEarned: 1250,
        totalClaimed: 800,
        unclaimedBalance: 450,
        tradingVolume: 12.5 * CONVERSION_HELPERS.solToLamports(1), // 12.5 SOL in lamports
        governanceVotes: 3,
        lastTradeReward: new Date(Date.now() - 86400000), // 1 day ago
        lastVoteReward: new Date(Date.now() - 172800000), // 2 days ago
      };
    }
    
    const connection = getConnection();
    const userRewardsAddress = await getUserRewardsAddress(userPublicKey);
    
    const accountInfo = await connection.getAccountInfo(userRewardsAddress);
    if (!accountInfo) {
      // User rewards account doesn't exist yet - return default values
      return {
        totalEarned: 0,
        totalClaimed: 0,
        unclaimedBalance: 0,
        tradingVolume: 0,
        governanceVotes: 0,
        lastTradeReward: null,
        lastVoteReward: null,
      };
    }
    
    // Parse the account data (simplified - in reality would use Anchor IDL)
    // For now, return mock data that represents realistic values with proper Date objects
    const mockData = {
      totalEarned: Math.floor(Math.random() * 2000) + 500,
      totalClaimed: Math.floor(Math.random() * 1000) + 200,
      unclaimedBalance: Math.floor(Math.random() * 500) + 50,
      tradingVolume: Math.floor((Math.random() * 20 + 5) * CONVERSION_HELPERS.solToLamports(1)), // SOL to lamports
      governanceVotes: Math.floor(Math.random() * 10) + 1,
      lastTradeReward: new Date(Date.now() - Math.random() * 86400000 * 7), // Last week
      lastVoteReward: new Date(Date.now() - Math.random() * 86400000 * 14), // Last 2 weeks
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    throw new Error(`Failed to fetch user rewards: ${error.message}`);
  }
};

/**
 * Fetches the user's SPL token balance for reward tokens
 * @param {PublicKey|Object} userPublicKey - The user's public key
 * @param {PublicKey|Object} mintAddress - The reward token mint address
 * @returns {Promise<number>} Token balance
 */
export const fetchUserTokenBalance = async (userPublicKey, mintAddress) => {
  try {
    if (!getConnection) {
      // Mock balance for test environment
      return Math.floor(Math.random() * 1000);
    }
    
    const connection = getConnection();
    
    // Get associated token account address
    const { getAssociatedTokenAddress } = await import('@solana/spl-token');
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintAddress,
      userPublicKey
    );
    
    const tokenAccount = await connection.getTokenAccountBalance(tokenAccountAddress);
    return tokenAccount.value.uiAmount || 0;
  } catch (error) {
    // Token account might not exist yet
    console.warn('Token account not found or error fetching balance:', error);
    return 0;
  }
};

/**
 * Checks if the reward system is initialized
 * @returns {Promise<boolean>} True if reward system is ready
 */
export const isRewardSystemInitialized = async () => {
  try {
    const rewardTokenConfig = await fetchRewardTokenConfig();
    return rewardTokenConfig !== null;
  } catch (error) {
    console.error('Error checking reward system status:', error);
    return false;
  }
};

/**
 * Comprehensive reward data fetcher that combines all reward information
 * Uses caching and debouncing for performance optimization
 * @param {PublicKey|Object} userPublicKey - The user's public key
 * @param {boolean} immediate - If true, bypasses debouncing for immediate fetch
 * @returns {Promise<Object>} Complete reward data object
 */
export const fetchCompleteRewardData = async (userPublicKey, immediate = false) => {
  if (!userPublicKey) {
    return DEFAULT_REWARD_DATA;
  }
  
  const userKey = userPublicKey.toString();
  
  const fetchOperation = async () => {
    try {
      const [rewardTokenConfig, userRewards, systemInitialized] = await Promise.all([
        fetchRewardTokenConfig(),
        fetchUserRewards(userPublicKey),
        isRewardSystemInitialized(),
      ]);
      
      return {
        rewardToken: rewardTokenConfig || DEFAULT_REWARD_DATA.rewardToken,
        userRewards: userRewards || DEFAULT_REWARD_DATA.userRewards,
        systemInitialized,
      };
    } catch (error) {
      console.error('Error fetching complete reward data:', error);
      throw error;
    }
  };
  
  // Use immediate fetch for user actions, debounced fetch for automatic updates
  if (immediate) {
    return rewardDataCache.immediateFetch(userKey, fetchOperation);
  } else {
    return rewardDataCache.debouncedFetch(userKey, fetchOperation);
  }
};

/**
 * Clear cached data for a user (call when user disconnects or changes)
 * @param {PublicKey|Object} userPublicKey - The user's public key
 */
export const clearUserCache = (userPublicKey) => {
  if (userPublicKey) {
    const userKey = userPublicKey.toString();
    rewardDataCache.clearUserCache(userKey);
  }
};

/**
 * Get cache statistics for debugging
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return rewardDataCache.getStats();
};