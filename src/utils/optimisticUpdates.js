/**
 * Optimistic UI update utilities
 * 
 * These utilities help implement optimistic UI patterns where we update the UI
 * immediately in response to user actions before the server/blockchain confirms
 * the change, then reconcile with the actual result when it comes back.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing optimistic updates in collections
 * 
 * @param {Array} initialItems - Initial collection of items
 * @param {Function} fetchItems - Function to fetch the real data
 * @returns {Object} Utilities and state for optimistic updates
 */
export const useOptimisticCollection = (initialItems = [], fetchItems = null) => {
  const [items, setItems] = useState(initialItems);
  const [optimisticIds, setOptimisticIds] = useState(new Set());
  
  // Add an item optimistically
  const addOptimistically = useCallback((newItem) => {
    // Generate a temporary ID if none exists
    const tempId = newItem.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const itemWithId = { ...newItem, id: tempId, isOptimistic: true };
    
    setItems(prev => [...prev, itemWithId]);
    setOptimisticIds(prev => new Set([...prev, tempId]));
    
    return tempId;
  }, []);
  
  // Update an item optimistically
  const updateOptimistically = useCallback((id, updates) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates, isOptimistic: true } : item
      )
    );
    setOptimisticIds(prev => new Set([...prev, id]));
  }, []);
  
  // Remove an item optimistically
  const removeOptimistically = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setOptimisticIds(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  // Reconcile with actual data from server/blockchain
  const reconcile = useCallback(async (actualItems = null) => {
    if (fetchItems && !actualItems) {
      try {
        const fetchedItems = await fetchItems();
        setItems(fetchedItems);
        setOptimisticIds(new Set());
      } catch (error) {
        console.error('Failed to reconcile optimistic updates:', error);
      }
    } else if (actualItems) {
      setItems(actualItems);
      setOptimisticIds(new Set());
    }
  }, [fetchItems]);
  
  // Get an item's optimistic status
  const isOptimistic = useCallback((id) => {
    return optimisticIds.has(id);
  }, [optimisticIds]);
  
  return {
    items,
    setItems,
    addOptimistically,
    updateOptimistically,
    removeOptimistically,
    reconcile,
    isOptimistic,
    hasOptimisticChanges: optimisticIds.size > 0,
  };
};

/**
 * Hook for managing optimistic updates for a single item
 * 
 * @param {Object} initialItem - Initial item state
 * @param {Function} fetchItem - Function to fetch the real data
 * @returns {Object} Utilities and state for optimistic updates
 */
export const useOptimisticItem = (initialItem = {}, fetchItem = null) => {
  const [item, setItem] = useState(initialItem);
  const [isOptimistic, setIsOptimistic] = useState(false);
  
  // Update the item optimistically
  const updateOptimistically = useCallback((updates) => {
    setItem(prev => ({ ...prev, ...updates }));
    setIsOptimistic(true);
  }, []);
  
  // Reconcile with actual data
  const reconcile = useCallback(async (actualItem = null) => {
    if (fetchItem && !actualItem) {
      try {
        const fetchedItem = await fetchItem();
        setItem(fetchedItem);
        setIsOptimistic(false);
      } catch (error) {
        console.error('Failed to reconcile optimistic update:', error);
      }
    } else if (actualItem) {
      setItem(actualItem);
      setIsOptimistic(false);
    }
  }, [fetchItem]);
  
  return {
    item,
    setItem,
    updateOptimistically,
    reconcile,
    isOptimistic,
  };
};

/**
 * Creates a function that handles optimistic updates with fallback
 * 
 * @param {Function} optimisticFn - Function to call for optimistic update
 * @param {Function} actualFn - Function that performs the actual operation
 * @param {Function} rollbackFn - Function to call if the actual operation fails
 * @returns {Function} Combined function that handles the optimistic update pattern
 */
export const createOptimisticAction = (optimisticFn, actualFn, rollbackFn) => {
  return async (...args) => {
    // Perform the optimistic update
    optimisticFn(...args);
    
    try {
      // Attempt the actual operation
      const result = await actualFn(...args);
      return result;
    } catch (error) {
      // If the actual operation fails, roll back
      rollbackFn(...args, error);
      throw error;
    }
  };
};