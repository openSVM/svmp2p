/**
 * Professional logging utility for the P2P exchange platform
 * 
 * Provides structured logging with levels, context, and production-safe output.
 * Replaces scattered console.log statements with centralized, configurable logging.
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Current log level - can be configured via environment
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.WARN 
  : LOG_LEVELS.DEBUG;

/**
 * Format log message with timestamp and context
 * @param {string} level - Log level
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 * @returns {Object} Formatted log entry
 */
const formatLog = (level, component, message, data = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  component,
  message,
  ...data
});

/**
 * Logger class with component-specific context
 */
class Logger {
  constructor(component) {
    this.component = component;
  }

  error(message, data = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      const logEntry = formatLog('ERROR', this.component, message, data);
      console.error(`[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.component}] ${logEntry.message}`, data);
    }
  }

  warn(message, data = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      const logEntry = formatLog('WARN', this.component, message, data);
      console.warn(`[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.component}] ${logEntry.message}`, data);
    }
  }

  info(message, data = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      const logEntry = formatLog('INFO', this.component, message, data);
      console.info(`[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.component}] ${logEntry.message}`, data);
    }
  }

  debug(message, data = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      const logEntry = formatLog('DEBUG', this.component, message, data);
      console.log(`[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.component}] ${logEntry.message}`, data);
    }
  }

  trace(message, data = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.TRACE) {
      const logEntry = formatLog('TRACE', this.component, message, data);
      console.log(`[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.component}] ${logEntry.message}`, data);
    }
  }
}

/**
 * Create a logger instance for a specific component
 * @param {string} component - Component name
 * @returns {Logger} Logger instance
 */
export const createLogger = (component) => new Logger(component);

/**
 * Global logger for general use
 */
export const logger = new Logger('Global');

/**
 * Performance logging utility
 */
export const perfLogger = {
  start: (operation) => {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        logger.debug(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

export default logger;