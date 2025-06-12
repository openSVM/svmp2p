import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchCompleteRewardData, clearUserCache } from '../utils/rewardQueries';
import { 
    claimRewards, 
    retryTransaction, 
    hasUserRewardsAccount, 
    createUserRewardsAccount, 
    isUserOnClaimCooldown, 
    isUserOnFailedClaimCooldown,
    getRemainingCooldown, 
    getRemainingFailedClaimCooldown,
    getCooldownStats 
} from '../utils/rewardTransactions';
import { useAutoClaimManager } from '../utils/autoClaimManager';
import { 
    REWARD_CONSTANTS, 
    CONVERSION_HELPERS, 
    UI_CONFIG, 
    AUTO_CLAIM_CONFIG,
    DEFAULT_REWARD_DATA 
} from '../constants/rewardConstants';

const RewardDashboard = () => {
    const { publicKey, connected, wallet } = useWallet();
    const autoClaimManager = useAutoClaimManager(wallet, null); // connection would be passed in real implementation
    const [rewards, setRewards] = useState(DEFAULT_REWARD_DATA.userRewards);
    const [rewardToken, setRewardToken] = useState(DEFAULT_REWARD_DATA.rewardToken);
    const [loading, setLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [error, setError] = useState(null);
    const [claimError, setClaimError] = useState(null);
    const [hasRewardsAccount, setHasRewardsAccount] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [failedClaimCooldownRemaining, setFailedClaimCooldownRemaining] = useState(0);
    const [autoClaimEnabled, setAutoClaimEnabled] = useState(AUTO_CLAIM_CONFIG.DEFAULT_ENABLED);
    const [autoClaimConfig, setAutoClaimConfig] = useState({
        autoClaimThreshold: AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD
    });

    // Debounced data fetching to optimize performance
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
            
            // Check failed claim cooldown status
            if (isUserOnFailedClaimCooldown(publicKey)) {
                setFailedClaimCooldownRemaining(getRemainingFailedClaimCooldown(publicKey));
            } else {
                setFailedClaimCooldownRemaining(0);
            }
            
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

    // Fetch real data from blockchain with debouncing
    useEffect(() => {
        fetchData();
        
        // Clear cache when wallet changes
        return () => {
            if (publicKey) {
                clearUserCache(publicKey);
            }
        };
    }, [fetchData]);

    // Update auto-claim configuration
    useEffect(() => {
        if (autoClaimManager) {
            const config = autoClaimManager.getConfig();
            setAutoClaimConfig(config);
            setAutoClaimEnabled(config.enabled);
        }
    }, [autoClaimManager]);

    // Update cooldown countdown for both success and failed claim cooldowns
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

    const handleClaimRewards = async () => {
        if (!connected || !wallet || rewards.unclaimedBalance === 0) return;
        
        // Check both types of cooldowns
        if (isUserOnClaimCooldown(publicKey)) {
            const remaining = getRemainingCooldown(publicKey);
            const remainingSeconds = Math.ceil(remaining / 1000);
            setClaimError(`Claim cooldown active. Please wait ${remainingSeconds} seconds before claiming again.`);
            return;
        }
        
        if (isUserOnFailedClaimCooldown(publicKey)) {
            const remaining = getRemainingFailedClaimCooldown(publicKey);
            const remainingSeconds = Math.ceil(remaining / 1000);
            setClaimError(`Too many failed attempts. Please wait ${remainingSeconds} seconds before trying again.`);
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
                    throw new Error(`${UI_CONFIG.ERROR_MESSAGES.ACCOUNT_CREATION_FAILED}: ${accountError.message}`);
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
            
            // Update cooldown status (success cooldowns are set in the claimRewards function)
            setCooldownRemaining(getRemainingCooldown(publicKey));
            setFailedClaimCooldownRemaining(0); // Clear failed claim cooldown on success
            
            // Reset retry count on success
            setRetryCount(0);
            
            // Refresh data immediately after successful claim
            fetchData(true);
            
            // Show success notification
            console.log('Rewards claimed successfully!');
        } catch (error) {
            console.error('Failed to claim rewards:', error);
            setRetryCount(prev => prev + 1);
            
            // Check if failed claim cooldown was set
            setFailedClaimCooldownRemaining(getRemainingFailedClaimCooldown(publicKey));
            
            // Provide user-friendly error messages
            let errorMessage = error.message || UI_CONFIG.ERROR_MESSAGES.CLAIM_FAILED;
            
            if (error.message?.includes('User rejected')) {
                errorMessage = UI_CONFIG.ERROR_MESSAGES.USER_REJECTED;
            } else if (error.message?.includes('Insufficient')) {
                errorMessage = UI_CONFIG.ERROR_MESSAGES.INSUFFICIENT_FUNDS;
            } else if (error.message?.includes('Network')) {
                errorMessage = UI_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
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
        // Validate threshold within allowed range
        const validatedThreshold = Math.max(
            AUTO_CLAIM_CONFIG.MIN_THRESHOLD,
            Math.min(AUTO_CLAIM_CONFIG.MAX_THRESHOLD, newThreshold)
        );
        
        if (autoClaimManager) {
            autoClaimManager.updateConfig({ autoClaimThreshold: validatedThreshold });
            setAutoClaimConfig(prev => ({ ...prev, autoClaimThreshold: validatedThreshold }));
        }
    };

    const triggerManualAutoClaimCheck = async () => {
        if (autoClaimManager && autoClaimEnabled) {
            try {
                setClaimLoading(true);
                await autoClaimManager.triggerCheck();
                console.log('Manual auto-claim check triggered');
                
                // Refresh data after auto-claim check
                await fetchData(true);
            } catch (error) {
                console.error('Failed to trigger auto-claim check:', error);
                setClaimError(`${UI_CONFIG.ERROR_MESSAGES.AUTO_CLAIM_FAILED}: ${error.message}`);
            } finally {
                setClaimLoading(false);
            }
        }
    };

    const progressToNextReward = () => {
        // Use centralized conversion helpers
        const tradingVolumeSOL = CONVERSION_HELPERS.lamportsToSol(rewards.tradingVolume);
        const minTradeVolumeSOL = CONVERSION_HELPERS.lamportsToSol(rewardToken.minTradeVolume);
        
        // Calculate progress toward next reward threshold
        const nextThreshold = Math.ceil(tradingVolumeSOL / minTradeVolumeSOL) * minTradeVolumeSOL;
        const currentProgress = tradingVolumeSOL % minTradeVolumeSOL;
        const progress = (currentProgress / minTradeVolumeSOL) * 100;
        
        return { 
            nextThreshold, 
            progress: parseFloat(CONVERSION_HELPERS.formatProgress(progress))
        };
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
                            <span className="stat-value primary">{CONVERSION_HELPERS.formatTokens(rewards.unclaimedBalance)} tokens</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Earned</span>
                            <span className="stat-value">{CONVERSION_HELPERS.formatTokens(rewards.totalEarned)} tokens</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Claimed</span>
                            <span className="stat-value">{CONVERSION_HELPERS.formatTokens(rewards.totalClaimed)} tokens</span>
                        </div>
                    </div>

                    <button 
                        className={`claim-button ${rewards.unclaimedBalance === 0 ? 'disabled' : ''}`}
                        onClick={handleClaimRewards}
                        disabled={rewards.unclaimedBalance === 0 || claimLoading || cooldownRemaining > 0 || failedClaimCooldownRemaining > 0}
                    >
                        {claimLoading ? 
                            UI_CONFIG.LOADING_MESSAGES.CLAIMING_REWARDS : 
                            `Claim ${CONVERSION_HELPERS.formatTokens(rewards.unclaimedBalance)} Tokens`
                        }
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
                            <span className="stat-value">{CONVERSION_HELPERS.formatSol(rewards.tradingVolume)} SOL</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Governance Votes</span>
                            <span className="stat-value">{rewards.governanceVotes} votes</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Last Trade Reward</span>
                            <span className="stat-value">
                                {CONVERSION_HELPERS.formatDate(rewards.lastTradeReward)}
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Last Vote Reward</span>
                            <span className="stat-value">
                                {CONVERSION_HELPERS.formatDate(rewards.lastVoteReward)}
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
                            {progress.toFixed(UI_CONFIG.PROGRESS_BAR_PRECISION)}% to next {CONVERSION_HELPERS.formatTokens(rewardToken.rewardRatePerTrade)} token reward
                        </p>
                        <p className="progress-hint">
                            Complete trades worth {CONVERSION_HELPERS.formatSol(rewardToken.minTradeVolume)}+ SOL to earn rewards
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
                            <span className="rate-value">{CONVERSION_HELPERS.formatTokens(rewardToken.rewardRatePerTrade)} tokens</span>
                        </div>
                        <div className="rate-item">
                            <span className="rate-label">Per Vote</span>
                            <span className="rate-value">{CONVERSION_HELPERS.formatTokens(rewardToken.rewardRatePerVote)} tokens</span>
                        </div>
                        <div className="rate-item">
                            <span className="rate-label">Min Trade Volume</span>
                            <span className="rate-value">{CONVERSION_HELPERS.formatSol(rewardToken.minTradeVolume)} SOL</span>
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
                                            value={autoClaimConfig.autoClaimThreshold || AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD}
                                            onChange={(e) => handleAutoClaimThresholdChange(parseInt(e.target.value))}
                                            min={AUTO_CLAIM_CONFIG.MIN_THRESHOLD}
                                            max={AUTO_CLAIM_CONFIG.MAX_THRESHOLD}
                                            step={AUTO_CLAIM_CONFIG.THRESHOLD_STEP}
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
                                
                                {/* Enhanced Auto-Claim Progress Indicator */}
                                <div className="setting-row">
                                    <span className="setting-label">Progress to Auto-Claim</span>
                                    <div className="auto-claim-progress">
                                        <div className="progress-bar-small">
                                            <div 
                                                className="progress-fill-small"
                                                style={{ 
                                                    width: `${Math.min(100, (rewards.unclaimedBalance / (autoClaimConfig.autoClaimThreshold || AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD)) * 100)}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <span className="progress-text-small">
                                            {CONVERSION_HELPERS.formatTokens(rewards.unclaimedBalance)} / {CONVERSION_HELPERS.formatTokens(autoClaimConfig.autoClaimThreshold || AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Auto-Claim Strategy Hint */}
                                <div className="auto-claim-hint">
                                    <span className="hint-icon">💡</span>
                                    <span className="hint-text">
                                        {rewards.unclaimedBalance >= (autoClaimConfig.autoClaimThreshold || AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD)
                                            ? "Ready for auto-claim! Check will trigger soon."
                                            : `Earn ${CONVERSION_HELPERS.formatTokens((autoClaimConfig.autoClaimThreshold || AUTO_CLAIM_CONFIG.DEFAULT_THRESHOLD) - rewards.unclaimedBalance)} more tokens for auto-claim.`
                                        }
                                    </span>
                                </div>
                                
                                <button 
                                    className="manual-check-button"
                                    onClick={triggerManualAutoClaimCheck}
                                    disabled={!autoClaimEnabled || claimLoading}
                                >
                                    {claimLoading ? UI_CONFIG.LOADING_MESSAGES.CHECKING_AUTOCLAIM : 'Check Now'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Enhanced Cooldown Status Card */}
                {(cooldownRemaining > 0 || failedClaimCooldownRemaining > 0) && (
                    <div className="reward-card cooldown-card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold">
                                {failedClaimCooldownRemaining > 0 ? 'Failed Claim Cooldown' : 'Claim Cooldown'}
                            </h3>
                            <div className="reward-icon">⏰</div>
                        </div>
                        
                        <div className="cooldown-content">
                            <div className="cooldown-timer">
                                <span className="timer-value">
                                    {Math.ceil((failedClaimCooldownRemaining || cooldownRemaining) / 1000)}
                                </span>
                                <span className="timer-label">seconds remaining</span>
                            </div>
                            <div className="cooldown-progress">
                                <div 
                                    className="cooldown-fill"
                                    style={{ 
                                        width: failedClaimCooldownRemaining > 0 
                                            ? `${((30000 - failedClaimCooldownRemaining) / 30000) * 100}%`
                                            : `${((60000 - cooldownRemaining) / 60000) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <p className="cooldown-hint">
                                {failedClaimCooldownRemaining > 0 
                                    ? "Multiple failed attempts detected. Please wait before trying again."
                                    : "Claims are rate-limited to prevent spam and ensure network stability."
                                }
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
                    background: var(--ascii-neutral-100);
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    padding: 24px;
                    box-shadow: var(--shadow-md);
                    font-family: 'Courier New', Courier, monospace;
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
                    color: var(--ascii-neutral-800);
                    font-family: 'Courier New', Courier, monospace;
                    text-transform: uppercase;
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
                    background-color: var(--ascii-neutral-400);
                    transition: var(--transition-normal);
                    border-radius: 0;
                    border: 1px solid var(--ascii-neutral-500);
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: var(--ascii-white);
                    transition: var(--transition-normal);
                    border-radius: 0;
                    border: 1px solid var(--ascii-neutral-600);
                }

                input:checked + .toggle-slider {
                    background-color: var(--ascii-neutral-700);
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
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    font-size: 14px;
                    font-family: 'Courier New', Courier, monospace;
                    background: var(--ascii-white);
                    color: var(--ascii-neutral-800);
                }

                .input-suffix {
                    font-size: 12px;
                    color: var(--ascii-neutral-600);
                    text-transform: uppercase;
                }

                .status-value {
                    font-weight: 600;
                    font-size: 14px;
                }

                .manual-check-button {
                    background: var(--ascii-neutral-700);
                    color: var(--ascii-white);
                    border: 1px solid var(--ascii-neutral-800);
                    border-radius: 0;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    justify-self: start;
                    font-family: 'Courier New', Courier, monospace;
                    text-transform: uppercase;
                    box-shadow: var(--shadow-sm);
                }

                .manual-check-button:hover:not(:disabled) {
                    background: var(--ascii-neutral-600);
                    box-shadow: var(--shadow-md);
                    transform: translateY(-1px);
                }

                .manual-check-button:disabled {
                    background: var(--ascii-neutral-300);
                    color: var(--ascii-neutral-600);
                    cursor: not-allowed;
                    box-shadow: none;
                }

                /* Auto-Claim Progress Styles */
                .auto-claim-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: flex-end;
                }

                .progress-bar-small {
                    width: 120px;
                    height: 4px;
                    background: var(--ascii-neutral-300);
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    overflow: hidden;
                }

                .progress-fill-small {
                    height: 100%;
                    background: var(--ascii-neutral-700);
                    transition: width var(--transition-normal);
                }

                .progress-text-small {
                    font-size: 11px;
                    color: var(--ascii-neutral-600);
                    font-weight: 500;
                    font-family: 'Courier New', Courier, monospace;
                }

                .auto-claim-hint {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    background: var(--ascii-neutral-200);
                    border-radius: 0;
                    border: 1px solid var(--ascii-neutral-400);
                }

                .hint-icon {
                    font-size: 16px;
                }

                .hint-text {
                    font-size: 12px;
                    color: var(--ascii-neutral-800);
                    line-height: 1.4;
                    font-family: 'Courier New', Courier, monospace;
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
                    color: var(--ascii-neutral-900);
                    display: block;
                    font-family: 'Courier New', Courier, monospace;
                }

                .timer-label {
                    font-size: 14px;
                    color: var(--ascii-neutral-600);
                    text-transform: uppercase;
                }

                .cooldown-progress {
                    width: 100%;
                    height: 6px;
                    background: var(--ascii-neutral-300);
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    overflow: hidden;
                    margin-bottom: 12px;
                }

                .cooldown-fill {
                    height: 100%;
                    background: var(--ascii-neutral-700);
                    transition: width var(--transition-normal);
                }

                .cooldown-hint {
                    font-size: 12px;
                    color: var(--ascii-neutral-600);
                    margin: 0;
                    font-family: 'Courier New', Courier, monospace;
                }

                .cooldown-card {
                    border-color: var(--ascii-neutral-500);
                    background: var(--ascii-neutral-200);
                }
                
                .cooldown-card:has(.card-header h3:contains("Failed")) {
                    border-color: var(--ascii-neutral-600);
                    background: var(--ascii-neutral-300);
                }
                
                .cooldown-card .cooldown-fill {
                    background: var(--ascii-neutral-700);
                }
                
                .cooldown-card:has(.card-header h3:contains("Failed")) .cooldown-fill {
                    background: var(--ascii-neutral-800);
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
                    color: var(--ascii-neutral-600);
                    font-size: 14px;
                    text-transform: uppercase;
                    font-family: 'Courier New', Courier, monospace;
                }

                .stat-value {
                    font-weight: 600;
                    font-size: 16px;
                    color: var(--ascii-neutral-800);
                    font-family: 'Courier New', Courier, monospace;
                }

                .stat-value.primary {
                    color: var(--ascii-neutral-900);
                    font-size: 18px;
                    font-weight: bold;
                }

                .claim-button {
                    width: 100%;
                    background: var(--ascii-neutral-700);
                    color: var(--ascii-white);
                    border: 1px solid var(--ascii-neutral-800);
                    border-radius: 0;
                    padding: 12px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    font-family: 'Courier New', Courier, monospace;
                    text-transform: uppercase;
                    box-shadow: var(--shadow-md);
                }

                .claim-button:hover:not(.disabled) {
                    transform: translateY(-1px);
                    background: var(--ascii-neutral-600);
                    box-shadow: var(--shadow-lg);
                }

                .claim-button.disabled {
                    background: var(--ascii-neutral-300);
                    color: var(--ascii-neutral-600);
                    cursor: not-allowed;
                    border-color: var(--ascii-neutral-400);
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
                    border-bottom: 1px solid var(--ascii-neutral-300);
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
                    background: var(--ascii-neutral-300);
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--ascii-neutral-700);
                    transition: width var(--transition-normal);
                }

                .progress-text {
                    font-weight: 600;
                    text-align: center;
                    margin: 0;
                    color: var(--ascii-neutral-800);
                    font-family: 'Courier New', Courier, monospace;
                }

                .progress-hint {
                    font-size: 14px;
                    color: var(--ascii-neutral-600);
                    text-align: center;
                    margin: 0;
                    font-family: 'Courier New', Courier, monospace;
                }

                .rate-value {
                    color: var(--ascii-neutral-800);
                    font-weight: 600;
                    font-family: 'Courier New', Courier, monospace;
                }

                /* Loading and Error States */
                .loading-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    background: var(--ascii-neutral-100);
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    box-shadow: var(--shadow-md);
                    text-align: center;
                    font-family: 'Courier New', Courier, monospace;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--ascii-neutral-300);
                    border-top: 4px solid var(--ascii-neutral-700);
                    border-radius: 0;
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
                    background: var(--ascii-neutral-700);
                    color: var(--ascii-white);
                    border: 1px solid var(--ascii-neutral-800);
                    border-radius: 0;
                    padding: 8px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 16px;
                    transition: all var(--transition-normal);
                    font-family: 'Courier New', Courier, monospace;
                    text-transform: uppercase;
                }

                .retry-button:hover {
                    background: var(--ascii-neutral-600);
                    transform: translateY(-1px);
                }

                .claim-error-alert {
                    background: var(--ascii-neutral-200);
                    border: 1px solid var(--ascii-neutral-500);
                    border-radius: 0;
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
                    color: var(--ascii-neutral-900);
                    font-weight: 600;
                    font-family: 'Courier New', Courier, monospace;
                }

                .alert-text p {
                    color: var(--ascii-neutral-700);
                    font-size: 14px;
                    margin: 4px 0 0 0;
                    font-family: 'Courier New', Courier, monospace;
                }

                .alert-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: var(--ascii-neutral-600);
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .alert-close:hover {
                    color: var(--ascii-neutral-800);
                }

                .retry-claim-button {
                    background: var(--ascii-neutral-700);
                    color: var(--ascii-white);
                    border: 1px solid var(--ascii-neutral-800);
                    border-radius: 0;
                    padding: 6px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    margin-top: 8px;
                    transition: all var(--transition-normal);
                    font-family: 'Courier New', Courier, monospace;
                    text-transform: uppercase;
                }

                .retry-claim-button:hover:not(:disabled) {
                    background: var(--ascii-neutral-600);
                    transform: translateY(-1px);
                }

                .retry-claim-button:disabled {
                    background: var(--ascii-neutral-300);
                    color: var(--ascii-neutral-600);
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