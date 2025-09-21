/**
 * Rewards Actions Component
 * 
 * Extracted from the monolithic RewardDashboard for better modularity
 * Handles claim actions, auto-claim settings, and account management
 */

import React, { useState, useCallback } from 'react';
import { ButtonLoader } from '../../common';
import { UI_CONFIG } from '../../../constants/rewardConstants';

/**
 * Claim rewards button component
 */
const ClaimButton = ({ 
  onClaim, 
  disabled, 
  loading, 
  unclaimedBalance, 
  hasRewardsAccount 
}) => {
  const canClaim = unclaimedBalance > 0 && hasRewardsAccount && !disabled;
  
  return (
    <button
      onClick={onClaim}
      disabled={!canClaim || loading}
      className={`
        w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${canClaim && !loading
          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          : 'bg-gray-400 cursor-not-allowed'
        }
      `}
      aria-label={`Claim ${unclaimedBalance} tokens`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Claiming...
        </span>
      ) : (
        `Claim ${unclaimedBalance} Tokens`
      )}
    </button>
  );
};

/**
 * Create account button component
 */
const CreateAccountButton = ({ onCreate, loading }) => (
  <button
    onClick={onCreate}
    disabled={loading}
    className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
  >
    {loading ? (
      <span className="flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        Creating Account...
      </span>
    ) : (
      'Create Rewards Account'
    )}
  </button>
);

/**
 * Auto-claim settings component
 */
const AutoClaimSettings = ({ 
  autoClaimEnabled, 
  autoClaimConfig, 
  onToggleAutoClaim, 
  onUpdateThreshold 
}) => {
  const [threshold, setThreshold] = useState(autoClaimConfig.autoClaimThreshold);

  const handleThresholdChange = (e) => {
    const newThreshold = parseFloat(e.target.value);
    setThreshold(newThreshold);
    onUpdateThreshold(newThreshold);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-3">Auto-Claim Settings</h4>
      
      <div className="space-y-4">
        {/* Auto-claim toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Enable Auto-Claim</span>
          <button
            onClick={onToggleAutoClaim}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${autoClaimEnabled ? 'bg-blue-600' : 'bg-gray-300'}
            `}
            role="switch"
            aria-checked={autoClaimEnabled}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${autoClaimEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Threshold setting */}
        {autoClaimEnabled && (
          <div>
            <label htmlFor="autoClaimThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Auto-claim threshold (tokens)
            </label>
            <input
              id="autoClaimThreshold"
              type="number"
              min="1"
              step="0.1"
              value={threshold}
              onChange={handleThresholdChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically claim when unclaimed balance reaches this threshold
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Error display component
 */
const ErrorDisplay = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <div className="flex justify-between items-start">
        <div className="flex">
          <div className="text-red-600 mr-2">❌</div>
          <div>
            <h4 className="text-red-800 font-medium">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 focus:outline-none"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Main rewards actions component
 */
export const RewardsActions = ({
  // State
  rewards,
  hasRewardsAccount,
  claimLoading,
  claimError,
  autoClaimEnabled,
  autoClaimConfig,
  cooldownRemaining,
  failedClaimCooldownRemaining,
  
  // Actions
  onClaimRewards,
  onCreateAccount,
  onToggleAutoClaim,
  onUpdateAutoClaimThreshold,
  onDismissError,
  onRefreshData
}) => {
  const [createAccountLoading, setCreateAccountLoading] = useState(false);

  const handleCreateAccount = useCallback(async () => {
    setCreateAccountLoading(true);
    try {
      await onCreateAccount();
    } finally {
      setCreateAccountLoading(false);
    }
  }, [onCreateAccount]);

  const isClaimDisabled = 
    cooldownRemaining > 0 || 
    failedClaimCooldownRemaining > 0 || 
    rewards.unclaimedBalance === 0;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      <ErrorDisplay error={claimError} onDismiss={onDismissError} />

      {/* Account Status and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Actions</h3>
        
        {!hasRewardsAccount ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              You need to create a rewards account before claiming rewards.
            </p>
            <CreateAccountButton 
              onCreate={handleCreateAccount}
              loading={createAccountLoading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Claim Button */}
            <ClaimButton
              onClaim={onClaimRewards}
              disabled={isClaimDisabled}
              loading={claimLoading}
              unclaimedBalance={rewards.unclaimedBalance}
              hasRewardsAccount={hasRewardsAccount}
            />

            {/* Claim Status Info */}
            {rewards.unclaimedBalance === 0 && (
              <p className="text-center text-gray-500 text-sm">
                No rewards available to claim
              </p>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefreshData}
              className="w-full py-2 px-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Auto-Claim Settings */}
      {hasRewardsAccount && (
        <AutoClaimSettings
          autoClaimEnabled={autoClaimEnabled}
          autoClaimConfig={autoClaimConfig}
          onToggleAutoClaim={onToggleAutoClaim}
          onUpdateThreshold={onUpdateAutoClaimThreshold}
        />
      )}

      {/* Help Text */}
      <div className="text-sm text-gray-500 text-center">
        <p>Earn rewards by trading and participating in governance votes.</p>
        <p className="mt-1">
          Minimum trade volume: {UI_CONFIG.MIN_TRADE_VOLUME} SOL
        </p>
      </div>
    </div>
  );
};

export default RewardsActions;