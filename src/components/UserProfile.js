import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import ProfileHeader from './profile/ProfileHeader';
import WalletNotConnected from './WalletNotConnected';
import { useSafeWallet } from '../contexts/WalletContextProvider';
import { useProgram } from '../hooks/useProgram';
import { useUserReputation, useUserHistory, useProgramStatistics } from '../hooks/useOnChainData';
import UserStatistics from './UserStatistics';

// Lazy load components that aren't needed for initial render
const ReputationCard = lazy(() => import('./profile/ReputationCard'));
const TransactionHistory = lazy(() => import('./profile/TransactionHistory'));
const ProfileSettings = lazy(() => import('./profile/ProfileSettings'));
const TradingStats = lazy(() => import('./profile/TradingStats'));
const ActivityFeed = lazy(() => import('./profile/ActivityFeed'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="lazy-loading-container">
    <div className="loading-spinner"></div>
    <p>Loading component...</p>
  </div>
);

/**
 * Enhanced UserProfile component that integrates all the profile modules
 * Optimized for performance with React.memo, lazy loading, and hooks
 * Now uses SafeWallet context to prevent null reference errors
 * Uses real blockchain data instead of mock data
 */
const UserProfile = ({ wallet: walletProp, network, initialTab = 'overview', onTabChange }) => {
  // Use safe wallet context if no wallet prop provided
  const contextWallet = useSafeWallet();
  const wallet = walletProp || contextWallet;
  
  // Initialize program for blockchain data access
  const program = useProgram(wallet?.connection, wallet);
  
  // Real blockchain data hooks
  const { reputation, loading: reputationLoading, error: reputationError } = useUserReputation(
    program, 
    wallet?.publicKey
  );
  const { history, loading: historyLoading, error: historyError } = useUserHistory(
    program, 
    wallet?.publicKey
  );
  const { statistics: programStats, loading: statsLoading } = useProgramStatistics(program);
  
  // Initialize all hooks first (Rules of Hooks)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    reputation: null,
    transactions: [],
    settings: null,
    tradingStats: null,
    activities: []
  });
  
  // Check for valid wallet and publicKey with enhanced safety
  const hasValidPublicKey = useMemo(() => {
    try {
      return wallet && 
             wallet.connected &&
             wallet.publicKey !== null && 
             wallet.publicKey !== undefined;
    } catch (err) {
      console.warn('[UserProfile] Error checking wallet validity:', err);
      return false;
    }
  }, [wallet]);
  
  const isWalletConnected = useMemo(() => {
    return wallet && hasValidPublicKey;
  }, [wallet, hasValidPublicKey]);

  // Process real blockchain data when available
  useEffect(() => {
    if (reputation && history && !reputationLoading && !historyLoading) {
      // Convert real blockchain data to profile format with null safety
      const safeReputation = reputation || {};
      const safeHistory = history || [];
      
      const realProfileData = {
        reputation: {
          successfulTrades: safeReputation.successfulTrades || 0,
          disputedTrades: safeReputation.disputedTrades || 0,
          disputesWon: safeReputation.disputesWon || 0,
          totalTrades: safeReputation.totalTrades || 0,
          completionRate: safeReputation.successRate || 0,
          averageRating: (safeReputation.rating || 0) / 100, // Convert from 0-500 to 0-5 scale
          averageResponseTime: 'N/A', // Would need additional tracking
          disputeRate: (safeReputation.totalTrades || 0) > 0 ? 
            ((safeReputation.disputedTrades || 0) / (safeReputation.totalTrades || 1) * 100) : 0,
          lastUpdated: safeReputation.lastUpdated ? 
            new Date(safeReputation.lastUpdated).toLocaleDateString() : 'Never'
        },
        transactions: safeHistory.slice(0, 10).map(trade => ({
          id: trade.id,
          type: trade.type === 'sell' ? 'Sell' : 'Buy',
          solAmount: trade.solAmount,
          fiatAmount: trade.fiatAmount,
          fiatCurrency: trade.fiatCurrency,
          status: trade.status,
          createdAt: new Date(trade.createdAt).toLocaleDateString()
        })),
        settings: {
          displayName: 'Crypto Trader',
          bio: 'P2P trader on svmp2p protocol.',
          showReputationScore: true,
          showTransactionHistory: false,
          emailNotifications: true,
          browserNotifications: true,
          notificationFrequency: 'immediate',
          privateProfile: false,
          hideWalletAddress: false
        },
        tradingStats: {
          totalTrades: safeReputation.totalTrades || 0,
          successfulTrades: safeReputation.successfulTrades || 0,
          completionRate: safeReputation.successRate || 0,
          totalVolume: safeHistory.reduce((sum, trade) => sum + (trade.fiatAmount || 0), 0),
          buyOrders: safeHistory.filter(trade => trade.type === 'buy').length,
          sellOrders: safeHistory.filter(trade => trade.type === 'sell').length,
          disputedTrades: safeReputation.disputedTrades || 0,
          cancelledTrades: safeHistory.filter(trade => trade.status === 'Cancelled').length,
          averageResponseTime: 'N/A',
          responseTimeRating: 'average',
          periodStart: 'All time',
          periodEnd: 'Today'
        },
        activities: safeHistory.slice(0, 5).map((trade, i) => ({
          id: `activity-${trade.id}`,
          type: 'trade',
          message: `You ${trade.type === 'sell' ? 'sold' : 'bought'} ${(trade.solAmount || 0).toFixed(4)} SOL`,
          timestamp: new Date(trade.createdAt).toISOString(),
          relatedId: trade.id,
          actionable: true,
          actionText: 'View Trade',
          actionLink: `#trade-${trade.id}`
        }))
      };
      
      setProfileData(realProfileData);
      setLoading(false);
    } else if (reputationError || historyError) {
      setError('Failed to load profile data from blockchain. Please try again.');
      setLoading(false);
    }
  }, [reputation, history, reputationLoading, historyLoading, reputationError, historyError]);

  // Fetch user profile data - now using real blockchain data
  const fetchProfileData = useCallback(async () => {
    // Only fetch if wallet is connected and valid
    if (!isWalletConnected) {
      setLoading(false);
      return;
    }

    try {
      console.log('[UserProfile] Using real blockchain data from hooks');
      setLoading(reputationLoading || historyLoading);
      
      // Data is fetched automatically by the hooks
      // Processing happens in the useEffect above
      
    } catch (err) {
      console.error('Error processing profile data:', err);
      setError('Failed to load profile data. Please try again later.');
      setLoading(false);
    }
  }, [isWalletConnected, reputationLoading, historyLoading]);

  // Only fetch data when wallet connection status changes (not when loading states change)
  useEffect(() => {
    // Extra protection in case fetchProfileData changes between renders
    try {
      if (isWalletConnected) {
        // Call fetchProfileData directly to avoid dependency warning
        fetchProfileData();
      }
    } catch (err) {
      console.error('[UserProfile] Error in fetchProfileData effect:', err);
      setError('An error occurred while loading your profile');
      setLoading(false);
    }
  }, [isWalletConnected]); // Remove fetchProfileData to prevent infinite re-renders

  // Handle settings update - optimized with useCallback
  const handleSaveSettings = useCallback((newSettings) => {
    setProfileData(prevData => ({
      ...prevData,
      settings: newSettings
    }));
    
    // In a real implementation, this would save to backend
    console.log('Saving settings:', newSettings);
  }, []);

  // Handle tab change with URL update
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  }, [onTabChange]);

  // Update tab when initialTab changes (for URL navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Render tabs navigation - memoized to prevent recreation on each render
  const renderTabs = useMemo(() => (
    <div className="profile-tabs">
      <button 
        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => handleTabChange('overview')}
      >
        Overview
      </button>
      <button 
        className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
        onClick={() => handleTabChange('transactions')}
      >
        Transactions
      </button>
      <button 
        className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
        onClick={() => handleTabChange('stats')}
      >
        Statistics
      </button>
      <button 
        className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => handleTabChange('settings')}
      >
        Settings
      </button>
    </div>
  ), [activeTab, handleTabChange]);

  // Render tab content based on active tab - optimized with lazy loading
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="profile-overview">
            <div className="profile-overview-main">
              <Suspense fallback={<LoadingFallback />}>
                <ReputationCard reputation={profileData.reputation} />
              </Suspense>
              <Suspense fallback={<LoadingFallback />}>
                <ActivityFeed activities={profileData.activities} />
              </Suspense>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="profile-transactions">
            <Suspense fallback={<LoadingFallback />}>
              <TransactionHistory transactions={profileData.transactions} />
            </Suspense>
          </div>
        );
      case 'stats':
        return (
          <div className="profile-stats">
            {/* Real on-chain statistics */}
            <UserStatistics />
            
            {/* Legacy stats component for comparison */}
            <Suspense fallback={<LoadingFallback />}>
              <TradingStats stats={profileData.tradingStats} />
            </Suspense>
          </div>
        );
      case 'settings':
        return (
          <div className="profile-settings-tab">
            <Suspense fallback={<LoadingFallback />}>
              <ProfileSettings 
                settings={profileData.settings} 
                onSaveSettings={handleSaveSettings} 
              />
            </Suspense>
          </div>
        );
      default:
        return null;
    }
  }, [activeTab, profileData, handleSaveSettings]);

  // Memoize the wallet connection message
  const walletConnectionMessage = useMemo(() => (
    <WalletNotConnected message="Please connect your wallet to view your profile and transaction history." />
  ), []);

  // Memoize the loading container
  const loadingContainer = useMemo(() => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading profile data...</p>
    </div>
  ), []);

  // Bulletproof wallet address extraction with early validation
  const walletAddress = React.useMemo(() => {
    try {
      // Only extract if we have a connected wallet
      if (isWalletConnected && wallet.publicKey) {
        return wallet.publicKey.toString();
      }
      return null;
    } catch (error) {
      console.warn("[UserProfile] Error extracting wallet address:", error);
      return null;
    }
  }, [wallet, isWalletConnected]);

  // Early return for wallet not connected after all hooks are initialized  
  if (!isWalletConnected) {
    console.log('[UserProfile] No wallet connected, returning WalletNotConnected');
    return <WalletNotConnected message="Please connect your wallet to view your profile and transaction history." />;
  }

  return (
    <div className="user-profile-container">
      <h2 className="page-title">User Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      ) : (
        <div className="profile-content">
          <ProfileHeader 
            walletAddress={walletAddress}
            network={network}
            username={profileData.settings?.displayName || 'Anonymous User'}
            joinDate="Apr 2025"
            isVerified={true}
          />
          
          {renderTabs}
          
          <div className="profile-tab-content">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

UserProfile.propTypes = {
  wallet: PropTypes.shape({
    publicKey: PropTypes.object
  }),
  network: PropTypes.shape({
    name: PropTypes.string
  }),
  initialTab: PropTypes.string,
  onTabChange: PropTypes.func
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(UserProfile);
export { UserProfile };
