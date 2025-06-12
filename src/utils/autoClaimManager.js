/**
 * Auto-Claim Manager
 * 
 * Manages eager auto-claiming of rewards based on user preferences and thresholds.
 * Provides both scheduled and threshold-based auto-claiming capabilities.
 */

import { claimRewards, hasUserRewardsAccount, createUserRewardsAccount } from './rewardTransactions';
import { fetchCompleteRewardData } from './rewardQueries';

// Default configuration for auto-claim
const DEFAULT_CONFIG = {
  enabled: false,
  autoClaimThreshold: 1000, // Auto-claim when unclaimed rewards reach 1000 tokens
  maxAutoClaimAttempts: 3,
  cooldownPeriod: 300000, // 5 minutes in milliseconds
  jitterRange: 0.2, // 20% jitter for retry delays
  scheduleInterval: 3600000, // Check every hour (1 hour in milliseconds)
};

class AutoClaimManager {
  constructor(wallet, connection) {
    this.wallet = wallet;
    this.connection = connection;
    this.config = { ...DEFAULT_CONFIG };
    this.lastClaimAttempt = new Map(); // userId -> timestamp
    this.intervalId = null;
    this.isRunning = false;
    
    // Load user preferences from local storage
    this.loadUserPreferences();
  }

  /**
   * Load user preferences from local storage
   */
  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('autoClaimConfig');
      if (saved) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load auto-claim preferences:', error);
    }
  }

  /**
   * Save user preferences to local storage
   */
  saveUserPreferences() {
    try {
      localStorage.setItem('autoClaimConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save auto-claim preferences:', error);
    }
  }

  /**
   * Update auto-claim configuration
   * @param {Object} newConfig - Configuration updates
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveUserPreferences();

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
    
    console.log('Auto-claim manager started with config:', this.config);
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
    console.log('Auto-claim manager stopped');
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
        console.log(`Auto-claim triggered for user ${userId}, unclaimed balance: ${rewardData.userRewards.unclaimedBalance}`);
        
        await this.performAutoClaim(userPublicKey, userId);
      }
    } catch (error) {
      console.error('Auto-claim check failed:', error);
    }
  }

  /**
   * Perform auto-claim with retry logic
   * @param {PublicKey} userPublicKey - User's public key
   * @param {string} userId - User ID string
   */
  async performAutoClaim(userPublicKey, userId) {
    this.lastClaimAttempt.set(userId, Date.now());

    let attempts = 0;
    let baseDelay = 1000; // Start with 1 second

    while (attempts < this.config.maxAutoClaimAttempts) {
      try {
        // Check if user has rewards account
        const hasAccount = await hasUserRewardsAccount(this.connection, userPublicKey);
        
        if (!hasAccount) {
          console.log('Creating user rewards account for auto-claim...');
          await createUserRewardsAccount(this.wallet, this.connection, userPublicKey);
        }

        // Attempt to claim rewards
        const signature = await claimRewards(this.wallet, this.connection, userPublicKey);
        
        console.log(`Auto-claim successful for user ${userId}, transaction: ${signature}`);
        
        // Emit success event
        this.emitEvent('autoClaimSuccess', {
          userId,
          signature,
          attempt: attempts + 1
        });
        
        return signature;
      } catch (error) {
        attempts++;
        
        console.warn(`Auto-claim attempt ${attempts} failed for user ${userId}:`, error.message);

        if (attempts >= this.config.maxAutoClaimAttempts) {
          console.error(`Auto-claim failed after ${attempts} attempts for user ${userId}`);
          
          // Emit failure event
          this.emitEvent('autoClaimFailure', {
            userId,
            error: error.message,
            attempts
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
    console.log('Auto-claim cooldowns reset');
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

/**
 * React hook for using auto-claim manager
 */
export const useAutoClaimManager = (wallet, connection) => {
  // In a real React environment, we'd import React here
  // For now, we'll provide a simple version
  if (typeof React !== 'undefined' && React.useEffect) {
    const manager = getAutoClaimManager(wallet, connection);
    
    // Auto-start if enabled
    React.useEffect(() => {
      if (manager.getConfig().enabled && !manager.isRunning && wallet?.connected) {
        manager.start();
      }
      
      return () => {
        if (manager.isRunning) {
          manager.stop();
        }
      };
    }, [manager, wallet?.connected]);
    
    return manager;
  } else {
    // Fallback for non-React environments
    return getAutoClaimManager(wallet, connection);
  }
};

export default AutoClaimManager;