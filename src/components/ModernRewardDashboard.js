/**
 * Modern Reward Dashboard Component
 * 
 * Refactored from the original monolithic 1,165-line component into a clean,
 * modular architecture with better separation of concerns and maintainability.
 */

import React from 'react';
import { EnhancedErrorBoundary } from '../EnhancedErrorBoundary';
import { useRewards } from '../../hooks/features/useRewards';
import { RewardsDisplay } from '../features/rewards/RewardsDisplay';
import { RewardsActions } from '../features/rewards/RewardsActions';
import ConnectWalletPrompt from '../ConnectWalletPrompt';
import { usePhantomWallet } from '../../contexts/PhantomWalletProvider';

/**
 * Main dashboard header component
 */
const DashboardHeader = () => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
      Rewards Dashboard
    </h1>
    <p className="text-gray-600">
      Earn and claim rewards for trading and participating in governance
    </p>
  </div>
);

/**
 * Loading state component
 */
const DashboardLoading = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded mb-8 w-2/3"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Error state component
 */
const DashboardError = ({ error, onRetry }) => (
  <div className="text-center py-12">
    <div className="text-red-600 text-6xl mb-4">⚠️</div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">
      Something went wrong
    </h2>
    <p className="text-gray-600 mb-6">
      {error || 'Unable to load rewards dashboard'}
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    >
      Try Again
    </button>
  </div>
);

/**
 * Main reward dashboard component with improved modularity
 */
const RewardDashboard = () => {
  const { connected } = usePhantomWallet();
  
  const {
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
  } = useRewards();

  // Show wallet connection prompt if not connected
  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardHeader />
          <ConnectWalletPrompt
            title="Connect Your Wallet"
            subtitle="Connect your wallet to view and claim your rewards"
          />
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardHeader />
          <DashboardError error={error} onRetry={refreshData} />
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && !rewards.totalEarned) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main rewards display section */}
          <div className="lg:col-span-2">
            <RewardsDisplay
              rewards={rewards}
              rewardToken={rewardToken}
              loading={loading}
              cooldownRemaining={cooldownRemaining}
              failedClaimCooldownRemaining={failedClaimCooldownRemaining}
            />
          </div>
          
          {/* Actions sidebar */}
          <div className="lg:col-span-1">
            <RewardsActions
              rewards={rewards}
              hasRewardsAccount={hasRewardsAccount}
              claimLoading={claimLoading}
              claimError={claimError}
              autoClaimEnabled={autoClaimEnabled}
              autoClaimConfig={autoClaimConfig}
              cooldownRemaining={cooldownRemaining}
              failedClaimCooldownRemaining={failedClaimCooldownRemaining}
              onClaimRewards={claimReward}
              onCreateAccount={createAccount}
              onToggleAutoClaim={toggleAutoClaim}
              onUpdateAutoClaimThreshold={updateAutoClaimThreshold}
              onDismissError={dismissError}
              onRefreshData={refreshData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Wrapped component with error boundary for production stability
 */
const RewardDashboardWithErrorBoundary = () => (
  <EnhancedErrorBoundary
    fallback={
      <DashboardError 
        error="Rewards dashboard encountered an unexpected error"
        onRetry={() => window.location.reload()}
      />
    }
  >
    <RewardDashboard />
  </EnhancedErrorBoundary>
);

export default RewardDashboardWithErrorBoundary;