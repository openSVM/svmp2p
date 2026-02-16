/**
 * OfferFilters - Advanced filtering and search component
 * 
 * Provides filtering controls for offer list
 * Part of OfferList modular refactoring
 */

import React, { memo, useState, useCallback } from 'react';
import styles from './OfferFilters.module.css';

const FilterSelect = memo(({ label, value, onChange, options }) => (
  <div className={styles.filterGroup}>
    <label className={styles.filterLabel}>{label}</label>
    <select
      className={styles.filterSelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

const SearchInput = memo(({ value, onChange, placeholder }) => (
  <div className={styles.searchWrapper}>
    <span className={styles.searchIcon}>🔍</span>
    <input
      type="text"
      className={styles.searchInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
    {value && (
      <button
        className={styles.clearButton}
        onClick={() => onChange('')}
        aria-label="Clear search"
      >
        ✕
      </button>
    )}
  </div>
));

SearchInput.displayName = 'SearchInput';

const OfferFilters = ({
  filters = {},
  onFilterChange,
  onClearFilters,
  offerCount = 0
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTypeChange = useCallback((value) => {
    onFilterChange('type', value);
  }, [onFilterChange]);

  const handlePaymentChange = useCallback((value) => {
    onFilterChange('paymentMethod', value);
  }, [onFilterChange]);

  const handleCurrencyChange = useCallback((value) => {
    onFilterChange('currency', value);
  }, [onFilterChange]);

  const handleSearchChange = useCallback((value) => {
    onFilterChange('searchQuery', value);
  }, [onFilterChange]);

  const handleSortChange = useCallback((value) => {
    const [sortBy, sortOrder] = value.split('-');
    onFilterChange('sortBy', sortBy);
    onFilterChange('sortOrder', sortOrder);
  }, [onFilterChange]);

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.paymentMethod !== 'all' ||
    filters.currency !== 'all' ||
    filters.searchQuery !== '';

  return (
    <div className={styles.container}>
      <div className={styles.mainFilters}>
        <SearchInput
          value={filters.searchQuery || ''}
          onChange={handleSearchChange}
          placeholder="Search offers..."
        />

        <div className={styles.filterRow}>
          <FilterSelect
            label="Type"
            value={filters.type || 'all'}
            onChange={handleTypeChange}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'buy', label: 'Buy' },
              { value: 'sell', label: 'Sell' }
            ]}
          />

          <FilterSelect
            label="Payment"
            value={filters.paymentMethod || 'all'}
            onChange={handlePaymentChange}
            options={[
              { value: 'all', label: 'All Methods' },
              { value: 'bank', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'venmo', label: 'Venmo' },
              { value: 'zelle', label: 'Zelle' }
            ]}
          />

          <FilterSelect
            label="Currency"
            value={filters.currency || 'all'}
            onChange={handleCurrencyChange}
            options={[
              { value: 'all', label: 'All Currencies' },
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' }
            ]}
          />

          <FilterSelect
            label="Sort By"
            value={`${filters.sortBy || 'rate'}-${filters.sortOrder || 'asc'}`}
            onChange={handleSortChange}
            options={[
              { value: 'rate-asc', label: 'Rate: Low to High' },
              { value: 'rate-desc', label: 'Rate: High to Low' },
              { value: 'fiatAmount-asc', label: 'Amount: Low to High' },
              { value: 'fiatAmount-desc', label: 'Amount: High to Low' },
              { value: 'createdAt-desc', label: 'Newest First' },
              { value: 'createdAt-asc', label: 'Oldest First' }
            ]}
          />
        </div>

        <button
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced
        </button>
      </div>

      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.rangeFilter}>
            <label className={styles.filterLabel}>Amount Range</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={filters.amountMin || ''}
                onChange={(e) => onFilterChange('amountMin', parseFloat(e.target.value) || 0)}
                className={styles.rangeInput}
              />
              <span className={styles.rangeSeparator}>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.amountMax !== Infinity ? filters.amountMax : ''}
                onChange={(e) => onFilterChange('amountMax', parseFloat(e.target.value) || Infinity)}
                className={styles.rangeInput}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.filterFooter}>
        <span className={styles.resultCount}>
          {offerCount} {offerCount === 1 ? 'offer' : 'offers'} found
        </span>

        {hasActiveFilters && (
          <button
            className={styles.clearButton}
            onClick={onClearFilters}
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(OfferFilters);
