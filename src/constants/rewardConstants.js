/**
 * Reward System Constants
 * 
 * Centralized constants for reward rates, thresholds, and configuration
 * used across both frontend and smart contract implementations.
 */

// Solana denomination constants
export const LAMPORTS_PER_SOL = 1000000000; // 1 SOL = 1e9 lamports

// Default reward rates (consistent with smart contract)
export const REWARD_RATES = {
  PER_TRADE: 100,     // tokens per successful trade
  PER_VOTE: 50,       // tokens per governance vote
  MIN_TRADE_VOLUME: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL minimum in lamports
};

// Auto-claim configuration
export const AUTO_CLAIM_CONFIG = {
  DEFAULT_THRESHOLD: 1000,     // tokens
  MIN_THRESHOLD: 100,          // minimum auto-claim threshold
  MAX_THRESHOLD: 10000,        // maximum auto-claim threshold
  THRESHOLD_STEP: 100,         // increment step for threshold selector
  DEFAULT_ENABLED: false,      // auto-claim disabled by default
  CHECK_INTERVAL: 3600000,     // check every hour (1 hour in milliseconds)
};

// Cooldown and retry configuration
export const COOLDOWN_CONFIG = {
  CLAIM_COOLDOWN: 60000,       // 1 minute between successful claims
  FAILED_CLAIM_COOLDOWN: 30000, // 30 seconds after failed claims
  MAX_RETRIES: 5,
  BASE_RETRY_DELAY: 1000,      // 1 second
  MAX_RETRY_DELAY: 30000,      // 30 seconds
  JITTER_FACTOR: 0.3,          // 30% jitter
  BACKOFF_MULTIPLIER: 2,
};

// Data fetching configuration
export const FETCH_CONFIG = {
  DEBOUNCE_DELAY: 1000,        // 1 second debounce for data fetching
  CACHE_DURATION: 30000,       // 30 seconds cache duration
  MAX_CACHE_SIZE: 100,         // maximum cached entries
};

// UI display constants
export const UI_CONFIG = {
  PROGRESS_BAR_PRECISION: 1,   // decimal places for progress percentage
  TOKEN_DISPLAY_PRECISION: 0,  // decimal places for token amounts
  SOL_DISPLAY_PRECISION: 2,    // decimal places for SOL amounts
  DATE_FORMAT_OPTIONS: {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  },
  LOADING_MESSAGES: {
    FETCHING_DATA: 'Loading your reward data...',
    CLAIMING_REWARDS: 'Claiming rewards...',
    CREATING_ACCOUNT: 'Setting up your rewards account...',
    CHECKING_AUTOCLAIM: 'Checking auto-claim...',
  },
  ERROR_MESSAGES: {
    CLAIM_FAILED: 'CLAIM_FAILED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE', 
    NETWORK_ERROR: 'NETWORK_ERROR',
    WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
    NO_REWARDS_TO_CLAIM: 'NO_REWARDS_TO_CLAIM',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    USER_REJECTED: 'USER_REJECTED',
    RATE_LIMITED: 'RATE_LIMITED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_BALANCE',
    ACCOUNT_CREATION_FAILED: 'ACCOUNT_NOT_FOUND',
    AUTO_CLAIM_FAILED: 'TRANSACTION_FAILED'
  }
};

// Program and PDA configuration (should match smart contract)
export const PROGRAM_CONFIG = {
  PROGRAM_ID: 'FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9',
  PDA_SEEDS: {
    REWARD_TOKEN: 'reward_token',
    USER_REWARDS: 'user_rewards', 
    REWARD_MINT: 'reward_mint',
  }
};

// Validation rules
export const VALIDATION_RULES = {
  AUTO_CLAIM_THRESHOLD: {
    min: AUTO_CLAIM_CONFIG.MIN_THRESHOLD,
    max: AUTO_CLAIM_CONFIG.MAX_THRESHOLD,
    step: AUTO_CLAIM_CONFIG.THRESHOLD_STEP,
  },
  RETRY_ATTEMPTS: {
    min: 1,
    max: 10,
  },
  COOLDOWN_DURATION: {
    min: 10000, // 10 seconds minimum
    max: 600000, // 10 minutes maximum
  }
};

// Default fallback data structure
export const DEFAULT_REWARD_DATA = {
  userRewards: {
    totalEarned: 0,
    totalClaimed: 0,
    unclaimedBalance: 0,
    tradingVolume: 0,
    governanceVotes: 0,
    lastTradeReward: null,
    lastVoteReward: null,
  },
  rewardToken: {
    rewardRatePerTrade: REWARD_RATES.PER_TRADE,
    rewardRatePerVote: REWARD_RATES.PER_VOTE,
    minTradeVolume: REWARD_RATES.MIN_TRADE_VOLUME,
    totalSupply: 0,
    mint: null,
  },
  systemInitialized: false,
};

// Helper functions for common conversions
export const CONVERSION_HELPERS = {
  lamportsToSol: (lamports) => lamports / LAMPORTS_PER_SOL,
  solToLamports: (sol) => Math.floor(sol * LAMPORTS_PER_SOL),
  formatSol: (lamports, precision = UI_CONFIG.SOL_DISPLAY_PRECISION) => 
    (lamports / LAMPORTS_PER_SOL).toFixed(precision),
  formatTokens: (tokens, precision = UI_CONFIG.TOKEN_DISPLAY_PRECISION) =>
    tokens.toFixed(precision),
  formatDate: (date) => {
    if (!date) return 'Never';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Never';
      return dateObj.toLocaleDateString(undefined, UI_CONFIG.DATE_FORMAT_OPTIONS);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Never';
    }
  },
  formatProgress: (progress, precision = UI_CONFIG.PROGRESS_BAR_PRECISION) =>
    Math.max(0, Math.min(100, progress)).toFixed(precision),
};

// Export everything as a single object for easy importing
export const REWARD_CONSTANTS = {
  LAMPORTS_PER_SOL,
  REWARD_RATES,
  AUTO_CLAIM_CONFIG,
  COOLDOWN_CONFIG,
  FETCH_CONFIG,
  UI_CONFIG,
  PROGRAM_CONFIG,
  VALIDATION_RULES,
  DEFAULT_REWARD_DATA,
  CONVERSION_HELPERS,
};

export default REWARD_CONSTANTS;