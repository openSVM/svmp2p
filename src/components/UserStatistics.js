import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { usePhantomWallet } from '../contexts/PhantomWalletProvider';
import { useUserReputation, useUserHistory, useProgramStatistics } from '../hooks/useOnChainData';
import { LoadingSpinner, Tooltip } from './common';
import { formatPrice } from '../hooks/usePriceData';
import ConnectWalletPrompt from './ConnectWalletPrompt';

const UserStatistics = () => {
  const wallet = usePhantomWallet();
  const { program } = useContext(AppContext);
  
  const { reputation, loading: reputationLoading, error: reputationError } = useUserReputation(
    program, 
    wallet.publicKey
  );
  
  const { history, loading: historyLoading, error: historyError } = useUserHistory(
    program, 
    wallet.publicKey
  );
  
  const { statistics: programStats, loading: statsLoading } = useProgramStatistics(program);

  if (!wallet.connected) {
    return (
      <div className="user-statistics-container">
        <h2>User Statistics</h2>
        <ConnectWalletPrompt 
          action="view your trading statistics"
          showAsMessage={true}
        />
      </div>
    );
  }

  if (reputationLoading || historyLoading) {
    return (
      <div className="user-statistics-container">
        <h2>User Statistics</h2>
        <LoadingSpinner size="large" text="Loading your trading data from blockchain..." />
      </div>
    );
  }

  if (reputationError) {
    return (
      <div className="user-statistics-container">
        <h2>User Statistics</h2>
        <div className="error-message">
          Failed to load reputation data: {reputationError}
        </div>
      </div>
    );
  }

  // Calculate additional statistics from history
  const totalVolume = history.reduce((sum, trade) => sum + trade.solAmount, 0);
  const totalValue = history.reduce((sum, trade) => sum + trade.fiatAmount, 0);
  const buyTrades = history.filter(trade => trade.type === 'buy');
  const sellTrades = history.filter(trade => trade.type === 'sell');
  const completedTrades = history.filter(trade => trade.status === 'Completed');
  const activeTrades = history.filter(trade => 
    ['Listed', 'Accepted', 'AwaitingFiatPayment', 'FiatSent'].includes(trade.status)
  );

  const averageTradeSize = history.length > 0 ? totalVolume / history.length : 0;
  const averageTradeValue = history.length > 0 ? totalValue / history.length : 0;

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentTrades = history.filter(trade => trade.createdAt > thirtyDaysAgo);

  const renderStatCard = (title, value, subtitle, tooltip, color = 'blue') => (
    <div className={`stat-card stat-card-${color}`}>
      <Tooltip content={tooltip}>
        <div className="stat-header">
          <h4>{title}</h4>
        </div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </Tooltip>
    </div>
  );

  const renderReputationBadge = () => {
    if (!reputation || reputation.isNew) {
      return <span className="reputation-badge new-user">New User</span>;
    }

    let badgeClass = 'reputation-badge ';
    let badgeText = '';

    if (reputation.rating >= 90) {
      badgeClass += 'excellent';
      badgeText = 'Excellent Trader';
    } else if (reputation.rating >= 80) {
      badgeClass += 'good';
      badgeText = 'Good Trader';
    } else if (reputation.rating >= 60) {
      badgeClass += 'average';
      badgeText = 'Average Trader';
    } else if (reputation.rating >= 40) {
      badgeClass += 'below-average';
      badgeText = 'Below Average';
    } else {
      badgeClass += 'poor';
      badgeText = 'Poor Rating';
    }

    return <span className={badgeClass}>{badgeText}</span>;
  };

  return (
    <div className="user-statistics-container">
      <div className="statistics-header">
        <h2>Your Trading Statistics</h2>
        <div className="user-wallet-info">
          <span className="wallet-address">
            {wallet.publicKey?.toString().substring(0, 8)}...{wallet.publicKey?.toString().substring(-4)}
          </span>
          {renderReputationBadge()}
        </div>
      </div>

      {/* Reputation Overview */}
      <div className="reputation-section">
        <h3>Reputation & Rating</h3>
        <div className="stats-grid">
          {renderStatCard(
            'Overall Rating',
            reputation?.rating || 0,
            `${reputation?.totalTrades || 0} total trades`,
            'Your overall reputation score based on trading performance',
            reputation?.rating >= 80 ? 'green' : reputation?.rating >= 60 ? 'yellow' : 'red'
          )}
          
          {renderStatCard(
            'Success Rate',
            `${(reputation?.successRate || 0).toFixed(1)}%`,
            `${reputation?.successfulTrades || 0} successful`,
            'Percentage of trades completed successfully without disputes'
          )}
          
          {renderStatCard(
            'Dispute Win Rate',
            `${(reputation?.disputeWinRate || 0).toFixed(1)}%`,
            `${reputation?.disputesWon || 0}/${(reputation?.disputesWon || 0) + (reputation?.disputesLost || 0)} won`,
            'Your win rate in disputed trades resolved by jurors'
          )}
          
          {renderStatCard(
            'Total Disputes',
            reputation?.disputedTrades || 0,
            reputation?.disputedTrades === 0 ? 'Clean record' : 'Disputed trades',
            'Number of trades that resulted in disputes',
            reputation?.disputedTrades === 0 ? 'green' : 'yellow'
          )}
        </div>
      </div>

      {/* Trading Activity */}
      <div className="activity-section">
        <h3>Trading Activity</h3>
        <div className="stats-grid">
          {renderStatCard(
            'Total Volume',
            `${totalVolume.toFixed(2)} SOL`,
            `≈ ${formatPrice(totalValue, 'USD')}`,
            'Total amount of SOL you have traded'
          )}
          
          {renderStatCard(
            'Average Trade Size',
            `${averageTradeSize.toFixed(3)} SOL`,
            `≈ ${formatPrice(averageTradeValue, 'USD')}`,
            'Average amount per trade'
          )}
          
          {renderStatCard(
            'Buy Trades',
            buyTrades.length,
            `${buyTrades.reduce((sum, t) => sum + t.solAmount, 0).toFixed(2)} SOL`,
            'Number of SOL purchases you have made'
          )}
          
          {renderStatCard(
            'Sell Trades',
            sellTrades.length,
            `${sellTrades.reduce((sum, t) => sum + t.solAmount, 0).toFixed(2)} SOL`,
            'Number of SOL sales you have made'
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <h3>Recent Activity (30 days)</h3>
        <div className="stats-grid">
          {renderStatCard(
            'Recent Trades',
            recentTrades.length,
            history.length > 0 ? `${((recentTrades.length / history.length) * 100).toFixed(1)}% of total` : '0% of total',
            'Number of trades in the last 30 days'
          )}
          
          {renderStatCard(
            'Active Offers',
            activeTrades.length,
            activeTrades.length > 0 ? 'Currently trading' : 'No active trades',
            'Number of ongoing trades and active offers',
            activeTrades.length > 0 ? 'blue' : 'gray'
          )}
          
          {renderStatCard(
            'Completed Trades',
            completedTrades.length,
            `${completedTrades.length > 0 ? ((completedTrades.length / history.length) * 100).toFixed(1) : 0}% completion rate`,
            'Successfully completed trades',
            'green'
          )}
        </div>
      </div>

      {/* Platform Comparison */}
      {!statsLoading && programStats && (
        <div className="platform-comparison-section">
          <h3>Platform Comparison</h3>
          <div className="stats-grid">
            {renderStatCard(
              'Your Ranking',
              programStats.users.total > 0 ? 
                `${Math.ceil((reputation?.rating || 0) / 100 * programStats.users.total)} / ${programStats.users.total}` :
                'N/A',
              'Estimated ranking',
              'Your approximate ranking among all platform users'
            )}
            
            {renderStatCard(
              'Platform Average',
              `${programStats.users.averageRating.toFixed(1)}`,
              'Average user rating',
              'Average reputation rating across all users'
            )}
            
            {renderStatCard(
              'Active Traders',
              `${programStats.users.activeTraders}`,
              `${programStats.users.participationRate.toFixed(1)}% participation`,
              'Number of users who have completed trades'
            )}
          </div>
        </div>
      )}

      {/* Trade History */}
      {history.length > 0 && (
        <div className="trade-history-section">
          <h3>Recent Trade History</h3>
          <div className="trade-history-list">
            {history.slice(0, 5).map(trade => (
              <div key={trade.id} className="trade-history-item">
                <div className="trade-info">
                  <span className={`trade-type ${trade.type}`}>{trade.type.toUpperCase()}</span>
                  <span className="trade-amount">{trade.solAmount.toFixed(3)} SOL</span>
                  <span className="trade-value">{formatPrice(trade.fiatAmount, trade.fiatCurrency)}</span>
                  <span className={`trade-status status-${trade.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {trade.status}
                  </span>
                </div>
                <div className="trade-date">
                  {new Date(trade.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {history.length > 5 && (
              <div className="view-all-trades">
                <button className="view-all-button">View All {history.length} Trades</button>
              </div>
            )}
          </div>
        </div>
      )}

      {history.length === 0 && !historyLoading && (
        <div className="no-history">
          <h3>No Trading History</h3>
          <p>You haven't completed any trades yet. Start trading to build your reputation!</p>
        </div>
      )}

      <style jsx>{`
        .user-statistics-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .statistics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .user-wallet-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wallet-address {
          font-family: monospace;
          background: var(--color-background-alt);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .reputation-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .reputation-badge.new-user {
          background: var(--color-info);
          color: white;
        }

        .reputation-badge.excellent {
          background: #10b981;
          color: white;
        }

        .reputation-badge.good {
          background: #059669;
          color: white;
        }

        .reputation-badge.average {
          background: #d97706;
          color: white;
        }

        .reputation-badge.below-average {
          background: #dc2626;
          color: white;
        }

        .reputation-badge.poor {
          background: #991b1b;
          color: white;
        }

        .reputation-section,
        .activity-section,
        .recent-activity-section,
        .platform-comparison-section,
        .trade-history-section {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: var(--color-background-alt);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-card-blue {
          border-left: 4px solid #3b82f6;
        }

        .stat-card-green {
          border-left: 4px solid #10b981;
        }

        .stat-card-yellow {
          border-left: 4px solid #f59e0b;
        }

        .stat-card-red {
          border-left: 4px solid #ef4444;
        }

        .stat-card-gray {
          border-left: 4px solid #6b7280;
        }

        .stat-header h4 {
          margin: 0 0 0.5rem 0;
          color: var(--color-foreground-muted);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: var(--color-foreground);
        }

        .stat-subtitle {
          font-size: 0.8rem;
          color: var(--color-foreground-muted);
        }

        .trade-history-list {
          background: var(--color-background-alt);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
        }

        .trade-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .trade-history-item:last-child {
          border-bottom: none;
        }

        .trade-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .trade-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          min-width: 40px;
          text-align: center;
        }

        .trade-type.buy {
          background: #dcfdf7;
          color: #059669;
        }

        .trade-type.sell {
          background: #fef3c7;
          color: #d97706;
        }

        .trade-amount {
          font-weight: bold;
          font-family: monospace;
        }

        .trade-value {
          color: var(--color-foreground-muted);
        }

        .trade-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .trade-status.status-completed {
          background: #d1fae5;
          color: #065f46;
        }

        .trade-status.status-listed {
          background: #dbeafe;
          color: #1e40af;
        }

        .trade-status.status-accepted {
          background: #fef3c7;
          color: #92400e;
        }

        .trade-date {
          font-size: 0.9rem;
          color: var(--color-foreground-muted);
        }

        .view-all-trades {
          text-align: center;
          padding: 1rem;
          background: var(--color-background);
        }

        .view-all-button {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .view-all-button:hover {
          background: var(--color-primary-dark);
        }

        .no-history {
          text-align: center;
          padding: 2rem;
          background: var(--color-background-alt);
          border: 1px solid var(--color-border);
          border-radius: 8px;
        }

        .no-history h3 {
          margin: 0 0 1rem 0;
          color: var(--color-foreground-muted);
        }

        .no-history p {
          margin: 0;
          color: var(--color-foreground-muted);
        }

        @media (max-width: 768px) {
          .statistics-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .trade-info {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UserStatistics;