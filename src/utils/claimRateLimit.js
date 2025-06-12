/**
 * Global Rate Limiting and Claim Queue System
 * 
 * Implements sophisticated rate limiting and queueing to prevent abuse
 * across all reward claiming operations.
 */

import { createLogger } from './logger';

const logger = createLogger('ClaimRateLimit');

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Global rate limits (across all users)
  globalMaxClaimsPerMinute: 100,
  globalMaxClaimsPerHour: 1000,
  globalMaxClaimsPerDay: 10000,
  
  // Per-user rate limits
  userMaxClaimsPerMinute: 2,
  userMaxClaimsPerHour: 10,
  userMaxClaimsPerDay: 50,
  
  // Queue configuration
  maxQueueSize: 500,
  maxQueueWaitTime: 300000, // 5 minutes
  queueProcessInterval: 2000, // Process queue every 2 seconds
  
  // Abuse detection
  suspiciousThreshold: 20, // Claims per minute to trigger abuse detection
  banDuration: 3600000, // 1 hour ban for abuse
  
  // Rate limiting windows
  minuteWindow: 60 * 1000,
  hourWindow: 60 * 60 * 1000, 
  dayWindow: 24 * 60 * 60 * 1000,
};

/**
 * Rate limiting and queue management class
 */
class ClaimRateLimiter {
  constructor(config = {}) {
    this.config = { ...RATE_LIMIT_CONFIG, ...config };
    
    // Rate limiting tracking
    this.globalClaims = {
      minute: [],
      hour: [],
      day: []
    };
    
    this.userClaims = new Map(); // userId -> { minute: [], hour: [], day: [] }
    this.bannedUsers = new Map(); // userId -> banExpiryTime
    
    // Claim queue
    this.claimQueue = [];
    this.processingQueue = false;
    this.queueProcessor = null;
    
    // Statistics
    this.stats = {
      totalClaimsProcessed: 0,
      totalClaimsQueued: 0,
      totalClaimsRejected: 0,
      totalUsersBlocked: 0,
      averageWaitTime: 0,
      lastResetTime: Date.now()
    };
    
    this.startQueueProcessor();
  }

  /**
   * Check if a claim request should be rate limited
   * @param {string} userId - User identifier
   * @param {number} priority - Request priority (0-10, higher = more priority)
   * @returns {Object} Rate limit result
   */
  checkRateLimit(userId, priority = 5) {
    const now = Date.now();
    
    // Clean up old entries
    this.cleanupOldEntries(now);
    
    // Check if user is banned
    if (this.bannedUsers.has(userId)) {
      const banExpiry = this.bannedUsers.get(userId);
      if (now < banExpiry) {
        return {
          allowed: false,
          reason: 'user_banned',
          waitTime: banExpiry - now,
          retryAfter: banExpiry
        };
      } else {
        this.bannedUsers.delete(userId);
      }
    }
    
    // Check global rate limits
    const globalLimitResult = this.checkGlobalLimits(now);
    if (!globalLimitResult.allowed) {
      return globalLimitResult;
    }
    
    // Check user rate limits
    const userLimitResult = this.checkUserLimits(userId, now);
    if (!userLimitResult.allowed) {
      return userLimitResult;
    }
    
    // Check for suspicious activity
    const abuseResult = this.checkAbusePatterns(userId, now);
    if (!abuseResult.allowed) {
      return abuseResult;
    }
    
    return {
      allowed: true,
      reason: 'approved',
      waitTime: 0
    };
  }

