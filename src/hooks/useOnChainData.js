import { useState, useEffect, useCallback, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { usePhantomWallet } from '../contexts/PhantomWalletProvider';
import { createLogger } from '../utils/logger';

const logger = createLogger('useOnChainData');

/**
 * Hook to fetch real offers from the blockchain
 */
export const useOffers = (program, filters = {}) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOffers = useCallback(async (abortSignal) => {
    if (!program) {
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching offers from blockchain...');
      
      // Check if operation was aborted
      if (abortSignal?.aborted) {
        logger.info('Fetch offers operation aborted');
        return;
      }
      
      // Fetch all offer accounts
      const offerAccounts = await program.account.offer.all();
      
      // Check again after async operation
      if (abortSignal?.aborted) {
        logger.info('Fetch offers operation aborted after blockchain query');
        return;
      }
      
      const processedOffers = offerAccounts.map(({ account, publicKey }) => ({
        id: publicKey.toString(),
        seller: account.seller.toString(),
        buyer: account.buyer ? account.buyer.toString() : null,
        solAmount: parseFloat(account.amount.toString()) / 1e9, // Convert lamports to SOL
        fiatAmount: parseFloat(account.fiatAmount.toString()) / 100, // Convert cents to dollars
        fiatCurrency: account.fiatCurrency,
        paymentMethod: account.paymentMethod,
        status: getOfferStatusString(account.status),
        createdAt: account.createdAt.toNumber() * 1000, // Convert to milliseconds
        updatedAt: account.updatedAt.toNumber() * 1000,
        escrowAccount: account.escrowAccount.toString(),
        disputeId: account.disputeId ? account.disputeId.toString() : null,
        isDemo: false // Real blockchain data
      }));

      // Final abort check before setting state
      if (abortSignal?.aborted) {
        logger.info('Fetch offers operation aborted before setting state');
        return;
      }

      logger.info(`Fetched ${processedOffers.length} offers from blockchain`);

      setOffers(processedOffers);
    } catch (err) {
      if (abortSignal?.aborted) {
        logger.info('Fetch offers operation aborted due to error:', err.message);
        return;
      }
      logger.error('Error fetching offers:', err);
      setError(`Failed to fetch offers: ${err.message}`);
      setOffers([]);
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [program]); // Remove filters dependency to prevent infinite re-renders

  useEffect(() => {
    const abortController = new AbortController();
    fetchOffers(abortController.signal);
    
    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [fetchOffers]);

  // Apply filters to fetched offers
  const filteredOffers = useMemo(() => {
    let result = offers;

    if (filters?.status) {
      result = result.filter(offer => offer.status === filters.status);
    }

    if (filters?.seller) {
      result = result.filter(offer => offer.seller === filters.seller);
    }

    if (filters?.buyer) {
      result = result.filter(offer => offer.buyer === filters.buyer);
    }

    if (filters?.currency) {
      result = result.filter(offer => offer.fiatCurrency === filters.currency);
    }

    if (filters?.minAmount) {
      result = result.filter(offer => offer.solAmount >= filters.minAmount);
    }

    if (filters?.maxAmount) {
      result = result.filter(offer => offer.solAmount <= filters.maxAmount);
    }

    return result;
  }, [offers, filters]);

  const refetchOffers = useCallback(() => {
    const abortController = new AbortController();
    fetchOffers(abortController.signal);
  }, [fetchOffers]);

  return { offers: filteredOffers, loading, error, refetch: refetchOffers };
};

/**
 * Hook to fetch user reputation data
 */
export const useUserReputation = (program, userPublicKey) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReputation = useCallback(async () => {
    if (!program || !userPublicKey) {
      setReputation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching user reputation...', { user: userPublicKey.toString() });

      // Calculate PDA for user reputation
      const [reputationPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("reputation"),
          userPublicKey.toBuffer()
        ],
        program.programId
      );

      let reputationData = null;
      
      try {
        const reputationAccount = await program.account.reputation.fetch(reputationPDA);
        reputationData = {
          user: reputationAccount.user.toString(),
          successfulTrades: reputationAccount.successfulTrades,
          disputedTrades: reputationAccount.disputedTrades,
          disputesWon: reputationAccount.disputesWon,
          disputesLost: reputationAccount.disputesLost,
          rating: reputationAccount.rating,
          lastUpdated: reputationAccount.lastUpdated.toNumber() * 1000,
          totalTrades: reputationAccount.successfulTrades + reputationAccount.disputedTrades,
          successRate: reputationAccount.successfulTrades + reputationAccount.disputedTrades > 0 
            ? (reputationAccount.successfulTrades / (reputationAccount.successfulTrades + reputationAccount.disputedTrades)) * 100
            : 0,
          disputeWinRate: reputationAccount.disputesWon + reputationAccount.disputesLost > 0
            ? (reputationAccount.disputesWon / (reputationAccount.disputesWon + reputationAccount.disputesLost)) * 100
            : 0
        };

        logger.info('User reputation fetched', { reputation: reputationData });
      } catch (fetchError) {
        // Account doesn't exist yet - new user
        logger.info('No reputation account found for user (new user)');
        reputationData = {
          user: userPublicKey.toString(),
          successfulTrades: 0,
          disputedTrades: 0,
          disputesWon: 0,
          disputesLost: 0,
          rating: 0,
          lastUpdated: 0,
          totalTrades: 0,
          successRate: 0,
          disputeWinRate: 0,
          isNew: true
        };
      }

      setReputation(reputationData);
    } catch (err) {
      logger.error('Error fetching user reputation:', err);
      setError(`Failed to fetch reputation: ${err.message}`);
      setReputation(null);
    } finally {
      setLoading(false);
    }
  }, [program, userPublicKey]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchReputation(abortController.signal);
    
    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [fetchReputation]);

  const refetchReputation = useCallback(() => {
    fetchReputation();
  }, [fetchReputation]);

  return { reputation, loading, error, refetch: refetchReputation };
};

/**
 * Hook to fetch program-wide statistics
 */
export const useProgramStatistics = (program) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    if (!program) {
      setStatistics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching program statistics...');

      // Fetch all accounts to calculate statistics
      const [offers, disputes, reputations] = await Promise.all([
        program.account.offer.all(),
        program.account.dispute.all(),
        program.account.reputation.all()
      ]);

      // Calculate offer statistics
      const totalOffers = offers.length;
      const activeOffers = offers.filter(({ account }) => 
        getOfferStatusString(account.status) === 'Listed'
      ).length;
      const completedOffers = offers.filter(({ account }) => 
        getOfferStatusString(account.status) === 'Completed'
      ).length;

      // Calculate volume statistics
      const totalVolume = offers.reduce((sum, { account }) => 
        sum + parseFloat(account.amount.toString()) / 1e9, 0
      );
      const completedVolume = offers
        .filter(({ account }) => getOfferStatusString(account.status) === 'Completed')
        .reduce((sum, { account }) => sum + parseFloat(account.amount.toString()) / 1e9, 0);

      // Calculate dispute statistics
      const totalDisputes = disputes.length;
      const activeDisputes = disputes.filter(({ account }) => 
        getDisputeStatusString(account.status) !== 'Resolved'
      ).length;

      // Calculate user statistics
      const totalUsers = reputations.length;
      const activeTraders = reputations.filter(({ account }) => 
        account.successfulTrades > 0 || account.disputedTrades > 0
      ).length;

      // Calculate average rating
      const avgRating = reputations.length > 0 
        ? reputations.reduce((sum, { account }) => sum + account.rating, 0) / reputations.length 
        : 0;

      const stats = {
        offers: {
          total: totalOffers,
          active: activeOffers,
          completed: completedOffers,
          completionRate: totalOffers > 0 ? (completedOffers / totalOffers) * 100 : 0
        },
        volume: {
          total: totalVolume,
          completed: completedVolume,
          averagePerOffer: totalOffers > 0 ? totalVolume / totalOffers : 0
        },
        disputes: {
          total: totalDisputes,
          active: activeDisputes,
          resolved: totalDisputes - activeDisputes,
          resolutionRate: totalDisputes > 0 ? ((totalDisputes - activeDisputes) / totalDisputes) * 100 : 0
        },
        users: {
          total: totalUsers,
          activeTraders: activeTraders,
          averageRating: avgRating,
          participationRate: totalUsers > 0 ? (activeTraders / totalUsers) * 100 : 0
        },
        lastUpdated: Date.now()
      };

      logger.info('Program statistics calculated', { statistics: stats });
      setStatistics(stats);
    } catch (err) {
      logger.error('Error fetching program statistics:', err);
      setError(`Failed to fetch statistics: ${err.message}`);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { statistics, loading, error, refetch: fetchStatistics };
};

/**
 * Hook to fetch historical data for a user
 */
export const useUserHistory = (program, userPublicKey) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!program || !userPublicKey) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching user trade history...', { user: userPublicKey.toString() });

      // Fetch all offers where user is seller or buyer
      const allOffers = await program.account.offer.all();
      const userOffers = allOffers.filter(({ account }) => 
        account.seller.toString() === userPublicKey.toString() || 
        (account.buyer && account.buyer.toString() === userPublicKey.toString())
      );

      const processedHistory = userOffers.map(({ account, publicKey }) => ({
        id: publicKey.toString(),
        type: account.seller.toString() === userPublicKey.toString() ? 'sell' : 'buy',
        counterparty: account.seller.toString() === userPublicKey.toString() 
          ? (account.buyer ? account.buyer.toString() : null)
          : account.seller.toString(),
        solAmount: parseFloat(account.amount.toString()) / 1e9,
        fiatAmount: parseFloat(account.fiatAmount.toString()) / 100,
        fiatCurrency: account.fiatCurrency,
        paymentMethod: account.paymentMethod,
        status: getOfferStatusString(account.status),
        createdAt: account.createdAt.toNumber() * 1000,
        updatedAt: account.updatedAt.toNumber() * 1000,
        disputeId: account.disputeId ? account.disputeId.toString() : null
      }));

      // Sort by most recent first
      processedHistory.sort((a, b) => b.createdAt - a.createdAt);

      logger.info(`Fetched ${processedHistory.length} historical trades for user`);
      setHistory(processedHistory);
    } catch (err) {
      logger.error('Error fetching user history:', err);
      setError(`Failed to fetch history: ${err.message}`);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [program, userPublicKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
};

// Helper functions to convert enum values to strings
function getOfferStatusString(status) {
  const statusMap = {
    0: 'Created',
    1: 'Listed', 
    2: 'Accepted',
    3: 'AwaitingFiatPayment',
    4: 'FiatSent',
    5: 'SolReleased',
    6: 'DisputeOpened',
    7: 'Completed',
    8: 'Cancelled'
  };
  return statusMap[status] || 'Unknown';
}

function getDisputeStatusString(status) {
  const statusMap = {
    0: 'Opened',
    1: 'JurorsAssigned',
    2: 'EvidenceSubmission', 
    3: 'Voting',
    4: 'VerdictReached',
    5: 'Resolved'
  };
  return statusMap[status] || 'Unknown';
}

export default {
  useOffers,
  useUserReputation,
  useProgramStatistics,
  useUserHistory
};