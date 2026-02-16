/**
 * useRewards - Custom hook for reward system business logic
 * 
 * Extracted from RewardDashboard.js as part of modular refactoring
 * Following React best practices for separation of concerns
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export const useRewards = (userAddress, options = {}) => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [rewards, setRewards] = useState({
    totalEarned: 0,
    pending: 0,
    available: 0,
    history: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRewards = useCallback(async () => {
    if (!userAddress) return;

    setLoading(true);
    setError(null);

    try {
      // Simulated API call - replace with actual reward fetching logic
      const mockRewards = {
        totalEarned: 1250.50,
        pending: 45.25,
        available: 1205.25,
        history: [
          { id: 1, amount: 50, date: '2024-01-15', status: 'completed' },
          { id: 2, amount: 75, date: '2024-01-14', status: 'completed' },
          { id: 3, amount: 30, date: '2024-01-13', status: 'pending' }
        ]
      };

      setRewards(mockRewards);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  const claimRewards = useCallback(async (amount) => {
    if (amount <= 0 || amount > rewards.available) {
      throw new Error('Invalid claim amount');
    }

    setLoading(true);
    try {
      // Simulated claim logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRewards(prev => ({
        ...prev,
        available: prev.available - amount,
        pending: prev.pending + amount
      }));

      return { success: true, transactionId: 'mock-tx-' + Date.now() };
    } catch (err) {
      setError(err.message || 'Failed to claim rewards');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rewards.available]);

  const refresh = useCallback(() => {
    return fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    if (userAddress) {
      fetchRewards();
    }
  }, [userAddress, fetchRewards]);

  useEffect(() => {
    if (!autoRefresh || !userAddress) return;

    const interval = setInterval(fetchRewards, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userAddress, fetchRewards]);

  const canClaim = useMemo(() => {
    return rewards.available > 0 && !loading;
  }, [rewards.available, loading]);

  const formattedRewards = useMemo(() => ({
    ...rewards,
    totalEarnedFormatted: `$${rewards.totalEarned.toFixed(2)}`,
    pendingFormatted: `$${rewards.pending.toFixed(2)}`,
    availableFormatted: `$${rewards.available.toFixed(2)}`
  }), [rewards]);

  return {
    rewards: formattedRewards,
    loading,
    error,
    lastUpdated,
    canClaim,
    claimRewards,
    refresh
  };
};

export default useRewards;