  /**
   * Add claim request to queue
   * @param {Object} claimRequest - Claim request details
   * @returns {Promise<string>} Queue ID
   */
  async queueClaim(claimRequest) {
    const { userId, userPublicKey, wallet, connection, options = {}, priority = 5 } = claimRequest;
    
    // Check queue size
    if (this.claimQueue.length >= this.config.maxQueueSize) {
      this.stats.totalClaimsRejected++;
      throw new Error('Claim queue is full, please try again later');
    }
    
    // Check rate limits
    const rateLimitResult = this.checkRateLimit(userId, priority);
    if (!rateLimitResult.allowed) {
      this.stats.totalClaimsRejected++;
      throw new Error(`Rate limited: ${rateLimitResult.reason}. Wait time: ${Math.ceil(rateLimitResult.waitTime / 1000)}s`);
    }
    
    // Generate queue ID
    const queueId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueEntry = {
      queueId,
      userId,
      userPublicKey,
      wallet,
      connection,
      options,
      priority,
      queuedAt: Date.now(),
      attempts: 0,
      maxAttempts: 3,
      status: 'queued' // queued, processing, completed, failed
    };
    
    // Insert based on priority (higher priority first)
    const insertIndex = this.claimQueue.findIndex(entry => entry.priority < priority);
    if (insertIndex === -1) {
      this.claimQueue.push(queueEntry);
    } else {
      this.claimQueue.splice(insertIndex, 0, queueEntry);
    }
    
    this.stats.totalClaimsQueued++;
    
    logger.info('Claim request queued', {
      queueId,
      userId,
      priority,
      queuePosition: insertIndex === -1 ? this.claimQueue.length : insertIndex + 1,
      queueSize: this.claimQueue.length
    });
    
    return queueId;
  }

  /**
   * Get status of queued claim
   * @param {string} queueId - Queue ID
   * @returns {Object|null} Queue entry status
   */
  getQueueStatus(queueId) {
    const entry = this.claimQueue.find(e => e.queueId === queueId);
    if (!entry) return null;
    
    const position = this.claimQueue.indexOf(entry) + 1;
    const estimatedWaitTime = position * 2000; // Rough estimate based on processing interval
    
    return {
      queueId: entry.queueId,
      status: entry.status,
      position,
      queuedAt: entry.queuedAt,
      attempts: entry.attempts,
      estimatedWaitTime,
      waitingSince: Date.now() - entry.queuedAt
    };
  }

  /**
   * Start the queue processor
   */
  startQueueProcessor() {
    if (this.queueProcessor) return;
    
    this.queueProcessor = setInterval(async () => {
      if (this.processingQueue || this.claimQueue.length === 0) return;
      
      this.processingQueue = true;
      
      try {
        await this.processNextClaim();
      } catch (error) {
        logger.error('Queue processing error', { error: error.message });
      } finally {
        this.processingQueue = false;
      }
    }, this.config.queueProcessInterval);
    
    logger.info('Claim queue processor started');
  }

