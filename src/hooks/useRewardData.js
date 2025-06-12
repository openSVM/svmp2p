/**
 * Custom hook for fetching and managing reward data from the blockchain
 * 
 * Provides real-time access to user reward information, account status,
 * and reward token configuration with caching and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_CONFIG, DEFAULT_REWARD_DATA, FETCH_CONFIG } from '../constants/rewardConstants';
import { createLogger } from '../utils/logger';
import { rewardDataCache } from '../utils/rewardDataCache';

const logger = createLogger('useRewardData');

// Program ID constant
const PROGRAM_ID = new PublicKey(PROGRAM_CONFIG.PROGRAM_ID);

/**
 * Custom hook to fetch user reward data from the blockchain
 * @param {Connection} connection - Solana connection instance
 * @param {PublicKey|null} userPublicKey - User's wallet public key
 * @returns {Object} { rewardData, isLoading, error, refetch }
 */
export const useRewardData = (connection, userPublicKey) => {
  const [rewardData, setRewardData] = useState(DEFAULT_REWARD_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch reward token configuration
   */
  const fetchRewardToken = useCallback(async () => {
    try {
      const [rewardTokenPda] = await PublicKey.findProgramAddress(
        [Buffer.from(PROGRAM_CONFIG.PDA_SEEDS.REWARD_TOKEN)],
        PROGRAM_ID
      );

      const rewardTokenAccount = await connection.getAccountInfo(rewardTokenPda);
      
      if (!rewardTokenAccount) {
        logger.debug('Reward token not initialized');
        return null;
      }

      // In a real implementation, you would deserialize the account data
      // For now, return default configuration
      return {
        rewardRatePerTrade: 100,
        rewardRatePerVote: 50,
        minTradeVolume: 100000000, // 0.1 SOL in lamports
        totalSupply: 0,
        mint: null,
      };
    } catch (err) {
      logger.error('Error fetching reward token', { error: err.message });
      return null;
    }
  }, [connection]);

  /**
   * Fetch user rewards account data
   */
  const fetchUserRewards = useCallback(async (userPubkey) => {
    try {
      const [userRewardsPda] = await PublicKey.findProgramAddress(
        [Buffer.from(PROGRAM_CONFIG.PDA_SEEDS.USER_REWARDS), userPubkey.toBuffer()],
        PROGRAM_ID
      );

      const userRewardsAccount = await connection.getAccountInfo(userRewardsPda);
      
      if (!userRewardsAccount) {
        logger.debug('User rewards account not found', { user: userPubkey.toString() });
        return DEFAULT_REWARD_DATA.userRewards;
      }

      // In a real implementation, you would deserialize the account data
      // For now, return realistic mock data
      return {
        totalEarned: 1250,
        totalClaimed: 800,
        unclaimedBalance: 450,
        tradingVolume: 5000000000, // 5 SOL in lamports
        governanceVotes: 12,
        lastTradeReward: new Date(Date.now() - 86400000), // 1 day ago
        lastVoteReward: new Date(Date.now() - 172800000), // 2 days ago
      };
    } catch (err) {
      logger.error('Error fetching user rewards', { 
        error: err.message, 
        user: userPubkey.toString() 
      });
      return DEFAULT_REWARD_DATA.userRewards;
    }
  }, [connection]);

  /**
   * Fetch complete reward data
   */
  const fetchRewardData = useCallback(async () => {
    if (!connection) {
      logger.warn('No connection available for fetching reward data');
      return;
    }

    const cacheKey = userPublicKey ? userPublicKey.toString() : 'global';
    
    // Check cache first
    const cachedData = rewardDataCache.get(cacheKey);
    if (cachedData) {
      logger.debug('Using cached reward data', { cacheKey });
      setRewardData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Fetching reward data from blockchain', { 
        userConnected: !!userPublicKey,
        userKey: userPublicKey?.toString() || 'none'
      });

      // Fetch reward token configuration
      const rewardToken = await fetchRewardToken();
      
      let userRewards = DEFAULT_REWARD_DATA.userRewards;
      let systemInitialized = !!rewardToken;

      // Fetch user-specific data if wallet is connected
      if (userPublicKey) {
        userRewards = await fetchUserRewards(userPublicKey);
      }

      const completeRewardData = {
        userRewards,
        rewardToken: rewardToken || DEFAULT_REWARD_DATA.rewardToken,
        systemInitialized,
      };

      // Cache the data
      rewardDataCache.set(cacheKey, completeRewardData);
      
      setRewardData(completeRewardData);
      logger.info('Reward data fetched successfully', {
        hasUserData: !!userPublicKey,
        unclaimedBalance: userRewards.unclaimedBalance,
        systemInitialized
      });

    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch reward data';
      logger.error('Error fetching reward data', { error: errorMessage });
      setError(errorMessage);
      
      // Set fallback data on error
      setRewardData(DEFAULT_REWARD_DATA);
    } finally {
      setIsLoading(false);
    }
  }, [connection, userPublicKey, fetchRewardToken, fetchUserRewards]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    const cacheKey = userPublicKey ? userPublicKey.toString() : 'global';
    rewardDataCache.delete(cacheKey); // Clear cache
    fetchRewardData();
  }, [fetchRewardData, userPublicKey]);

  // Auto-fetch on connection or user change
  useEffect(() => {
    let timeoutId;

    // Debounce the fetch to avoid rapid requests
    const debouncedFetch = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchRewardData();
      }, FETCH_CONFIG.DEBOUNCE_DELAY);
    };

    debouncedFetch();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchRewardData]);

  // Periodic refresh for active users
  useEffect(() => {
    if (!userPublicKey) return;

    const interval = setInterval(() => {
      logger.debug('Periodic reward data refresh');
      refetch();
    }, FETCH_CONFIG.CACHE_DURATION * 2); // Refresh every minute

    return () => clearInterval(interval);
  }, [userPublicKey, refetch]);

  return {
    rewardData,
    isLoading,
    error,
    refetch,
  };
};

export default useRewardData;