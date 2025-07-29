/**
 * Auto-Claim Manager
 * 
 * Manages eager auto-claiming of rewards based on user preferences and thresholds.
 * Provides both scheduled and threshold-based auto-claiming capabilities.
 */

import { claimRewards, hasUserRewardsAccount, createUserRewardsAccount } from './rewardTransactions';
import { fetchCompleteRewardData } from './rewardQueries';
import { getStorageManager, STORAGE_BACKENDS } from './decentralizedStorage';
import { getRateLimiter, RateLimitUtils } from './claimRateLimit';

// Default configuration for auto-claim
const DEFAULT_CONFIG = {
  enabled: false,
  autoClaimThreshold: 1000, // Auto-claim when unclaimed rewards reach 1000 tokens
  maxAutoClaimAttempts: 3,
  cooldownPeriod: 300000, // 5 minutes in milliseconds
  jitterRange: 0.2, // 20% jitter for retry delays
  scheduleInterval: 3600000, // Check every hour (1 hour in milliseconds)
  logLevel: 'info', // Log levels: 'debug', 'info', 'warn', 'error'
  enableDiagnostics: true, // Enable diagnostic reporting
};

// Log levels mapping
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Diagnostic service placeholder
const DiagnosticService = {
  reportMetric: (metric, value, tags = {}) => {
    // This would integrate with actual diagnostic service
    if (typeof window !== 'undefined' && window.console?.debug) {
      console.debug(`[Diagnostic] ${metric}: ${value}`, tags);
    }
  },
  reportError: (error, context = {}) => {
    // This would integrate with actual error reporting service
    if (typeof window !== 'undefined' && window.console?.error) {
      console.error('[Diagnostic Error]', error, context);
    }
  }
};

class AutoClaimManager {
  constructor(wallet, connection) {
    this.wallet = wallet;
    this.connection = connection;
    this.config = { ...DEFAULT_CONFIG };
    this.lastClaimAttempt = new Map(); // userId -> timestamp
    this.intervalId = null;
    this.isRunning = false;
    
    // Initialize decentralized storage
    this.storageManager = getStorageManager(connection, wallet, {
      preferredBackend: STORAGE_BACKENDS.LOCAL_STORAGE, // Auto-claim preferences can use local storage
      fallbackChain: [STORAGE_BACKENDS.LOCAL_STORAGE]
    });
    
    // Load user preferences from decentralized storage
    this.loadUserPreferences();
  }