  /**
   * Stop the queue processor
   */
  stopQueueProcessor() {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
      logger.info('Claim queue processor stopped');
    }
  }

  /**
   * Process the next claim in the queue
   */
  async processNextClaim() {
    if (this.claimQueue.length === 0) return;
    
    // Find the next eligible claim (not timed out, not over max attempts)
    const now = Date.now();
    const nextClaimIndex = this.claimQueue.findIndex(entry => {
      const waitTime = now - entry.queuedAt;
      return entry.status === 'queued' && 
             waitTime < this.config.maxQueueWaitTime &&
             entry.attempts < entry.maxAttempts;
    });
    
    if (nextClaimIndex === -1) {
      // Clean up timed out or failed entries
      this.cleanupQueue();
      return;
    }
    
    const claimEntry = this.claimQueue[nextClaimIndex];
    claimEntry.status = 'processing';
    claimEntry.attempts++;
    
    const startTime = Date.now();
    
    try {
      // Import here to avoid circular dependency
      const { claimRewards } = await import('./rewardTransactions');
      
      // Record the claim attempt for rate limiting
      this.recordClaim(claimEntry.userId, now);
      
      // Process the claim
      const signature = await claimRewards(
        claimEntry.wallet,
        claimEntry.connection,
        claimEntry.userPublicKey,
        { ...claimEntry.options, bypassCooldown: false }
      );
      
      claimEntry.status = 'completed';
      claimEntry.signature = signature;
      claimEntry.completedAt = Date.now();
      
      // Update statistics
      this.stats.totalClaimsProcessed++;
      const waitTime = claimEntry.completedAt - claimEntry.queuedAt;
      this.stats.averageWaitTime = (this.stats.averageWaitTime + waitTime) / 2;
      
      logger.info('Claim processed successfully', {
        queueId: claimEntry.queueId,
        userId: claimEntry.userId,
        signature,
        waitTime,
        attempts: claimEntry.attempts
      });
      
      // Remove from queue after short delay (allow status checking)
      setTimeout(() => {
        const index = this.claimQueue.indexOf(claimEntry);
        if (index !== -1) {
          this.claimQueue.splice(index, 1);
        }
      }, 30000); // Remove after 30 seconds
      
    } catch (error) {
      claimEntry.lastError = error.message;
      
      if (claimEntry.attempts >= claimEntry.maxAttempts) {
        claimEntry.status = 'failed';
        this.stats.totalClaimsRejected++;
        
        logger.error('Claim failed after max attempts', {
          queueId: claimEntry.queueId,
          userId: claimEntry.userId,
          error: error.message,
          attempts: claimEntry.attempts
        });
      } else {
        claimEntry.status = 'queued'; // Retry
        
        logger.warn('Claim failed, will retry', {
          queueId: claimEntry.queueId,
          userId: claimEntry.userId,
          error: error.message,
          attempt: claimEntry.attempts,
          maxAttempts: claimEntry.maxAttempts
        });
      }
    }
  }

  /**
   * Record a claim for rate limiting purposes
   * @param {string} userId - User ID
   * @param {number} timestamp - Claim timestamp
   */
  recordClaim(userId, timestamp) {
    // Record global claim
    this.globalClaims.minute.push(timestamp);
    this.globalClaims.hour.push(timestamp);
    this.globalClaims.day.push(timestamp);
    
    // Record user claim
    if (!this.userClaims.has(userId)) {
      this.userClaims.set(userId, { minute: [], hour: [], day: [] });
    }
    
    const userClaims = this.userClaims.get(userId);
    userClaims.minute.push(timestamp);
    userClaims.hour.push(timestamp);
    userClaims.day.push(timestamp);
  }

  /**
   * Check global rate limits
   * @param {number} now - Current timestamp
   * @returns {Object} Rate limit result
   */
  checkGlobalLimits(now) {
    const minuteClaims = this.globalClaims.minute.filter(t => now - t < this.config.minuteWindow).length;
    const hourClaims = this.globalClaims.hour.filter(t => now - t < this.config.hourWindow).length;
    const dayClaims = this.globalClaims.day.filter(t => now - t < this.config.dayWindow).length;
    
    if (minuteClaims >= this.config.globalMaxClaimsPerMinute) {
      return {
        allowed: false,
        reason: 'global_minute_limit',
        waitTime: this.config.minuteWindow,
        current: minuteClaims,
        limit: this.config.globalMaxClaimsPerMinute
      };
    }
    
    if (hourClaims >= this.config.globalMaxClaimsPerHour) {
      return {
        allowed: false,
        reason: 'global_hour_limit',
        waitTime: this.config.hourWindow,
        current: hourClaims,
        limit: this.config.globalMaxClaimsPerHour
      };
    }
    
    if (dayClaims >= this.config.globalMaxClaimsPerDay) {
      return {
        allowed: false,
        reason: 'global_day_limit',
        waitTime: this.config.dayWindow,
        current: dayClaims,
        limit: this.config.globalMaxClaimsPerDay
      };
    }
    
    return { allowed: true };
  }

  /**
   * Check user-specific rate limits
   * @param {string} userId - User ID
   * @param {number} now - Current timestamp
   * @returns {Object} Rate limit result
   */
  checkUserLimits(userId, now) {
    const userClaims = this.userClaims.get(userId);
    if (!userClaims) return { allowed: true };
    
    const minuteClaims = userClaims.minute.filter(t => now - t < this.config.minuteWindow).length;
    const hourClaims = userClaims.hour.filter(t => now - t < this.config.hourWindow).length;
    const dayClaims = userClaims.day.filter(t => now - t < this.config.dayWindow).length;
    
    if (minuteClaims >= this.config.userMaxClaimsPerMinute) {
      return {
        allowed: false,
        reason: 'user_minute_limit',
        waitTime: this.config.minuteWindow,
        current: minuteClaims,
        limit: this.config.userMaxClaimsPerMinute
      };
    }
    
    if (hourClaims >= this.config.userMaxClaimsPerHour) {
      return {
        allowed: false,
        reason: 'user_hour_limit',
        waitTime: this.config.hourWindow,
        current: hourClaims,
        limit: this.config.userMaxClaimsPerHour
      };
    }
    
    if (dayClaims >= this.config.userMaxClaimsPerDay) {
      return {
        allowed: false,
        reason: 'user_day_limit',
        waitTime: this.config.dayWindow,
        current: dayClaims,
        limit: this.config.userMaxClaimsPerDay
      };
    }
    
    return { allowed: true };
  }

  /**
   * Check for abuse patterns
   * @param {string} userId - User ID
   * @param {number} now - Current timestamp
   * @returns {Object} Abuse check result
   */
  checkAbusePatterns(userId, now) {
    const userClaims = this.userClaims.get(userId);
    if (!userClaims) return { allowed: true };
    
    const recentClaims = userClaims.minute.filter(t => now - t < this.config.minuteWindow).length;
    
    if (recentClaims >= this.config.suspiciousThreshold) {
      // Ban user for abuse
      const banExpiry = now + this.config.banDuration;
      this.bannedUsers.set(userId, banExpiry);
      this.stats.totalUsersBlocked++;
      
      logger.warn('User banned for suspicious activity', {
        userId,
        recentClaims,
        threshold: this.config.suspiciousThreshold,
        banDuration: this.config.banDuration
      });
      
      return {
        allowed: false,
        reason: 'abuse_detected',
        waitTime: this.config.banDuration,
        retryAfter: banExpiry
      };
    }
    
    return { allowed: true };
  }

  /**
   * Clean up old entries to prevent memory leaks
   * @param {number} now - Current timestamp
   */
  cleanupOldEntries(now) {
    // Clean global claims
    this.globalClaims.minute = this.globalClaims.minute.filter(t => now - t < this.config.minuteWindow);
    this.globalClaims.hour = this.globalClaims.hour.filter(t => now - t < this.config.hourWindow);
    this.globalClaims.day = this.globalClaims.day.filter(t => now - t < this.config.dayWindow);
    
    // Clean user claims
    for (const [userId, userClaims] of this.userClaims.entries()) {
      userClaims.minute = userClaims.minute.filter(t => now - t < this.config.minuteWindow);
      userClaims.hour = userClaims.hour.filter(t => now - t < this.config.hourWindow);
      userClaims.day = userClaims.day.filter(t => now - t < this.config.dayWindow);
      
      // Remove user entry if no recent claims
      if (userClaims.minute.length === 0 && userClaims.hour.length === 0 && userClaims.day.length === 0) {
        this.userClaims.delete(userId);
      }
    }
    
    // Clean expired bans
    for (const [userId, banExpiry] of this.bannedUsers.entries()) {
      if (now >= banExpiry) {
        this.bannedUsers.delete(userId);
      }
    }
  }

  /**
   * Clean up timed out queue entries
   */
  cleanupQueue() {
    const now = Date.now();
    const initialLength = this.claimQueue.length;
    
    this.claimQueue = this.claimQueue.filter(entry => {
      const waitTime = now - entry.queuedAt;
      const isValid = waitTime < this.config.maxQueueWaitTime && 
                     entry.attempts < entry.maxAttempts &&
                     (entry.status === 'queued' || entry.status === 'processing' || 
                      (entry.status === 'completed' && waitTime < 30000)); // Keep completed for 30s
      
      if (!isValid && entry.status !== 'completed') {
        logger.info('Removing timed out queue entry', {
          queueId: entry.queueId,
          userId: entry.userId,
          status: entry.status,
          waitTime,
          attempts: entry.attempts
        });
      }
      
      return isValid;
    });
    
    if (this.claimQueue.length !== initialLength) {
      logger.info('Queue cleanup completed', {
        removed: initialLength - this.claimQueue.length,
        remaining: this.claimQueue.length
      });
    }
  }

  /**
   * Get system statistics
   * @returns {Object} Rate limiter statistics
   */
  getStats() {
    const now = Date.now();
    
    return {
      ...this.stats,
      queueSize: this.claimQueue.length,
      activeUsers: this.userClaims.size,
      bannedUsers: this.bannedUsers.size,
      recentGlobalClaims: {
        minute: this.globalClaims.minute.filter(t => now - t < this.config.minuteWindow).length,
        hour: this.globalClaims.hour.filter(t => now - t < this.config.hourWindow).length,
        day: this.globalClaims.day.filter(t => now - t < this.config.dayWindow).length
      },
      limits: {
        global: {
          minute: this.config.globalMaxClaimsPerMinute,
          hour: this.config.globalMaxClaimsPerHour,
          day: this.config.globalMaxClaimsPerDay
        },
        user: {
          minute: this.config.userMaxClaimsPerMinute,
          hour: this.config.userMaxClaimsPerHour,
          day: this.config.userMaxClaimsPerDay
        }
      }
    };
  }

  /**
   * Reset statistics (admin function)
   */
  resetStats() {
    this.stats = {
      totalClaimsProcessed: 0,
      totalClaimsQueued: 0,
      totalClaimsRejected: 0,
      totalUsersBlocked: 0,
      averageWaitTime: 0,
      lastResetTime: Date.now()
    };
    
    logger.info('Rate limiter statistics reset');
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy() {
    this.stopQueueProcessor();
    this.claimQueue = [];
    this.userClaims.clear();
    this.bannedUsers.clear();
    this.globalClaims = { minute: [], hour: [], day: [] };
  }
}

