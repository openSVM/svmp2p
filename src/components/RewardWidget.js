import React, { useState, useEffect } from 'react';
import { usePhantomWallet } from '../contexts/PhantomWalletProvider';
import { useRewardData } from '../hooks/useRewardData';
import { getUIText } from '../utils/i18n';
import { createLogger } from '../utils/logger';

const logger = createLogger('RewardWidget');

const RewardWidget = ({ compact = false }) => {
    const wallet = usePhantomWallet();
    const { connected, publicKey } = wallet;
    const connection = wallet.getConnection ? wallet.getConnection() : null;
    const { rewardData, isLoading, error } = useRewardData(connection, publicKey);
    
    if (!connected) {
        return (
            <div className={`reward-widget ${compact ? 'compact' : ''}`}>
                <div className="widget-content">
                    <span className="widget-icon">🎁</span>
                    <div className="widget-text">
                        <span className="widget-label">{getUIText('REWARDS')}</span>
                        <span className="widget-value">{getUIText('CONNECT_WALLET')}</span>
                    </div>
                </div>
                <style jsx>{`
                    .reward-widget {
                        /* Use glass effect instead of gradient */
                        /* background: linear-gradient(135deg, #7c3aed, #a855f7); */
                        background: rgba(124, 58, 237, 0.15);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        border: 1px solid rgba(124, 58, 237, 0.2);
                        color: var(--color-foreground);
                        border-radius: 0;
                        padding: ${compact ? '8px 12px' : '12px 16px'};
                        cursor: pointer;
                        transition: all 0.2s;
                        min-width: ${compact ? '120px' : '160px'};
                    }

                    .reward-widget:hover {
                        transform: translateY(-1px);
                        background: rgba(124, 58, 237, 0.2);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
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

    // Handle loading state
    if (isLoading) {
        return (
            <div className={`reward-widget ${compact ? 'compact' : ''}`}>
                <div className="widget-content">
                    <span className="widget-icon">⏳</span>
                    <div className="widget-text">
                        <span className="widget-label">{getUIText('REWARDS')}</span>
                        <span className="widget-value">{getUIText('LOADING')}</span>
                    </div>
                </div>
                <style jsx>{getWidgetStyles(compact)}</style>
            </div>
        );
    }

    // Handle error state
    if (error) {
        logger.warn('RewardWidget error state', { error: error.message });
        return (
            <div className={`reward-widget ${compact ? 'compact' : ''} error`}>
                <div className="widget-content">
                    <span className="widget-icon">⚠️</span>
                    <div className="widget-text">
                        <span className="widget-label">{getUIText('REWARDS')}</span>
                        <span className="widget-value">Error</span>
                    </div>
                </div>
                <style jsx>{getWidgetStyles(compact)}</style>
            </div>
        );
    }

    // Use real reward data
    const unclaimedBalance = rewardData?.userRewards?.unclaimedBalance || 0;
    const totalEarned = rewardData?.userRewards?.totalEarned || 0;
    const tradingVolume = rewardData?.userRewards?.tradingVolume || 0;
    
    // Calculate progress to next reward milestone
    const nextMilestone = 1000; // 1000 tokens
    const progress = totalEarned > 0 ? Math.min((unclaimedBalance / nextMilestone) * 100, 100) : 0;

    return (
        <div className={`reward-widget ${compact ? 'compact' : ''}`}>
            <div className="widget-content">
                <span className="widget-icon">💎</span>
                <div className="widget-text">
                    <span className="widget-label">{getUIText('UNCLAIMED')}</span>
                    <span className="widget-value">{unclaimedBalance} {getUIText('TOKENS')}</span>
                </div>
            </div>
            
            {!compact && (
                <div className="widget-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">{Math.round(progress)}% to next milestone</span>
                </div>
            )}

            <style jsx>{getWidgetStyles(compact)}</style>
        </div>
    );
};

// Extract styles into a separate function for reusability
const getWidgetStyles = (compact) => `
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

                .reward-widget.error {
                    border-color: var(--ascii-red);
                    background: rgba(220, 38, 127, 0.1);
                }
            `;

export default RewardWidget;