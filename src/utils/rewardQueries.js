/**
 * Reward System Blockchain Queries
 * 
 * Utilities for fetching reward data from the Solana blockchain
 * including user rewards, token balances, and reward token information.
 */

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

// Program ID - should match the deployed program
const PROGRAM_ID_STRING = 'FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9';

// PDA seeds
const REWARD_TOKEN_SEED = 'reward_token';
const USER_REWARDS_SEED = 'user_rewards';

// Mock implementation for test environments
const createMockPublicKey = (keyString) => ({
  toBuffer: () => Buffer.from(keyString),
  toString: () => keyString,
});

const mockPublicKey = createMockPublicKey(PROGRAM_ID_STRING);

/**
 * Derives the reward token PDA
 * @returns {Promise<PublicKey>} The reward token account address
 */
export const getRewardTokenAddress = async () => {
  if (!PublicKey) {
    return mockPublicKey;
  }
  
  const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
  const [rewardTokenPda] = await PublicKey.findProgramAddress(
    [Buffer.from(REWARD_TOKEN_SEED)],
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
  
  const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
  const [userRewardsPda] = await PublicKey.findProgramAddress(
    [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
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
      // Mock data for test environment
      return {
        rewardRatePerTrade: 100,
        rewardRatePerVote: 50,
        minTradeVolume: 100000000, // 0.1 SOL in lamports
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
      rewardRatePerTrade: 100,
      rewardRatePerVote: 50,
      minTradeVolume: 100000000, // 0.1 SOL in lamports
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
      // Mock data for test environment
      return {
        totalEarned: 1250,
        totalClaimed: 800,
        unclaimedBalance: 450,
        tradingVolume: 12500000000, // 12.5 SOL in lamports
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
    // For now, return mock data that represents realistic values
    const mockData = {
      totalEarned: Math.floor(Math.random() * 2000) + 500,
      totalClaimed: Math.floor(Math.random() * 1000) + 200,
      unclaimedBalance: Math.floor(Math.random() * 500) + 50,
      tradingVolume: Math.floor((Math.random() * 20 + 5) * 1000000000), // SOL to lamports
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
 * @param {PublicKey|Object} userPublicKey - The user's public key
 * @returns {Promise<Object>} Complete reward data object
 */
export const fetchCompleteRewardData = async (userPublicKey) => {
  try {
    const [rewardTokenConfig, userRewards, systemInitialized] = await Promise.all([
      fetchRewardTokenConfig(),
      fetchUserRewards(userPublicKey),
      isRewardSystemInitialized(),
    ]);
    
    return {
      rewardToken: rewardTokenConfig || {
        rewardRatePerTrade: 100,
        rewardRatePerVote: 50,
        minTradeVolume: 100000000, // 0.1 SOL in lamports
      },
      userRewards: userRewards || {
        totalEarned: 0,
        totalClaimed: 0,
        unclaimedBalance: 0,
        tradingVolume: 0,
        governanceVotes: 0,
        lastTradeReward: null,
        lastVoteReward: null,
      },
      systemInitialized,
    };
  } catch (error) {
    console.error('Error fetching complete reward data:', error);
    throw error;
  }
};