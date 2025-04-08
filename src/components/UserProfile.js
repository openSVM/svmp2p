import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProfileHeader from './profile/ProfileHeader';
import ReputationCard from './profile/ReputationCard';
import TransactionHistory from './profile/TransactionHistory';
import ProfileSettings from './profile/ProfileSettings';
import TradingStats from './profile/TradingStats';
import ActivityFeed from './profile/ActivityFeed';

/**
 * Enhanced UserProfile component that integrates all the profile modules
 */
const UserProfile = ({ wallet, network }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    reputation: null,
    transactions: [],
    settings: null,
    tradingStats: null,
    activities: []
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!wallet.publicKey) {
        setLoading(false);
        return;
      }

      try {
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
          transactions: Array.from({ length: 10 }, (_, i) => ({
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
    };

    fetchProfileData();
  }, [wallet.publicKey, network]);

  // Handle settings update
  const handleSaveSettings = (newSettings) => {
    setProfileData(prevData => ({
      ...prevData,
      settings: newSettings
    }));
    
    // In a real implementation, this would save to backend
    console.log('Saving settings:', newSettings);
  };

  // Render tabs navigation
  const renderTabs = () => (
    <div className="profile-tabs">
      <button 
        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </button>
      <button 
        className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
        onClick={() => setActiveTab('transactions')}
      >
        Transactions
      </button>
      <button 
        className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
        onClick={() => setActiveTab('stats')}
      >
        Statistics
      </button>
      <button 
        className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        Settings
      </button>
    </div>
  );

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="profile-overview">
            <div className="profile-overview-main">
              <ReputationCard reputation={profileData.reputation} />
              <ActivityFeed activities={profileData.activities} />
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="profile-transactions">
            <TransactionHistory transactions={profileData.transactions} />
          </div>
        );
      case 'stats':
        return (
          <div className="profile-stats">
            <TradingStats stats={profileData.tradingStats} />
          </div>
        );
      case 'settings':
        return (
          <div className="profile-settings-tab">
            <ProfileSettings 
              settings={profileData.settings} 
              onSaveSettings={handleSaveSettings} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="user-profile-container">
      <h2 className="page-title">User Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {!wallet.publicKey ? (
        <div className="connect-wallet-message">
          <p>Please connect your wallet to view your profile.</p>
        </div>
      ) : loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      ) : (
        <div className="profile-content">
          <ProfileHeader 
            walletAddress={wallet.publicKey.toString()}
            network={network}
            username={profileData.settings?.displayName}
            joinDate="Apr 2025"
            isVerified={true}
          />
          
          {renderTabs()}
          
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
  }).isRequired,
  network: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired
};

export { UserProfile };
export default UserProfile;
