import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import ProfileHeader from './profile/ProfileHeader';
import WalletNotConnected from './WalletNotConnected';
import { useSafeWallet } from '../contexts/WalletContextProvider';
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
 */
const UserProfile = ({ wallet: walletProp, network, initialTab = 'overview', onTabChange }) => {
  // Use safe wallet context if no wallet prop provided
  const contextWallet = useSafeWallet();
  const wallet = walletProp || contextWallet;
  
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

  // Fetch user profile data - optimized with useCallback
  const fetchProfileData = useCallback(async () => {
    // Only fetch if wallet is connected and valid
    if (!isWalletConnected) {
      setLoading(false);
      return;
    }

    try {
      // Minimal logging to reduce console noise
      console.log('[UserProfile] Fetching profile data');

      setLoading(true);
      
      // Simulate API calls to fetch profile data
      // In a real implementation, these would be actual API calls
      
      // Mock data for demonstration
      const mockData = {
        reputation: {
          successfulTrades: 28,
          disputedTrades: 2,
          disputesWon: 1,
          totalTrades: 32,
          completionRate: 87.5,
          averageRating: 4.2,
          averageResponseTime: '15 minutes',
          disputeRate: 6.25,
          lastUpdated: new Date().toLocaleDateString()
        },
        transactions: Array.from({ length: 5 }, (_, i) => ({
          id: `tx-${i+1}`,
          type: i % 3 === 0 ? 'Buy' : i % 3 === 1 ? 'Sell' : 'Deposit',
          solAmount: Math.random() * 10 + 0.5,
          fiatAmount: Math.random() * 500 + 20,
          fiatCurrency: 'USD',
          status: i % 4 === 0 ? 'Completed' : i % 4 === 1 ? 'Pending' : i % 4 === 2 ? 'Disputed' : 'Cancelled',
          createdAt: new Date(Date.now() - i * 86400000).toLocaleDateString()
        })),
        settings: {
          displayName: 'Crypto Trader',
          bio: 'Experienced P2P trader with focus on secure transactions.',
          showReputationScore: true,
          showTransactionHistory: false,
          emailNotifications: true,
          browserNotifications: true,
          notificationFrequency: 'immediate',
          privateProfile: false,
          hideWalletAddress: false
        },
        tradingStats: {
          totalTrades: 32,
          successfulTrades: 28,
          completionRate: 87.5,
          totalVolume: 4325.75,
          buyOrders: 18,
          sellOrders: 14,
          disputedTrades: 2,
          cancelledTrades: 2,
          averageResponseTime: '15 minutes',
          responseTimeRating: 'excellent',
          periodStart: '90 days ago',
          periodEnd: 'Today'
        },
        activities: Array.from({ length: 5 }, (_, i) => ({
          id: `activity-${i+1}`,
          type: i % 5 === 0 ? 'trade' : i % 5 === 1 ? 'offer' : i % 5 === 2 ? 'dispute' : i % 5 === 3 ? 'rating' : 'system',
          message: i % 5 === 0 ? 'You completed a trade with user123' : 
                  i % 5 === 1 ? 'You created a new sell offer' :
                  i % 5 === 2 ? 'A dispute was resolved in your favor' :
                  i % 5 === 3 ? 'You received a 5-star rating' :
                  'System maintenance completed',
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          relatedId: i % 5 !== 4 ? `ref-${i+100}` : null,
          actionable: i % 3 === 0,
          actionText: i % 3 === 0 ? 'View Details' : null,
          actionLink: i % 3 === 0 ? '#' : null
        }))
      };
      
      // Simulate network delay
      setTimeout(() => {
        setProfileData(mockData);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please try again later.');
      setLoading(false);
    }
  }, [isWalletConnected]);

  // Only fetch data when wallet or network changes
  useEffect(() => {
    // Extra protection in case fetchProfileData changes between renders
    try {
      fetchProfileData();
    } catch (err) {
      console.error('[UserProfile] Error in fetchProfileData effect:', err);
      setError('An error occurred while loading your profile');
      setLoading(false);
    }
  }, [fetchProfileData]);

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
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

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
  ), [activeTab]);

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
