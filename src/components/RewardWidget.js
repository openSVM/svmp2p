import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const RewardWidget = ({ compact = false }) => {
    const { connected } = useWallet();
    
    // Mock reward data - in production this would come from blockchain state
    const mockRewards = {
        unclaimedBalance: 450,
        totalEarned: 1250
    };

    if (!connected) {
        return (
            <div className={`reward-widget ${compact ? 'compact' : ''}`}>
                <div className="widget-content">
                    <span className="widget-icon">🎁</span>
                    <div className="widget-text">
                        <span className="widget-label">Rewards</span>
                        <span className="widget-value">Connect wallet</span>
                    </div>
                </div>
                <style jsx>{`
                    .reward-widget {
                        background: linear-gradient(135deg, #7c3aed, #a855f7);
                        color: white;
                        border-radius: 8px;
                        padding: ${compact ? '8px 12px' : '12px 16px'};
                        cursor: pointer;
                        transition: all 0.2s;
                        min-width: ${compact ? '120px' : '160px'};
                    }

                    .reward-widget:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
                    }

                    .widget-content {
                        display: flex;
                        align-items: center;
                        gap: ${compact ? '6px' : '8px'};
                    }

                    .widget-icon {
                        font-size: ${compact ? '16px' : '20px'};
                    }

                    .widget-text {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .widget-label {
                        font-size: ${compact ? '10px' : '12px'};
                        opacity: 0.9;
                        font-weight: 500;
                    }

                    .widget-value {
                        font-size: ${compact ? '12px' : '14px'};
                        font-weight: 600;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`reward-widget ${compact ? 'compact' : ''}`}>
            <div className="widget-content">
                <span className="widget-icon">💎</span>
                <div className="widget-text">
                    <span className="widget-label">Unclaimed</span>
                    <span className="widget-value">{mockRewards.unclaimedBalance} tokens</span>
                </div>
            </div>
            
            {!compact && (
                <div className="widget-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '75%' }}></div>
                    </div>
                    <span className="progress-text">75% to next reward</span>
                </div>
            )}

            <style jsx>{`
                .reward-widget {
                    background: var(--ascii-neutral-700);
                    color: var(--ascii-white);
                    border: 1px solid var(--ascii-neutral-800);
                    border-radius: 0;
                    padding: ${compact ? '8px 12px' : '12px 16px'};
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    min-width: ${compact ? '120px' : '160px'};
                    box-shadow: var(--shadow-md);
                    font-family: 'Courier New', Courier, monospace;
                }

                .reward-widget:hover {
                    transform: translateY(-1px);
                    background: var(--ascii-neutral-600);
                    box-shadow: var(--shadow-lg);
                }

                .widget-content {
                    display: flex;
                    align-items: center;
                    gap: ${compact ? '6px' : '8px'};
                }

                .widget-icon {
                    font-size: ${compact ? '16px' : '20px'};
                }

                .widget-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .widget-label {
                    font-size: ${compact ? '10px' : '12px'};
                    color: var(--ascii-neutral-300);
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .widget-value {
                    font-size: ${compact ? '12px' : '14px'};
                    font-weight: 600;
                    color: var(--ascii-white);
                }

                .widget-progress {
                    margin-top: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: var(--ascii-neutral-500);
                    border: 1px solid var(--ascii-neutral-400);
                    border-radius: 0;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--ascii-white);
                    transition: width var(--transition-normal);
                }

                .progress-text {
                    font-size: 10px;
                    color: var(--ascii-neutral-300);
                    text-align: center;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

export default RewardWidget;