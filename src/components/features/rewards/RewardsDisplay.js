/**
 * Rewards Display Component
 * 
 * Extracted from the monolithic RewardDashboard for better modularity
 * Handles the display of reward information with improved accessibility
 */

import React from 'react';
import { CONVERSION_HELPERS } from '../../../constants/rewardConstants';

/**
 * Individual reward metric card component
 */
const RewardMetricCard = ({ title, value, subtitle, icon, colorClass = 'bg-blue-50 border-blue-200' }) => (
  <div className={`p-4 rounded-lg border ${colorClass}`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {icon && (
        <div className="text-3xl opacity-60" role="img" aria-hidden="true">
          {icon}
        </div>
      )}
    </div>
  </div>
);

/**
 * Cooldown status indicator component
 */
const CooldownIndicator = ({ cooldownRemaining, failedClaimCooldownRemaining }) => {
  if (cooldownRemaining <= 0 && failedClaimCooldownRemaining <= 0) {
    return null;
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const isFailedCooldown = failedClaimCooldownRemaining > 0;
  const timeRemaining = isFailedCooldown ? failedClaimCooldownRemaining : cooldownRemaining;
  const message = isFailedCooldown 
    ? 'Too many failed attempts. Please wait before trying again.'
    : 'Claim cooldown active. Please wait before claiming again.';

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center">
        <div className="text-yellow-600 mr-2">⏱️</div>
        <div>
          <p className="text-sm text-yellow-800 font-medium">{message}</p>
          <p className="text-xs text-yellow-600">Time remaining: {formatTime(timeRemaining)}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main rewards display component
 */
export const RewardsDisplay = ({ 
  rewards, 
  rewardToken, 
  loading, 
  cooldownRemaining, 
  failedClaimCooldownRemaining 
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cooldown Indicator */}
      <CooldownIndicator 
        cooldownRemaining={cooldownRemaining}
        failedClaimCooldownRemaining={failedClaimCooldownRemaining}
      />

      {/* Reward Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RewardMetricCard
          title="Unclaimed Balance"
          value={CONVERSION_HELPERS.formatTokenAmount(rewards.unclaimedBalance)}
          subtitle="Available to claim"
          icon="💰"
          colorClass="bg-green-50 border-green-200"
        />
        
        <RewardMetricCard
          title="Total Earned"
          value={CONVERSION_HELPERS.formatTokenAmount(rewards.totalEarned)}
          subtitle="All-time earnings"
          icon="🏆"
          colorClass="bg-blue-50 border-blue-200"
        />
        
        <RewardMetricCard
          title="Total Claimed"
          value={CONVERSION_HELPERS.formatTokenAmount(rewards.totalClaimed)}
          subtitle="Successfully claimed"
          icon="✅"
          colorClass="bg-purple-50 border-purple-200"
        />
        
        <RewardMetricCard
          title="Trading Volume"
          value={CONVERSION_HELPERS.formatSolAmount(rewards.tradingVolume)}
          subtitle="SOL traded"
          icon="📈"
          colorClass="bg-yellow-50 border-yellow-200"
        />
        
        <RewardMetricCard
          title="Governance Votes"
          value={rewards.governanceVotes.toString()}
          subtitle="Proposals voted on"
          icon="🗳️"
          colorClass="bg-indigo-50 border-indigo-200"
        />
        
        <RewardMetricCard
          title="Last Trade Reward"
          value={CONVERSION_HELPERS.formatTokenAmount(rewards.lastTradeReward)}
          subtitle="Most recent"
          icon="💎"
          colorClass="bg-pink-50 border-pink-200"
        />
      </div>

      {/* Reward Rates Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Reward Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Per Trade:</span>
            <span className="font-semibold text-gray-900">
              {CONVERSION_HELPERS.formatTokenAmount(rewardToken.rewardRatePerTrade)} tokens
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Per Vote:</span>
            <span className="font-semibold text-gray-900">
              {CONVERSION_HELPERS.formatTokenAmount(rewardToken.rewardRatePerVote)} tokens
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Min Trade Volume:</span>
            <span className="font-semibold text-gray-900">
              {CONVERSION_HELPERS.formatSolAmount(rewardToken.minTradeVolume)} SOL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsDisplay;