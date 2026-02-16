/**
 * RewardsDisplay - Component for metrics visualization
 * 
 * Focused component for displaying reward metrics with responsive design
 * Part of RewardDashboard modular refactoring
 */

import React, { memo } from 'react';
import styles from './RewardsDisplay.module.css';

const MetricCard = memo(({ label, value, subValue, icon, trend }) => (
  <div className={styles.metricCard}>
    <div className={styles.metricHeader}>
      {icon && <span className={styles.metricIcon}>{icon}</span>}
      <span className={styles.metricLabel}>{label}</span>
    </div>
    <div className={styles.metricValue}>{value}</div>
    {subValue && (
      <div className={styles.metricSubValue}>
        {subValue}
        {trend && (
          <span className={`${styles.trend} ${trend > 0 ? styles.positive : styles.negative}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    )}
  </div>
));

MetricCard.displayName = 'MetricCard';

const RewardsDisplay = ({ 
  rewards = {},
  loading = false,
  error = null,
  compact = false
}) => {
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  const {
    totalEarnedFormatted = '$0.00',
    availableFormatted = '$0.00',
    pendingFormatted = '$0.00',
    history = []
  } = rewards;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <span>Loading rewards...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <div className={styles.compactMetric}>
          <span className={styles.compactLabel}>Available</span>
          <span className={styles.compactValue}>{availableFormatted}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.metricsGrid}>
        <MetricCard
          label="Total Earned"
          value={totalEarnedFormatted}
          subValue="All time"
          icon="💰"
          trend={5.2}
        />
        <MetricCard
          label="Available"
          value={availableFormatted}
          subValue="Ready to claim"
          icon="✅"
        />
        <MetricCard
          label="Pending"
          value={pendingFormatted}
          subValue="Processing"
          icon="⏳"
        />
      </div>

      {history.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          <div className={styles.historyList}>
            {history.slice(0, 5).map(item => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyInfo}>
                  <span className={styles.historyAmount}>
                    ${item.amount.toFixed(2)}
                  </span>
                  <span className={styles.historyDate}>{item.date}</span>
                </div>
                <span className={`${styles.historyStatus} ${styles[item.status]}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(RewardsDisplay);