// Singleton instance for global access
let globalRateLimiter = null;

/**
 * Get or create the global rate limiter instance
 * @param {Object} config - Configuration options
 * @returns {ClaimRateLimiter} Rate limiter instance
 */
export const getRateLimiter = (config = {}) => {
  if (!globalRateLimiter) {
    globalRateLimiter = new ClaimRateLimiter(config);
  }
  
  return globalRateLimiter;
};

/**
 * Utility functions for rate limiting
 */
export const RateLimitUtils = {
  /**
   * Format wait time for user display
   * @param {number} waitTimeMs - Wait time in milliseconds
   * @returns {string} Formatted wait time
   */
  formatWaitTime(waitTimeMs) {
    if (waitTimeMs < 60000) {
      return `${Math.ceil(waitTimeMs / 1000)} seconds`;
    } else if (waitTimeMs < 3600000) {
      return `${Math.ceil(waitTimeMs / 60000)} minutes`;
    } else {
      return `${Math.ceil(waitTimeMs / 3600000)} hours`;
    }
  },

  /**
   * Get rate limit status for user
   * @param {string} userId - User ID
   * @returns {Object} Rate limit status
   */
  getUserRateStatus(userId) {
    const rateLimiter = getRateLimiter();
    const limitResult = rateLimiter.checkRateLimit(userId);
    
    return {
      canClaim: limitResult.allowed,
      reason: limitResult.reason,
      waitTime: limitResult.waitTime,
      waitTimeFormatted: limitResult.waitTime ? RateLimitUtils.formatWaitTime(limitResult.waitTime) : null
    };
  }
};

export default ClaimRateLimiter;