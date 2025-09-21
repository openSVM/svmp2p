/**
 * Custom hook for rewards management
 * 
 * Extracted business logic from RewardDashboard for better separation of concerns
 * Provides a clean interface for reward-related operations
 */

import { useState, useEffect, useCallback } from 'react';
import { usePhantomWallet } from '../../contexts/PhantomWalletProvider';
import { fetchCompleteRewardData, clearUserCache } from '../../utils/rewardQueries';
import { 
  claimRewards, 
  retryTransaction, 
  hasUserRewardsAccount, 
  createUserRewardsAccount, 
  isUserOnClaimCooldown, 
  isUserOnFailedClaimCooldown,
  getRemainingCooldown, 
  getRemainingFailedClaimCooldown,
} from '../../utils/rewardTransactions';
import { useAutoClaimManager } from '../useAutoClaimManager';
import { 
  AUTO_CLAIM_CONFIG,
  DEFAULT_REWARD_DATA,
  UI_CONFIG
} from '../../constants/rewardConstants';

/**
 * Custom hook for managing rewards state and operations
 */
export const useRewards = () => {
  const { publicKey, connected, wallet } = usePhantomWallet();
  const autoClaimManager = useAutoClaimManager(wallet, null);

  // Core reward state
  const [rewards, setRewards] = useState(DEFAULT_REWARD_DATA.userRewards);
  const [rewardToken, setRewardToken] = useState(DEFAULT_REWARD_DATA.rewardToken);
  const [hasRewardsAccount, setHasRewardsAccount] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimError, setClaimError] = useState(null);

  // Cooldown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [failedClaimCooldownRemaining, setFailedClaimCooldownRemaining] = useState(0);

  // Auto-claim configuration
  const [autoClaimEnabled, setAutoClaimEnabled] = useState(AUTO_CLAIM_CONFIG.DEFAULT_ENABLED);
  const [autoClaimConfig, setAutoClaimConfig] = useState({
    autoClaimThreshold: AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD
  });

  /**
   * Fetch reward data from blockchain
   */
  const fetchData = useCallback(async (immediate = false) => {
    if (!connected || !publicKey) {
      setRewards(DEFAULT_REWARD_DATA.userRewards);
      setRewardToken(DEFAULT_REWARD_DATA.rewardToken);
      setHasRewardsAccount(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [rewardData, accountExists] = await Promise.all([
        fetchCompleteRewardData(publicKey, immediate),
        hasUserRewardsAccount(null, publicKey)
      ]);
      
      setHasRewardsAccount(accountExists);
      
      setRewards({
        totalEarned: rewardData.userRewards.totalEarned,
        totalClaimed: rewardData.userRewards.totalClaimed,
        unclaimedBalance: rewardData.userRewards.unclaimedBalance,
        tradingVolume: rewardData.userRewards.tradingVolume,
        governanceVotes: rewardData.userRewards.governanceVotes,
        lastTradeReward: rewardData.userRewards.lastTradeReward,
        lastVoteReward: rewardData.userRewards.lastVoteReward
      });
      
      setRewardToken({
        rewardRatePerTrade: rewardData.rewardToken.rewardRatePerTrade,
        rewardRatePerVote: rewardData.rewardToken.rewardRatePerVote,
        minTradeVolume: rewardData.rewardToken.minTradeVolume
      });
      
      // Update cooldown status
      setCooldownRemaining(
        isUserOnClaimCooldown(publicKey) ? getRemainingCooldown(publicKey) : 0
      );
      setFailedClaimCooldownRemaining(
        isUserOnFailedClaimCooldown(publicKey) ? getRemainingFailedClaimCooldown(publicKey) : 0
      );
      
    } catch (err) {
      console.error('Failed to fetch reward data:', err);
      setError(`Failed to load reward data: ${err.message}`);
      
      // Fallback to default values on error
      setRewards(DEFAULT_REWARD_DATA.userRewards);
      setRewardToken(DEFAULT_REWARD_DATA.rewardToken);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  /**
   * Create user rewards account
   */
  const createAccount = useCallback(async () => {
    if (!connected || !wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Creating user rewards account...');
      await retryTransaction(() => 
        createUserRewardsAccount(wallet, null, publicKey)
      );
      setHasRewardsAccount(true);
      
      // Refresh data after account creation
      await fetchData(true);
    } catch (accountError) {
      const errorMessage = `${UI_CONFIG.ERROR_MESSAGES.ACCOUNT_CREATION_FAILED}: ${accountError.message}`;
      setClaimError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [connected, wallet, publicKey, fetchData]);

  /**
   * Claim rewards
   */
  const claimReward = useCallback(async () => {
    if (!connected || !wallet || rewards.unclaimedBalance === 0) return;
    
    // Check cooldowns
    if (isUserOnClaimCooldown(publicKey)) {
      const remaining = getRemainingCooldown(publicKey);
      const remainingSeconds = Math.ceil(remaining / 1000);
      const errorMessage = `Claim cooldown active. Please wait ${remainingSeconds} seconds before claiming again.`;
      setClaimError(errorMessage);
      return;
    }
    
    if (isUserOnFailedClaimCooldown(publicKey)) {
      const remaining = getRemainingFailedClaimCooldown(publicKey);
      const remainingSeconds = Math.ceil(remaining / 1000);
      const errorMessage = `Too many failed attempts. Please wait ${remainingSeconds} seconds before trying again.`;
      setClaimError(errorMessage);
      return;
    }
    
    setClaimLoading(true);
    setClaimError(null);
    
    try {
      // Ensure rewards account exists
      if (!hasRewardsAccount) {
        await createAccount();
      }

      // Execute claim transaction
      const signature = await claimRewards(wallet, null, publicKey, {
        retryConfig: {
          maxRetries: 5,
          baseRetryDelay: 1500,
          jitterFactor: 0.3
        }
      });
      
      console.log('Rewards claimed successfully! Transaction:', signature);
      
      // Update local state on success
      const claimedAmount = rewards.unclaimedBalance;
      setRewards(prev => ({
        ...prev,
        totalClaimed: prev.totalClaimed + claimedAmount,
        unclaimedBalance: 0
      }));
      
      // Update cooldown status
      setCooldownRemaining(getRemainingCooldown(publicKey));
      
      // Refresh full data to ensure consistency
      setTimeout(() => fetchData(true), 2000);
      
    } catch (err) {
      console.error('Claim failed:', err);
      const errorMessage = err.message.includes('insufficient funds') 
        ? 'Insufficient funds for transaction fees'
        : `Claim failed: ${err.message}`;
      setClaimError(errorMessage);
      
      // Update failed claim cooldown
      setFailedClaimCooldownRemaining(getRemainingFailedClaimCooldown(publicKey));
    } finally {
      setClaimLoading(false);
    }
  }, [connected, wallet, publicKey, rewards.unclaimedBalance, hasRewardsAccount, createAccount, fetchData]);

  /**
   * Toggle auto-claim functionality
   */
  const toggleAutoClaim = useCallback(() => {
    const newEnabled = !autoClaimEnabled;
    setAutoClaimEnabled(newEnabled);
    
    if (autoClaimManager) {
      autoClaimManager.setEnabled(newEnabled);
    }
  }, [autoClaimEnabled, autoClaimManager]);

  /**
   * Update auto-claim threshold
   */
  const updateAutoClaimThreshold = useCallback((threshold) => {
    setAutoClaimConfig(prev => ({
      ...prev,
      autoClaimThreshold: threshold
    }));
    
    if (autoClaimManager) {
      autoClaimManager.updateConfig({ autoClaimThreshold: threshold });
    }
  }, [autoClaimManager]);

  /**
   * Dismiss error messages
   */
  const dismissError = useCallback(() => {
    setError(null);
    setClaimError(null);
  }, []);

  /**
   * Refresh data manually
   */
  const refreshData = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Initialize data fetch
  useEffect(() => {
    fetchData();
    
    // Clear cache when wallet changes
    return () => {
      if (publicKey) {
        clearUserCache(publicKey);
      }
    };
  }, [fetchData, publicKey]);

  // Update auto-claim configuration from manager
  useEffect(() => {
    if (autoClaimManager) {
      const config = autoClaimManager.getConfig();
      setAutoClaimConfig(config);
      setAutoClaimEnabled(config.enabled);
    }
  }, [autoClaimManager]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownRemaining > 0 || failedClaimCooldownRemaining > 0) {
      const interval = setInterval(() => {
        if (publicKey) {
          const successRemaining = getRemainingCooldown(publicKey);
          const failedRemaining = getRemainingFailedClaimCooldown(publicKey);
          
          setCooldownRemaining(successRemaining);
          setFailedClaimCooldownRemaining(failedRemaining);
          
          if (successRemaining <= 0 && failedRemaining <= 0) {
            clearInterval(interval);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cooldownRemaining, failedClaimCooldownRemaining, publicKey]);

  return {
    // State
    rewards,
    rewardToken,
    hasRewardsAccount,
    loading,
    claimLoading,
    error,
    claimError,
    cooldownRemaining,
    failedClaimCooldownRemaining,
    autoClaimEnabled,
    autoClaimConfig,
    
    // Actions
    claimReward,
    createAccount,
    toggleAutoClaim,
    updateAutoClaimThreshold,
    dismissError,
    refreshData,
    
    // Computed values
    canClaim: hasRewardsAccount && 
              rewards.unclaimedBalance > 0 && 
              cooldownRemaining === 0 && 
              failedClaimCooldownRemaining === 0,
  };
};

export default useRewards;