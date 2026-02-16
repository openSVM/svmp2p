/**
 * OfferRow - Individual offer display component
 * 
 * Displays a single trading offer in a list format with all relevant details
 * Part of trading feature modular refactoring
 */

import React, { memo, useCallback } from 'react';
import styles from './OfferRow.module.css';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const formatCryptoAmount = (amount, symbol) => {
  if (amount >= 1) {
    return `${amount.toFixed(2)} ${symbol}`;
  }
  return `${amount.toFixed(4)} ${symbol}`;
};

const formatFiatAmount = (amount, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatRate = (rate, currency) => {
  return `${currency}${rate.toFixed(2)}`;
};

const getPaymentMethodLabel = (method) => {
  const labels = {
    'bank': '🏦 Bank Transfer',
    'paypal': '💳 PayPal',
    'cash': '💵 Cash',
    'crypto': '₿ Crypto',
    'westernunion': '🌎 Western Union',
    'giftcard': '🎁 Gift Card',
    'venmo': '📱 Venmo',
    'zelle': '📲 Zelle'
  };
  return labels[method] || method;
};

const OfferRow = memo(({
  offer,
  onClick,
  onAction,
  isSelected = false,
  isOwn = false,
  actionLabel = 'Trade'
}) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(offer);
    }
  }, [onClick, offer]);

  const handleActionClick = useCallback((e) => {
    e.stopPropagation();
    if (onAction) {
      onAction(offer);
    }
  }, [onAction, offer]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const {
    id,
    type,
    cryptoAmount,
    cryptoSymbol,
    fiatAmount,
    fiatCurrency,
    rate,
    paymentMethod,
    userId,
    userRating,
    createdAt
  } = offer;

  const rowClasses = [
    styles.row,
    isSelected && styles.selected,
    isOwn && styles.own
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rowClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="row"
      tabIndex={0}
      aria-selected={isSelected}
      data-offer-id={id}
    >
      <div className={styles.typeIndicator}>
        <span 
          className={styles.typeBadge}
          data-type={type}
        >
          {type.toUpperCase()}
        </span>
      </div>

      <div className={styles.amountColumn}>
        <span className={styles.cryptoAmount}>
          {formatCryptoAmount(cryptoAmount, cryptoSymbol)}
        </span>
        <span className={styles.fiatAmount}>
          {formatFiatAmount(fiatAmount, fiatCurrency)}
        </span>
      </div>

      <div className={styles.rateColumn}>
        <span className={styles.rate}>
          {formatRate(rate, fiatCurrency)}
        </span>
        <span className={styles.rateLabel}>per token</span>
      </div>

      <div className={styles.detailsColumn}>
        <span className={styles.paymentBadge}>
          {getPaymentMethodLabel(paymentMethod)}
        </span>
      </div>

      <div className={styles.userColumn}>
        <span className={styles.userId}>
          {userId.slice(0, 8)}...
        </span>
        {userRating && (
          <span className={styles.userRating}>★ {userRating.toFixed(1)}</span>
        )}
      </div>

      <div className={styles.timeColumn}>
        <span className={styles.timeAgo}>
          {formatTimeAgo(createdAt)}
        </span>
      </div>

      <div className={styles.actionColumn}>
        <button
          className={styles.actionButton}
          onClick={handleActionClick}
          aria-label={`${actionLabel} with ${userId}`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
});

OfferRow.displayName = 'OfferRow';

export default OfferRow;
