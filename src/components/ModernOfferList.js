/**
 * Modern Offer List Component
 * 
 * Refactored from the original monolithic 1,005-line component into a clean,
 * modular architecture with better separation of concerns and maintainability.
 */

import React, { useState } from 'react';
import { EnhancedErrorBoundary } from '../../EnhancedErrorBoundary';
import { LoadingSpinner } from '../../common';
import { VirtualizedList } from '../../../utils/performance';
import { useTradingOffers } from '../../../hooks/features/useTradingOffers';
import { OfferFilters } from '../features/trading/OfferFilters';
import { OfferRow } from '../features/trading/OfferRow';
import ConnectWalletPrompt from '../../ConnectWalletPrompt';

/**
 * Offer statistics component
 */
const OfferStats = ({ stats }) => (
  <div className="bg-gray-50 rounded-lg p-4 mb-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Offers</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">
          {stats.avgAmount.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">Avg Amount (SOL)</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">
          {stats.avgRate.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">Avg Rate</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">
          {stats.totalVolume.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">Total Volume (SOL)</div>
      </div>
    </div>
  </div>
);

/**
 * Empty state component
 */
const EmptyState = ({ type, hasFilters, onClearFilters }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🔍</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      {hasFilters ? 'No offers match your filters' : `No ${type} offers available`}
    </h3>
    <p className="text-gray-600 mb-6">
      {hasFilters 
        ? 'Try adjusting your search criteria or clearing filters'
        : `Be the first to create a ${type} offer!`
      }
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Clear All Filters
      </button>
    )}
  </div>
);

/**
 * Loading state component
 */
const LoadingState = () => (
  <div className="space-y-4">
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 h-20 rounded-lg mb-4"></div>
      ))}
    </div>
  </div>
);

/**
 * Error state component
 */
const ErrorState = ({ error, onRetry }) => (
  <div className="text-center py-12">
    <div className="text-red-600 text-6xl mb-4">⚠️</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      Failed to load offers
    </h3>
    <p className="text-gray-600 mb-6">
      {error || 'Something went wrong while loading offers'}
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    >
      Try Again
    </button>
  </div>
);

/**
 * Offer list header component
 */
const OfferListHeader = ({ type, onRefresh, refreshing }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold text-gray-900">
      {type === 'buy' ? 'Buy' : 'Sell'} SOL
    </h1>
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className="flex items-center px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg 
        className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  </div>
);

/**
 * Connect wallet modal component
 */
const ConnectWalletModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Connect Wallet Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <ConnectWalletPrompt 
            title="Connect to Trade"
            subtitle="You need to connect your wallet to accept this offer"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Main offer list component with improved modularity
 */
const OfferList = ({ type = 'buy', network = 'solana' }) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  const {
    // Data
    offers,
    offerStats,
    
    // State
    loading,
    error,
    filters,
    searchTerm,
    sortBy,
    showAdvanced,
    processingAction,
    
    // Actions
    handleOfferAction,
    handleFiltersChange,
    handleSearchChange,
    handleSortChange,
    toggleAdvancedFilters,
    handleRefresh,
    
    // Computed
    isWalletConnected,
    hasOffers,
    isEmpty,
  } = useTradingOffers(type);

  // Handle wallet connection requirement
  const handleConnectWallet = () => {
    setShowConnectModal(true);
  };

  // Clear all filters
  const clearAllFilters = () => {
    handleFiltersChange({});
    handleSearchChange('');
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm.length > 0;

  // Render offer row component
  const renderOfferRow = ({ item: offer, index }) => (
    <div key={offer.id} className="mb-4">
      <OfferRow
        offer={offer}
        type={type}
        processingAction={processingAction}
        onOfferAction={handleOfferAction}
        network={network}
        isWalletConnected={isWalletConnected}
        onConnectWallet={handleConnectWallet}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OfferListHeader 
          type={type} 
          onRefresh={handleRefresh}
          refreshing={loading}
        />

        {/* Filters */}
        <OfferFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          showAdvanced={showAdvanced}
          onToggleAdvanced={toggleAdvancedFilters}
        />

        {/* Statistics */}
        {hasOffers && <OfferStats stats={offerStats} />}

        {/* Content */}
        {loading && !offers.length ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRefresh} />
        ) : isEmpty ? (
          <EmptyState 
            type={type} 
            hasFilters={hasActiveFilters} 
            onClearFilters={clearAllFilters}
          />
        ) : (
          <div className="space-y-4">
            {/* Virtualized list for performance with large datasets */}
            <VirtualizedList
              items={offers}
              renderItem={renderOfferRow}
              itemHeight={120}
              overscan={5}
              className="space-y-4"
            />
          </div>
        )}

        {/* Connect Wallet Modal */}
        <ConnectWalletModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
        />
      </div>
    </div>
  );
};

/**
 * Wrapped component with error boundary for production stability
 */
const OfferListWithErrorBoundary = (props) => (
  <EnhancedErrorBoundary
    fallback={
      <ErrorState 
        error="Offer list encountered an unexpected error"
        onRetry={() => window.location.reload()}
      />
    }
  >
    <OfferList {...props} />
  </EnhancedErrorBoundary>
);

export default OfferListWithErrorBoundary;