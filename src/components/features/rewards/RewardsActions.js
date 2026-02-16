/**
 * RewardsActions - Component for user interactions and claim functionality
 * 
 * Handles claim button, history actions, and user controls
 * Part of RewardDashboard modular refactoring
 */

import React, { useState, memo } from 'react';
import styles from './RewardsActions.module.css';

const ClaimModal = memo(({ isOpen, onClose, availableAmount, onConfirm, loading }) => {
  const [claimAmount, setClaimAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setClaimAmount(value);
      setError('');
    }
  };

  const handleMaxClick = () => {
    setClaimAmount(availableAmount.toString());
    setError('');
  };

  const handleSubmit = () => {
    const amount = parseFloat(claimAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > availableAmount) {
      setError('Amount exceeds available balance');
      return;
    }
    onConfirm(amount);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Claim Rewards</h2>
        <p className={styles.modalSubtitle}>
          Available: <strong>${availableAmount.toFixed(2)}</strong>
        </p>

        <div className={styles.inputGroup}>
          <label htmlFor="claimAmount">Amount to claim</label>
          <div className={styles.inputWrapper}>
            <span className={styles.inputPrefix}>$</span>
            <input
              id="claimAmount"
              type="text"
              value={claimAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={loading}
            />
            <button
              type="button"
              className={styles.maxButton}
              onClick={handleMaxClick}
              disabled={loading}
            >
              MAX
            </button>
          </div>
          {error && <span className={styles.errorText}>{error}</span>}
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={loading || !claimAmount}
          >
            {loading ? 'Processing...' : 'Confirm Claim'}
          </button>
        </div>
      </div>
    </div>
  );
});

ClaimModal.displayName = 'ClaimModal';

const RewardsActions = ({
  canClaim = false,
  availableAmount = 0,
  onClaim,
  onRefresh,
  loading = false
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleClaimClick = () => {
    if (canClaim) {
      setShowModal(true);
    }
  };

  const handleConfirmClaim = async (amount) => {
    try {
      await onClaim(amount);
      setShowModal(false);
    } catch (err) {
      // Error handled by parent
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.actionsRow}>
        <button
          className={`${styles.claimButton} ${!canClaim ? styles.disabled : ''}`}
          onClick={handleClaimClick}
          disabled={!canClaim || loading}
          aria-label="Claim available rewards"
        >
          <span className={styles.buttonIcon}>🎁</span>
          <span>{loading ? 'Processing...' : 'Claim Rewards'}</span>
        </button>

        <button
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh rewards"
        >
          <span className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`}>↻</span>
        </button>
      </div>

      <p className={styles.hint}>
        {canClaim
          ? `You have $${availableAmount.toFixed(2)} available to claim`
          : 'No rewards available to claim at this time'}
      </p>

      <ClaimModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        availableAmount={availableAmount}
        onConfirm={handleConfirmClaim}
        loading={loading}
      />
    </div>
  );
};

export default memo(RewardsActions);
