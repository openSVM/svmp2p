import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchCompleteRewardData } from '../utils/rewardQueries';
import { claimRewards, retryTransaction, hasUserRewardsAccount, createUserRewardsAccount, isUserOnClaimCooldown, getRemainingCooldown, getCooldownStats } from '../utils/rewardTransactions';
import { useAutoClaimManager } from '../utils/autoClaimManager';

const RewardDashboard = () => {
    const { publicKey, connected, wallet } = useWallet();
    const autoClaimManager = useAutoClaimManager(wallet, null); // connection would be passed in real implementation
    const [rewards, setRewards] = useState({
        totalEarned: 0,
        totalClaimed: 0,
        unclaimedBalance: 0,
        tradingVolume: 0,
        governanceVotes: 0,
        lastTradeReward: null,
        lastVoteReward: null
    });
    const [rewardToken, setRewardToken] = useState({
        rewardRatePerTrade: 100,
        rewardRatePerVote: 50,
        minTradeVolume: 100000000 // 0.1 SOL in lamports
    });
    const [loading, setLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [error, setError] = useState(null);
    const [claimError, setClaimError] = useState(null);
    const [hasRewardsAccount, setHasRewardsAccount] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [autoClaimEnabled, setAutoClaimEnabled] = useState(false);
    const [autoClaimConfig, setAutoClaimConfig] = useState({});

    // Fetch real data from blockchain
    useEffect(() => {
        const fetchData = async () => {
            if (!connected || !publicKey) {
                setRewards({
                    totalEarned: 0,
                    totalClaimed: 0,
                    unclaimedBalance: 0,
                    tradingVolume: 0,
                    governanceVotes: 0,
                    lastTradeReward: null,
                    lastVoteReward: null
                });
                setRewardToken({
                    rewardRatePerTrade: 100,
                    rewardRatePerVote: 50,
                    minTradeVolume: 100000000 // 0.1 SOL in lamports
                });
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                const [rewardData, accountExists] = await Promise.all([
                    fetchCompleteRewardData(publicKey),
                    hasUserRewardsAccount(null, publicKey) // connection would be passed in real implementation
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
                
                // Check cooldown status
                if (isUserOnClaimCooldown(publicKey)) {
                    setCooldownRemaining(getRemainingCooldown(publicKey));
                } else {
                    setCooldownRemaining(0);
                }
                
            } catch (err) {
                console.error('Failed to fetch reward data:', err);
                setError(`Failed to load reward data: ${err.message}`);
                
                // Fallback to default values on error
                setRewards({
                    totalEarned: 0,
                    totalClaimed: 0,
                    unclaimedBalance: 0,
                    tradingVolume: 0,
                    governanceVotes: 0,
                    lastTradeReward: null,
                    lastVoteReward: null
                });
                setRewardToken({
                    rewardRatePerTrade: 100,
                    rewardRatePerVote: 50,
                    minTradeVolume: 100000000 // 0.1 SOL in lamports
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [connected, publicKey]);

    // Update auto-claim configuration
    useEffect(() => {
        if (autoClaimManager) {
            const config = autoClaimManager.getConfig();
            setAutoClaimConfig(config);
            setAutoClaimEnabled(config.enabled);
        }
    }, [autoClaimManager]);

    // Update cooldown countdown
    useEffect(() => {
        if (cooldownRemaining > 0) {
            const interval = setInterval(() => {
                const remaining = publicKey ? getRemainingCooldown(publicKey) : 0;
                setCooldownRemaining(remaining);
                
                if (remaining <= 0) {
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [cooldownRemaining, publicKey]);

    const handleClaimRewards = async () => {
        if (!connected || !wallet || rewards.unclaimedBalance === 0) return;
        
        // Check cooldown
        if (isUserOnClaimCooldown(publicKey)) {
            const remaining = getRemainingCooldown(publicKey);
            const remainingSeconds = Math.ceil(remaining / 1000);
            setClaimError(`Claim cooldown active. Please wait ${remainingSeconds} seconds before claiming again.`);
            return;
        }
        
        setClaimLoading(true);
        setClaimError(null);
        
        try {
            // Check if user has rewards account first
            if (!hasRewardsAccount) {
                try {
                    console.log('Creating user rewards account...');
                    await retryTransaction(() => 
                        createUserRewardsAccount(wallet, null, publicKey) // connection would be passed in real implementation
                    );
                    setHasRewardsAccount(true);
                } catch (accountError) {
                    throw new Error(`Failed to create rewards account: ${accountError.message}`);
                }
            }

            // Execute claim transaction with enhanced retry logic
            const signature = await claimRewards(wallet, null, publicKey, {
                retryConfig: {
                    maxRetries: 5,
                    baseRetryDelay: 1500,
                    jitterFactor: 0.3
                }
            });
            
            console.log('Rewards claimed successfully! Transaction:', signature);
            
            // Update local state on success
            setRewards(prev => ({
                ...prev,
                totalClaimed: prev.totalClaimed + prev.unclaimedBalance,
                unclaimedBalance: 0
            }));
            
            // Update cooldown status
            setCooldownRemaining(getRemainingCooldown(publicKey));
            
            // Reset retry count on success
            setRetryCount(0);
            
            // Show success notification
            console.log('Rewards claimed successfully!');
        } catch (error) {
            console.error('Failed to claim rewards:', error);
            setRetryCount(prev => prev + 1);
            
            // Provide user-friendly error messages
            let errorMessage = error.message || 'Failed to claim rewards. Please try again.';
            
            if (error.message?.includes('User rejected')) {
                errorMessage = 'Transaction was cancelled by user.';
            } else if (error.message?.includes('Insufficient')) {
                errorMessage = 'Insufficient SOL for transaction fees. Please ensure you have enough SOL in your wallet.';
            } else if (error.message?.includes('Network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message?.includes('cooldown')) {
                errorMessage = error.message; // Use the cooldown message as-is
            } else if (retryCount >= 2) {
                errorMessage = `Transaction failed after multiple attempts. Please try again later. Last error: ${error.message}`;
            }
            
            setClaimError(errorMessage);
        } finally {
            setClaimLoading(false);
        }
    };

    const handleAutoClaimToggle = () => {
        if (autoClaimManager) {
            const newConfig = { enabled: !autoClaimEnabled };
            autoClaimManager.updateConfig(newConfig);
            setAutoClaimEnabled(!autoClaimEnabled);
        }
    };

    const handleAutoClaimThresholdChange = (newThreshold) => {
        if (autoClaimManager) {
            autoClaimManager.updateConfig({ autoClaimThreshold: newThreshold });
            setAutoClaimConfig(prev => ({ ...prev, autoClaimThreshold: newThreshold }));
        }
    };

    const triggerManualAutoClaimCheck = async () => {
        if (autoClaimManager && autoClaimEnabled) {
            try {
                await autoClaimManager.triggerCheck();
                console.log('Manual auto-claim check triggered');
            } catch (error) {
                console.error('Failed to trigger auto-claim check:', error);
                setClaimError(`Auto-claim check failed: ${error.message}`);
            }
        }
    };

    const progressToNextReward = () => {
        // Convert lamports to SOL for display (1 SOL = 1e9 lamports)
        const LAMPORTS_PER_SOL = 1000000000;
        const tradingVolumeSOL = rewards.tradingVolume / LAMPORTS_PER_SOL;
        const minTradeVolumeSOL = rewardToken.minTradeVolume / LAMPORTS_PER_SOL;
        
        // Calculate progress toward next reward threshold
        const nextThreshold = Math.ceil(tradingVolumeSOL / minTradeVolumeSOL) * minTradeVolumeSOL;
        const currentProgress = tradingVolumeSOL % minTradeVolumeSOL;
        const progress = (currentProgress / minTradeVolumeSOL) * 100;
        
        return { nextThreshold, progress: Math.max(0, Math.min(100, progress)) };
    };

    if (!connected) {
        return (
            <div className="reward-dashboard-container">
                <div className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-4">Loyalty Rewards</h3>
                    <p className="text-gray-600">Connect your wallet to view your rewards</p>
                </div>
            </div>
        );
    }

    const { nextThreshold, progress } = progressToNextReward();

    return (
        <div className="reward-dashboard-container">
            <div className="reward-dashboard">
                <div className="dashboard-header">
                    <h2 className="text-2xl font-bold mb-2">🎁 Loyalty Rewards</h2>
                    <p className="text-gray-600">Earn tokens through trading and governance participation</p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="loading-card">
                        <div className="loading-spinner"></div>
                        <p>Loading your reward data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="error-card">
                        <div className="error-icon">⚠️</div>
                        <h3>Failed to Load Rewards</h3>
                        <p>{error}</p>
                        <button 
                            className="retry-button"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Main Content - only show when not loading and no error */}
                {!loading && !error && (
                    <>
                        {/* Claim Error Alert */}
                        {claimError && (
                            <div className="claim-error-alert">
                                <div className="alert-content">
                                    <span className="alert-icon">❌</span>
                                    <div className="alert-text">
                                        <strong>Claim Failed {retryCount > 0 && `(Attempt ${retryCount})`}</strong>
                                        <p>{claimError}</p>
                                        {retryCount < 3 && (
                                            <button 
                                                className="retry-claim-button"
                                                onClick={handleClaimRewards}
                                                disabled={claimLoading}
                                            >
                                                {claimLoading ? 'Retrying...' : 'Try Again'}
                                            </button>
                                        )}
                                    </div>
                                    <button 
                                        className="alert-close"
                                        onClick={() => setClaimError(null)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}

                {/* Reward Balance Card */}
                <div className="reward-card balance-card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Your Rewards</h3>
                        <div className="reward-icon">💎</div>
                    </div>
                    
                    <div className="balance-stats">
                        <div className="stat-item">
                            <span className="stat-label">Unclaimed Balance</span>
                            <span className="stat-value primary">{rewards.unclaimedBalance} tokens</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Earned</span>
                            <span className="stat-value">{rewards.totalEarned} tokens</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Claimed</span>
                            <span className="stat-value">{rewards.totalClaimed} tokens</span>
                        </div>
                    </div>

                    <button 
                        className={`claim-button ${rewards.unclaimedBalance === 0 ? 'disabled' : ''}`}
                        onClick={handleClaimRewards}
                        disabled={rewards.unclaimedBalance === 0 || claimLoading}
                    >
                        {claimLoading ? 'Claiming...' : `Claim ${rewards.unclaimedBalance} Tokens`}
                    </button>
                </div>

                {/* Activity Stats Card */}
                <div className="reward-card activity-card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Activity Stats</h3>
                        <div className="reward-icon">📊</div>
                    </div>
                    
                    <div className="activity-stats">
                        <div className="stat-row">
                            <span className="stat-label">Trading Volume</span>
                            <span className="stat-value">{(rewards.tradingVolume / 1000000000).toFixed(2)} SOL</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Governance Votes</span>
                            <span className="stat-value">{rewards.governanceVotes} votes</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Last Trade Reward</span>
                            <span className="stat-value">
                                {rewards.lastTradeReward ? 
                                    rewards.lastTradeReward.toLocaleDateString() : 
                                    'Never'
                                }
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Last Vote Reward</span>
                            <span className="stat-value">
                                {rewards.lastVoteReward ? 
                                    rewards.lastVoteReward.toLocaleDateString() : 
                                    'Never'
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="reward-card progress-card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Progress to Next Reward</h3>
                        <div className="reward-icon">🎯</div>
                    </div>
                    
                    <div className="progress-content">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="progress-text">
                            {progress.toFixed(1)}% to next {rewardToken.rewardRatePerTrade} token reward
                        </p>
                        <p className="progress-hint">
                            Complete trades worth {(rewardToken.minTradeVolume / 1000000000).toFixed(1)}+ SOL to earn rewards
                        </p>
                    </div>
                </div>

                {/* Reward Rates Card */}
                <div className="reward-card rates-card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Reward Rates</h3>
                        <div className="reward-icon">⚡</div>
                    </div>
                    
                    <div className="rates-content">
                        <div className="rate-item">
                            <span className="rate-label">Per Trade</span>
                            <span className="rate-value">{rewardToken.rewardRatePerTrade} tokens</span>
                        </div>
                        <div className="rate-item">
                            <span className="rate-label">Per Vote</span>
                            <span className="rate-value">{rewardToken.rewardRatePerVote} tokens</span>
                        </div>
                        <div className="rate-item">
                            <span className="rate-label">Min Trade Volume</span>
                            <span className="rate-value">{(rewardToken.minTradeVolume / 1000000000).toFixed(1)} SOL</span>
                        </div>
                    </div>
                </div>

                {/* Auto-Claim Configuration Card */}
                <div className="reward-card auto-claim-card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Auto-Claim Settings</h3>
                        <div className="reward-icon">🤖</div>
                    </div>
                    
                    <div className="auto-claim-content">
                        <div className="setting-row">
                            <span className="setting-label">Enable Auto-Claim</span>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={autoClaimEnabled}
                                    onChange={handleAutoClaimToggle}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        
                        {autoClaimEnabled && (
                            <>
                                <div className="setting-row">
                                    <span className="setting-label">Auto-Claim Threshold</span>
                                    <div className="threshold-input">
                                        <input
                                            type="number"
                                            value={autoClaimConfig.autoClaimThreshold || 1000}
                                            onChange={(e) => handleAutoClaimThresholdChange(parseInt(e.target.value))}
                                            min="100"
                                            max="10000"
                                            step="100"
                                        />
                                        <span className="input-suffix">tokens</span>
                                    </div>
                                </div>
                                
                                <div className="setting-row">
                                    <span className="setting-label">Status</span>
                                    <span className="status-value">
                                        {autoClaimManager?.isRunning ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                </div>
                                
                                <button 
                                    className="manual-check-button"
                                    onClick={triggerManualAutoClaimCheck}
                                    disabled={!autoClaimEnabled || claimLoading}
                                >
                                    {claimLoading ? 'Checking...' : 'Check Now'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Cooldown Status Card */}
                {cooldownRemaining > 0 && (
                    <div className="reward-card cooldown-card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold">Claim Cooldown</h3>
                            <div className="reward-icon">⏰</div>
                        </div>
                        
                        <div className="cooldown-content">
                            <div className="cooldown-timer">
                                <span className="timer-value">
                                    {Math.ceil(cooldownRemaining / 1000)}
                                </span>
                                <span className="timer-label">seconds remaining</span>
                            </div>
                            <div className="cooldown-progress">
                                <div 
                                    className="cooldown-fill"
                                    style={{ 
                                        width: `${((60000 - cooldownRemaining) / 60000) * 100}%` 
                                    }}
                                ></div>
                            </div>
                            <p className="cooldown-hint">
                                Claims are rate-limited to prevent spam and ensure network stability.
                            </p>
                        </div>
                    </div>
                )}
                </>
                )}
            </div>

            <style jsx>{`
                .reward-dashboard-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .reward-dashboard {
                    display: grid;
                    gap: 20px;
                }

                .dashboard-header {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .reward-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .reward-icon {
                    font-size: 24px;
                }

                /* Auto-Claim Styles */
                .auto-claim-content {
                    display: grid;
                    gap: 16px;
                }

                .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                }

                .setting-label {
                    font-weight: 500;
                    color: #374151;
                }

                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 24px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }

                input:checked + .toggle-slider {
                    background-color: #7c3aed;
                }

                input:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }

                .threshold-input {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .threshold-input input {
                    width: 80px;
                    padding: 4px 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .input-suffix {
                    font-size: 12px;
                    color: #6b7280;
                }

                .status-value {
                    font-weight: 600;
                    font-size: 14px;
                }

                .manual-check-button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                    justify-self: start;
                }

                .manual-check-button:hover:not(:disabled) {
                    background: #2563eb;
                }

                .manual-check-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                /* Cooldown Styles */
                .cooldown-content {
                    text-align: center;
                }

                .cooldown-timer {
                    margin-bottom: 16px;
                }

                .timer-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #dc2626;
                    display: block;
                }

                .timer-label {
                    font-size: 14px;
                    color: #6b7280;
                }

                .cooldown-progress {
                    width: 100%;
                    height: 6px;
                    background: #f3f4f6;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }

                .cooldown-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #dc2626, #f97316);
                    transition: width 0.3s ease;
                }

                .cooldown-hint {
                    font-size: 12px;
                    color: #6b7280;
                    margin: 0;
                }

                .cooldown-card {
                    border-color: #fecaca;
                    background: #fef2f2;
                }

                .balance-stats {
                    display: grid;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .stat-label {
                    color: #6b7280;
                    font-size: 14px;
                }

                .stat-value {
                    font-weight: 600;
                    font-size: 16px;
                }

                .stat-value.primary {
                    color: #7c3aed;
                    font-size: 18px;
                }

                .claim-button {
                    width: 100%;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .claim-button:hover:not(.disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
                }

                .claim-button.disabled {
                    background: #e5e7eb;
                    color: #9ca3af;
                    cursor: not-allowed;
                }

                .activity-stats, .rates-content {
                    display: grid;
                    gap: 12px;
                }

                .stat-row, .rate-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #f3f4f6;
                }

                .stat-row:last-child, .rate-item:last-child {
                    border-bottom: none;
                }

                .progress-content {
                    display: grid;
                    gap: 12px;
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #7c3aed, #a855f7);
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-weight: 600;
                    text-align: center;
                    margin: 0;
                }

                .progress-hint {
                    font-size: 14px;
                    color: #6b7280;
                    text-align: center;
                    margin: 0;
                }

                .rate-value {
                    color: #059669;
                    font-weight: 600;
                }

                /* Loading and Error States */
                .loading-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    text-align: center;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #7c3aed;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .error-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border: 1px solid #fecaca;
                    text-align: center;
                }

                .error-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .retry-button {
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 16px;
                    transition: background 0.2s;
                }

                .retry-button:hover {
                    background: #dc2626;
                }

                .claim-error-alert {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                }

                .alert-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .alert-icon {
                    font-size: 20px;
                    margin-top: 2px;
                }

                .alert-text {
                    flex: 1;
                }

                .alert-text strong {
                    color: #dc2626;
                    font-weight: 600;
                }

                .alert-text p {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 4px 0 0 0;
                }

                .alert-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .alert-close:hover {
                    color: #6b7280;
                }

                .retry-claim-button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    margin-top: 8px;
                    transition: background 0.2s;
                }

                .retry-claim-button:hover:not(:disabled) {
                    background: #2563eb;
                }

                .retry-claim-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .reward-dashboard-container {
                        padding: 16px;
                    }

                    .reward-card {
                        padding: 20px;
                    }

                    .card-header {
                        flex-direction: column;
                        gap: 8px;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default RewardDashboard;