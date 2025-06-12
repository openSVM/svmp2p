/**
 * Reward Data Cache Manager
 * 
 * Provides caching and debouncing for expensive reward data fetching operations
 * to improve performance and reduce unnecessary blockchain queries.
 */

import { FETCH_CONFIG } from '../constants/rewardConstants';

class RewardDataCache {
  constructor() {
    this.cache = new Map();
    this.pendingFetches = new Map();
    this.debounceTimers = new Map();
  }

  /**
   * Generate cache key for user data
   * @param {string} userKey - User public key string
   * @param {string} dataType - Type of data being cached
   * @returns {string} Cache key
   */
  generateCacheKey(userKey, dataType = 'complete') {
    return `${dataType}:${userKey}`;
  }

  /**
   * Check if cached data is still valid
   * @param {Object} cacheEntry - Cache entry with timestamp
   * @returns {boolean} True if data is still fresh
   */
  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    const age = Date.now() - cacheEntry.timestamp;
    return age < FETCH_CONFIG.CACHE_DURATION;
  }

  /**
   * Get cached data if available and valid
   * @param {string} userKey - User public key string  
   * @param {string} dataType - Type of data to retrieve
   * @returns {Object|null} Cached data or null if not found/expired
   */
  getCachedData(userKey, dataType = 'complete') {
    const cacheKey = this.generateCacheKey(userKey, dataType);
    const cacheEntry = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cacheEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return cacheEntry.data;
    }
    
    // Remove expired entry
    if (cacheEntry) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Set cached data with timestamp
   * @param {string} userKey - User public key string
   * @param {Object} data - Data to cache
   * @param {string} dataType - Type of data being cached
   */
  setCachedData(userKey, data, dataType = 'complete') {
    const cacheKey = this.generateCacheKey(userKey, dataType);
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= FETCH_CONFIG.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(`Cache evicted oldest entry: ${oldestKey}`);
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    console.log(`Data cached for ${cacheKey}`);
  }

  /**
   * Clear cached data for a specific user
   * @param {string} userKey - User public key string
   */
  clearUserCache(userKey) {
    const keysToDelete = [];
    for (const [key, _] of this.cache) {
      if (key.includes(userKey)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`Cleared cache for ${key}`);
    });
  }

  /**
   * Clear all cached data
   */
  clearAllCache() {
    this.cache.clear();
    this.pendingFetches.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    console.log('All cache data cleared');
  }

  /**
   * Debounced data fetcher to prevent excessive API calls
   * @param {string} userKey - User public key string
   * @param {Function} fetchFunction - Function that returns a promise for data
   * @param {string} dataType - Type of data being fetched
   * @param {number} debounceDelay - Debounce delay in milliseconds
   * @returns {Promise} Promise that resolves with data
   */
  async debouncedFetch(userKey, fetchFunction, dataType = 'complete', debounceDelay = FETCH_CONFIG.DEBOUNCE_DELAY) {
    const cacheKey = this.generateCacheKey(userKey, dataType);
    
    // Check cache first
    const cached = this.getCachedData(userKey, dataType);
    if (cached) {
      return cached;
    }
    
    // Check if fetch is already pending
    if (this.pendingFetches.has(cacheKey)) {
      console.log(`Fetch already pending for ${cacheKey}, waiting...`);
      return this.pendingFetches.get(cacheKey);
    }
    
    // Clear existing debounce timer for this key
    const existingTimer = this.debounceTimers.get(cacheKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Create debounced fetch promise
    const fetchPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          console.log(`Executing debounced fetch for ${cacheKey}`);
          
          // Remove from debounce timers
          this.debounceTimers.delete(cacheKey);
          
          // Execute the actual fetch
          const data = await fetchFunction();
          
          // Cache the result
          this.setCachedData(userKey, data, dataType);
          
          // Remove from pending fetches
          this.pendingFetches.delete(cacheKey);
          
          resolve(data);
        } catch (error) {
          console.error(`Debounced fetch failed for ${cacheKey}:`, error);
          
          // Remove from pending fetches
          this.pendingFetches.delete(cacheKey);
          
          reject(error);
        }
      }, debounceDelay);
      
      this.debounceTimers.set(cacheKey, timer);
    });
    
    // Store pending fetch
    this.pendingFetches.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  }

  /**
   * Immediate fetch that bypasses debouncing (for user actions)
   * @param {string} userKey - User public key string
   * @param {Function} fetchFunction - Function that returns a promise for data
   * @param {string} dataType - Type of data being fetched
   * @returns {Promise} Promise that resolves with data
   */
  async immediateFetch(userKey, fetchFunction, dataType = 'complete') {
    const cacheKey = this.generateCacheKey(userKey, dataType);
    
    try {
      console.log(`Executing immediate fetch for ${cacheKey}`);
      
      // Clear any pending debounced fetch
      const existingTimer = this.debounceTimers.get(cacheKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.debounceTimers.delete(cacheKey);
      }
      
      // Clear any pending promise
      this.pendingFetches.delete(cacheKey);
      
      // Execute fetch immediately
      const data = await fetchFunction();
      
      // Cache the result
      this.setCachedData(userKey, data, dataType);
      
      return data;
    } catch (error) {
      console.error(`Immediate fetch failed for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [_, entry] of this.cache) {
      if (now - entry.timestamp < FETCH_CONFIG.CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingFetches: this.pendingFetches.size,
      activeDebounceTimers: this.debounceTimers.size,
      cacheDuration: FETCH_CONFIG.CACHE_DURATION,
      maxCacheSize: FETCH_CONFIG.MAX_CACHE_SIZE,
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp >= FETCH_CONFIG.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
    
    return keysToDelete.length;
  }
}

// Create singleton instance
const rewardDataCache = new RewardDataCache();

// Set up periodic cleanup
setInterval(() => {
  rewardDataCache.cleanupExpiredEntries();
}, FETCH_CONFIG.CACHE_DURATION);

export default rewardDataCache;