/**
 * Offer Filters Component
 * 
 * Extracted from the monolithic OfferList component for better modularity
 * Handles filtering, sorting, and search functionality for trading offers
 */

import React, { useState, useCallback } from 'react';
import { SUPPORTED_CURRENCIES, getPaymentMethodsForCurrency } from '../../../constants/tradingConstants';

/**
 * Search input component
 */
const SearchInput = ({ value, onChange, placeholder = "Search offers..." }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  </div>
);

/**
 * Filter dropdown component
 */
const FilterDropdown = ({ label, value, options, onChange, placeholder = "All" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

/**
 * Sort options component
 */
const SortDropdown = ({ value, onChange }) => {
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'amount-high', label: 'Amount: High to Low' },
    { value: 'amount-low', label: 'Amount: Low to High' },
    { value: 'rate-high', label: 'Rate: High to Low' },
    { value: 'rate-low', label: 'Rate: Low to High' },
  ];

  return (
    <FilterDropdown
      label="Sort by"
      value={value}
      options={sortOptions}
      onChange={onChange}
      placeholder="Default"
    />
  );
};

/**
 * Filter badge component for active filters
 */
const FilterBadge = ({ label, onRemove }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
    {label}
    <button
      onClick={onRemove}
      className="ml-2 text-blue-600 hover:text-blue-800"
      aria-label={`Remove ${label} filter`}
    >
      ×
    </button>
  </span>
);

/**
 * Active filters display
 */
const ActiveFilters = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeFilters = [];

  if (filters.currency) {
    activeFilters.push({
      key: 'currency',
      label: `Currency: ${filters.currency}`,
    });
  }
  
  if (filters.paymentMethod) {
    activeFilters.push({
      key: 'paymentMethod',
      label: `Payment: ${filters.paymentMethod}`,
    });
  }
  
  if (filters.minAmount) {
    activeFilters.push({
      key: 'minAmount',
      label: `Min: ${filters.minAmount} SOL`,
    });
  }
  
  if (filters.maxAmount) {
    activeFilters.push({
      key: 'maxAmount',
      label: `Max: ${filters.maxAmount} SOL`,
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-600">Active filters:</span>
      {activeFilters.map((filter) => (
        <FilterBadge
          key={filter.key}
          label={filter.label}
          onRemove={() => onRemoveFilter(filter.key)}
        />
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-red-600 hover:text-red-800 underline"
      >
        Clear all
      </button>
    </div>
  );
};

/**
 * Amount range inputs
 */
const AmountRangeInputs = ({ minAmount, maxAmount, onMinChange, onMaxChange }) => (
  <div className="grid grid-cols-2 gap-2">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Min SOL</label>
      <input
        type="number"
        value={minAmount}
        onChange={(e) => onMinChange(e.target.value)}
        placeholder="0"
        min="0"
        step="0.1"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Max SOL</label>
      <input
        type="number"
        value={maxAmount}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder="∞"
        min="0"
        step="0.1"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>
);

/**
 * Main offer filters component
 */
export const OfferFilters = ({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  showAdvanced = false,
  onToggleAdvanced
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Currency options
  const currencyOptions = SUPPORTED_CURRENCIES.map(currency => ({
    value: currency,
    label: currency
  }));

  // Payment method options based on selected currency
  const paymentMethodOptions = localFilters.currency
    ? getPaymentMethodsForCurrency(localFilters.currency).map(method => ({
        value: method,
        label: method
      }))
    : [];

  // Handle filter changes with debouncing
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    
    // Clear payment method if currency changes
    if (key === 'currency') {
      newFilters.paymentMethod = '';
    }
    
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  // Remove specific filter
  const removeFilter = useCallback((key) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  }, [onFiltersChange]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Search and Sort Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by payment method, amount, or currency..."
          />
        </div>
        <div>
          <SortDropdown
            value={sortBy}
            onChange={onSortChange}
          />
        </div>
      </div>

      {/* Basic Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FilterDropdown
          label="Currency"
          value={localFilters.currency || ''}
          options={currencyOptions}
          onChange={(value) => handleFilterChange('currency', value)}
          placeholder="All Currencies"
        />
        
        <FilterDropdown
          label="Payment Method"
          value={localFilters.paymentMethod || ''}
          options={paymentMethodOptions}
          onChange={(value) => handleFilterChange('paymentMethod', value)}
          placeholder="All Payment Methods"
          disabled={!localFilters.currency}
        />

        <div className="flex items-end">
          <button
            onClick={onToggleAdvanced}
            className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AmountRangeInputs
              minAmount={localFilters.minAmount || ''}
              maxAmount={localFilters.maxAmount || ''}
              onMinChange={(value) => handleFilterChange('minAmount', value)}
              onMaxChange={(value) => handleFilterChange('maxAmount', value)}
            />
          </div>
        </div>
      )}

      {/* Active Filters */}
      <ActiveFilters
        filters={localFilters}
        onRemoveFilter={removeFilter}
        onClearAll={clearAllFilters}
      />
    </div>
  );
};

export default OfferFilters;