import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchCompleteRewardData } from '../utils/rewardQueries';

const RewardDashboard = () => {
    const { publicKey, connected } = useWallet();
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
        minTradeVolume: 0.1
    });
    const [loading, setLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [error, setError] = useState(null);
    const [claimError, setClaimError] = useState(null);

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
                    minTradeVolume: 0.1
                });
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                const rewardData = await fetchCompleteRewardData(publicKey);
                
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
                    minTradeVolume: 0.1
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [connected, publicKey]);

    const handleClaimRewards = async () => {
        if (!connected || rewards.unclaimedBalance === 0) return;
        
        setClaimLoading(true);
        setClaimError(null);
        
        try {
            // In a real implementation, this would call the claim_rewards instruction
            // For now, simulate the transaction with potential for errors
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Simulate 10% chance of failure for demonstration
                    if (Math.random() < 0.1) {
                        reject(new Error('Transaction failed: Insufficient funds for gas fees'));
                    } else {
                        resolve();
                    }
                }, 2000);
            });
            
            // Update local state on success
            setRewards(prev => ({
                ...prev,
                totalClaimed: prev.totalClaimed + prev.unclaimedBalance,
                unclaimedBalance: 0
            }));
            
            // Show success notification
            console.log('Rewards claimed successfully!');
        } catch (error) {
            console.error('Failed to claim rewards:', error);
            setClaimError(error.message || 'Failed to claim rewards. Please try again.');
        } finally {
            setClaimLoading(false);
        }
    };

    const progressToNextReward = () => {
        const nextThreshold = Math.ceil(rewards.tradingVolume) + 1;
        const progress = (rewards.tradingVolume % 1) * 100;
        return { nextThreshold, progress };
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
                                        <strong>Claim Failed</strong>
                                        <p>{claimError}</p>
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
                            <span className="stat-value">{rewards.tradingVolume} SOL</span>
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
                            Complete trades worth {rewardToken.minTradeVolume}+ SOL to earn rewards
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
                            <span className="rate-value">{rewardToken.minTradeVolume} SOL</span>
                        </div>
                    </div>
                </div>
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