  /**
   * Log message with level filtering
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(level, message, data = {}) {
    const currentLogLevel = LOG_LEVELS[this.config.logLevel] || LOG_LEVELS.info;
    const messageLogLevel = LOG_LEVELS[level] || LOG_LEVELS.info;
    
    if (messageLogLevel >= currentLogLevel) {
      const logMethod = console[level] || console.log;
      logMethod(`[AutoClaimManager] ${message}`, data);
      
      // Report to diagnostic service if enabled
      if (this.config.enableDiagnostics && level === 'error') {
        DiagnosticService.reportError(new Error(message), data);
      } else if (this.config.enableDiagnostics) {
        DiagnosticService.reportMetric(`autoclaim.${level}`, 1, { message, ...data });
      }
    }
  }

  /**
   * Load user preferences from decentralized storage with fallback to localStorage
   */
  async loadUserPreferences() {
    try {
      const storageKey = `autoClaim_config_${this.wallet?.publicKey?.toString() || 'default'}`;
      const config = await this.storageManager.retrieve(storageKey);
      
      if (config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.log('info', 'Auto-claim preferences loaded from decentralized storage');
        return;
      }
    } catch (error) {
      this.log('warn', 'Failed to load from decentralized storage, trying localStorage', { error: error.message });
    }
    
    // Fallback to localStorage
    try {
      if (typeof window === 'undefined') return;
      
      const saved = localStorage.getItem('autoClaimConfig');
      if (saved) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        this.log('info', 'Auto-claim preferences loaded from localStorage fallback');
      }
    } catch (error) {
      this.log('warn', 'Failed to load auto-claim preferences from localStorage', { error: error.message });
    }
  }

  /**
   * Save user preferences using decentralized storage with fallback to localStorage
   */
  async saveUserPreferences() {
    try {
      const storageKey = `autoClaim_config_${this.wallet?.publicKey?.toString() || 'default'}`;
      
      await this.storageManager.store(storageKey, this.config, {
        permanence: 'medium',
        accessFrequency: 'high'
      });
      
      this.log('info', 'Auto-claim preferences saved to decentralized storage');
    } catch (error) {
      this.log('warn', 'Failed to save to decentralized storage, falling back to localStorage', { error: error.message });
      
      // Fallback to localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('autoClaimConfig', JSON.stringify(this.config));
        }
      } catch (fallbackError) {
        this.log('error', 'Failed to save auto-claim preferences to localStorage', { error: fallbackError.message });
      }
    }
  }

  /**
   * Update auto-claim configuration
   * @param {Object} newConfig - Configuration updates
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.saveUserPreferences();

    // Restart manager if enabled state changed
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && !this.isRunning) {
        this.start();
      } else if (!newConfig.enabled && this.isRunning) {
        this.stop();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Start the auto-claim manager
   */
  start() {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Set up periodic checking
    this.intervalId = setInterval(() => {
      this.checkAndAutoClaim();
    }, this.config.scheduleInterval);

    // Perform initial check
    this.checkAndAutoClaim();
    
    this.log('info', 'Auto-claim manager started', { config: this.config });
  }

  /**
   * Stop the auto-claim manager
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.log('info', 'Auto-claim manager stopped');
  }

  /**
   * Check if user is eligible for auto-claim based on cooldown
   * @param {string} userId - User ID
   */
  isEligibleForClaim(userId) {
    const lastAttempt = this.lastClaimAttempt.get(userId);
    if (!lastAttempt) return true;
    
    const timeSinceLastAttempt = Date.now() - lastAttempt;
    return timeSinceLastAttempt >= this.config.cooldownPeriod;
  }

  /**
   * Add jitter to delay for more natural retry patterns
   * @param {number} baseDelay - Base delay in milliseconds
   */
  addJitter(baseDelay) {
    const jitter = baseDelay * this.config.jitterRange * (Math.random() - 0.5);
    return Math.max(0, baseDelay + jitter);
  }

  /**
   * Check rewards and perform auto-claim if threshold is met
   */
  async checkAndAutoClaim() {
    if (!this.wallet?.publicKey || !this.wallet.connected) {
      return;
    }

    try {
      const userPublicKey = this.wallet.publicKey;
      const userId = userPublicKey.toString();

      // Check cooldown
      if (!this.isEligibleForClaim(userId)) {
        return;
      }

      // Fetch current reward data
      const rewardData = await fetchCompleteRewardData(userPublicKey);
      
      // Check if auto-claim threshold is met
      if (rewardData.userRewards.unclaimedBalance >= this.config.autoClaimThreshold) {
        this.log('info', 'Auto-claim triggered', { 
          userId, 
          unclaimedBalance: rewardData.userRewards.unclaimedBalance,
          threshold: this.config.autoClaimThreshold
        });
        
        await this.performAutoClaim(userPublicKey, userId);
      }
    } catch (error) {
      this.log('error', 'Auto-claim check failed', { error: error.message, userId });
    }
  }

  /**
   * Perform auto-claim with retry logic and rate limiting
   * @param {PublicKey} userPublicKey - User's public key
   * @param {string} userId - User ID string
   */
  async performAutoClaim(userPublicKey, userId) {
    this.lastClaimAttempt.set(userId, Date.now());

    // Check rate limits before attempting claim
    const rateLimitStatus = RateLimitUtils.getUserRateStatus(userId);
    if (!rateLimitStatus.canClaim) {
      this.log('warn', 'Auto-claim rate limited', {
        userId,
        reason: rateLimitStatus.reason,
        waitTime: rateLimitStatus.waitTimeFormatted
      });
      
      // Emit rate limited event
      this.emitEvent('autoClaimRateLimited', {
        userId,
        reason: rateLimitStatus.reason,
        waitTime: rateLimitStatus.waitTime,
        waitTimeFormatted: rateLimitStatus.waitTimeFormatted
      });
      
      return;
    }

    let attempts = 0;
    let baseDelay = 1000; // Start with 1 second

    while (attempts < this.config.maxAutoClaimAttempts) {
      try {
        // Check if user has rewards account
        const hasAccount = await hasUserRewardsAccount(this.connection, userPublicKey);
        
        if (!hasAccount) {
          this.log('info', 'Creating user rewards account for auto-claim', { userId });
          await createUserRewardsAccount(this.wallet, this.connection, userPublicKey);
        }

        // Attempt to claim rewards with rate limiting enabled
        const signature = await claimRewards(
          this.wallet,
          this.connection,
          userPublicKey,
          { 
            ...this.config.options,
            bypassCooldown: false,
            useQueue: true, // Use queue system for auto-claims
            priority: 3 // Lower priority for auto-claims
          }
        );
        
        this.log('info', 'Auto-claim successful', {
          userId,
          signature,
          attempt: attempts + 1,
          method: 'queue'
        });
        
        // Emit success event
        this.emitEvent('autoClaimSuccess', {
          userId,
          signature,
          attempt: attempts + 1,
          method: 'queue'
        });
        
        return signature;
      } catch (error) {
        attempts++;
        
        this.log('warn', 'Auto-claim attempt failed', {
          userId,
          attempt: attempts,
          error: error.message
        });

        // Check if it's a rate limiting error
        if (error.message.includes('Rate limited') || error.message.includes('queue is full')) {
          this.log('debug', 'Auto-claim rate limited, will retry later', { userId });
          
          this.emitEvent('autoClaimRateLimited', {
            userId,
            error: error.message,
            attempt: attempts
          });
          
          // Don't count rate limiting as a failed attempt for max attempts
          attempts--;
          
          // Wait longer for rate limiting issues
          const delay = this.addJitter(baseDelay * 5); // 5x longer delay for rate limits
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (attempts >= this.config.maxAutoClaimAttempts) {
          this.log('error', 'Auto-claim failed after max attempts', {
            userId,
            attempts,
            error: error.message
          });
          
          // Emit failure event
          this.emitEvent('autoClaimFailure', {
            userId,
            error: error.message,
            attempts,
            finalError: true
          });
          
          throw error;
        }

        // Wait before retry with exponential backoff and jitter
        const delay = this.addJitter(baseDelay * Math.pow(2, attempts - 1));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Manually trigger auto-claim check (for testing or user-initiated checks)
   */
  async triggerCheck() {
    if (!this.config.enabled) {
      throw new Error('Auto-claim is not enabled');
    }
    
    await this.checkAndAutoClaim();
  }

  /**
   * Get auto-claim statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastClaimAttempts: Object.fromEntries(this.lastClaimAttempt),
      eligibleUsers: Array.from(this.lastClaimAttempt.keys()).filter(userId => 
        this.isEligibleForClaim(userId)
      ).length
    };
  }

  /**
   * Event emitter for auto-claim events
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  emitEvent(eventType, data) {
    const event = new CustomEvent(`autoClaim:${eventType}`, {
      detail: { ...data, timestamp: Date.now() }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * Reset cooldowns (admin function)
   */
  resetCooldowns() {
    this.lastClaimAttempt.clear();
    this.log('debug', 'Auto-claim cooldowns reset');
  }

  /**
   * Destroy the manager and clean up
   */
  destroy() {
    this.stop();
    this.lastClaimAttempt.clear();
  }
}

// Singleton instance for global access
let globalAutoClaimManager = null;

/**
 * Get or create the global auto-claim manager instance
 * @param {Object} wallet - Wallet adapter
 * @param {Connection} connection - Solana connection
 */
export const getAutoClaimManager = (wallet, connection) => {
  if (!globalAutoClaimManager || 
      globalAutoClaimManager.wallet !== wallet || 
      globalAutoClaimManager.connection !== connection) {
    
    // Clean up existing manager
    if (globalAutoClaimManager) {
      globalAutoClaimManager.destroy();
    }
    
    globalAutoClaimManager = new AutoClaimManager(wallet, connection);
  }
  
  return globalAutoClaimManager;
};

export default AutoClaimManager;