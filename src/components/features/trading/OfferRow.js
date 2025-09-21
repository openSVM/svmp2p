/**
 * Offer Row Component
 * 
 * Extracted from the monolithic OfferList component for better modularity
 * Handles the display and actions for individual trading offers
 */

import React, { useState, useMemo } from 'react';
import { ButtonLoader } from '../../common';
import { useActionDebounce } from '../../../hooks/useActionDebounce';
import { useRealPriceData } from '../../../hooks/usePriceData';

/**
 * Rate indicator component
 */
const RateIndicator = ({ offer, type, rate }) => {
  const { prices } = useRealPriceData();
  
  const isGoodRate = useMemo(() => {
    if (!prices || !prices[offer.fiatCurrency]) {
      return null; // No indicator if no real price data
    }
    
    const marketRate = prices[offer.fiatCurrency];
    const threshold = 0.05; // 5% threshold
    const numericRate = parseFloat(rate);
    
    return type === 'buy' 
      ? numericRate < marketRate * (1 + threshold) 
      : numericRate > marketRate * (1 - threshold);
  }, [rate, type, prices, offer.fiatCurrency]);

  if (isGoodRate === null) return null;

  return (
    <span 
      className={`ml-2 px-2 py-1 text-xs rounded ${
        isGoodRate ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}
      title={isGoodRate ? 'Good rate compared to market' : 'Rate differs from market average'}
    >
      {isGoodRate ? '🔥 Good Rate' : '⚠️ Check Rate'}
    </span>
  );
};

/**
 * Time since posted component
 */
const TimeStamp = ({ createdAt }) => {
  const timeSincePosted = useMemo(() => {
    const now = Date.now();
    const diffMs = now - createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return `${Math.floor(diffMins / 1440)}d ago`;
    }
  }, [createdAt]);

  return (
    <span className="text-xs text-gray-500">{timeSincePosted}</span>
  );
};

/**
 * Action buttons component
 */
const OfferActionButtons = ({ 
  offer, 
  type, 
  isProcessing, 
  currentAction, 
  onAction,
  isWalletConnected,
  onConnectWallet 
}) => {
  // Debounced action handlers
  const { debouncedCallback: debouncedAccept, isDisabled: isAcceptDisabled } = useActionDebounce(
    () => {
      if (!isWalletConnected) {
        onConnectWallet?.();
        return;
      }
      onAction(offer.id, 'accept');
    },
    1000
  );

  const { debouncedCallback: debouncedCancel, isDisabled: isCancelDisabled } = useActionDebounce(
    () => {
      if (!isWalletConnected) {
        onConnectWallet?.();
        return;
      }
      onAction(offer.id, 'cancel');
    },
    1000
  );

  const { debouncedCallback: debouncedConfirm, isDisabled: isConfirmDisabled } = useActionDebounce(
    () => {
      if (!isWalletConnected) {
        onConnectWallet?.();
        return;
      }
      onAction(offer.id, 'confirm');
    },
    1000
  );

  // Buy offer actions
  if (type === 'buy' && offer.status === 'Listed') {
    return (
      <ButtonLoader
        onClick={debouncedAccept}
        isLoading={isProcessing && currentAction === 'accept'}
        disabled={isAcceptDisabled}
        loadingText="..."
        variant="primary"
        size="small"
        className="offer-action-button"
      >
        Buy
      </ButtonLoader>
    );
  }

  // Sell offer actions
  if (type === 'sell' && offer.status === 'Listed') {
    return (
      <ButtonLoader
        onClick={debouncedAccept}
        isLoading={isProcessing && currentAction === 'accept'}
        disabled={isAcceptDisabled}
        loadingText="..."
        variant="primary"
        size="small"
        className="offer-action-button"
      >
        Sell
      </ButtonLoader>
    );
  }

  // Owner actions for listed offers
  if (offer.status === 'Listed' && offer.isOwner) {
    return (
      <ButtonLoader
        onClick={debouncedCancel}
        isLoading={isProcessing && currentAction === 'cancel'}
        disabled={isCancelDisabled}
        loadingText="..."
        variant="secondary"
        size="small"
        className="offer-action-button"
      >
        Cancel
      </ButtonLoader>
    );
  }

  // Actions for accepted offers
  if (offer.status === 'Accepted') {
    return (
      <div className="flex space-x-2">
        <ButtonLoader
          onClick={debouncedConfirm}
          isLoading={isProcessing && currentAction === 'confirm'}
          disabled={isConfirmDisabled}
          loadingText="..."
          variant="primary"
          size="small"
          className="offer-action-button"
        >
          Confirm
        </ButtonLoader>
        <ButtonLoader
          onClick={debouncedCancel}
          isLoading={isProcessing && currentAction === 'cancel'}
          disabled={isCancelDisabled}
          loadingText="..."
          variant="secondary"
          size="small"
          className="offer-action-button"
        >
          Cancel
        </ButtonLoader>
      </div>
    );
  }

  // Status display for other states
  return (
    <span className={`px-3 py-1 text-xs rounded-full ${
      offer.status === 'Completed' ? 'bg-green-100 text-green-800' :
      offer.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {offer.status}
    </span>
  );
};

/**
 * Main offer row component
 */
export const OfferRow = React.memo(({ 
  offer, 
  type, 
  processingAction, 
  onOfferAction, 
  network, 
  isWalletConnected, 
  onConnectWallet 
}) => {
  const isProcessing = processingAction.offerId === offer.id;
  const currentAction = processingAction.action;
  
  // Calculate the rate (protected against division by zero)
  const rate = offer.solAmount > 0 ? (offer.fiatAmount / offer.solAmount).toFixed(2) : '0.00';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        {/* Offer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            {/* Amount and Currency */}
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {offer.solAmount} SOL
              </div>
              <div className="text-sm text-gray-600">
                {offer.fiatAmount} {offer.fiatCurrency}
              </div>
            </div>

            {/* Rate */}
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {rate} {offer.fiatCurrency}/SOL
                <RateIndicator offer={offer} type={type} rate={rate} />
              </div>
            </div>

            {/* Payment Method */}
            <div className="hidden md:block text-sm text-gray-600">
              <div className="font-medium">Payment</div>
              <div className="truncate max-w-32" title={offer.paymentMethod}>
                {offer.paymentMethod}
              </div>
            </div>

            {/* Network Badge */}
            <div className="hidden lg:block">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {network}
              </span>
            </div>

            {/* Timestamp */}
            <div className="hidden lg:block">
              <TimeStamp createdAt={offer.createdAt} />
            </div>
          </div>

          {/* Mobile-specific info */}
          <div className="mt-2 md:hidden">
            <div className="text-xs text-gray-600">
              Payment: {offer.paymentMethod}
            </div>
            <div className="flex items-center justify-between mt-1">
              <TimeStamp createdAt={offer.createdAt} />
              <span className="text-xs text-blue-600">{network}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-4 flex-shrink-0">
          <OfferActionButtons
            offer={offer}
            type={type}
            isProcessing={isProcessing}
            currentAction={currentAction}
            onAction={onOfferAction}
            isWalletConnected={isWalletConnected}
            onConnectWallet={onConnectWallet}
          />
        </div>
      </div>
    </div>
  );
});

OfferRow.displayName = 'OfferRow';

export default OfferRow;