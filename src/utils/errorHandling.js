/**
 * Advanced Error Handling Utilities
 * 
 * Provides comprehensive error handling for browser extension conflicts,
 * wallet injection script errors, and external library compatibility issues.
 */

// Known external errors that should be filtered from console
const KNOWN_EXTERNAL_ERRORS = [
  'Cannot access \'m\' before initialization',
  'Could not establish connection. Receiving end does not exist',
  'A custom element with name \'mce-autosize-textarea\' has already been defined',
  'binanceInjectedProvider_asyncGeneratorStep',
  'inpage.js',
  'Cannot read properties of null (reading \'type\')',
  'runtime.lastError',
  'webcomponents-ce.js'
];

// Error categories for classification
export const ERROR_CATEGORIES = {
  WALLET_EXTENSION: 'wallet_extension',
  BROWSER_EXTENSION: 'browser_extension', 
  CUSTOM_ELEMENT: 'custom_element',
  NETWORK_CONNECTION: 'network_connection',
  APPLICATION: 'application',
  UNKNOWN: 'unknown'
};

/**
 * Classifies error based on message content
 */
export const classifyError = (error) => {
  const message = error?.message || error?.toString() || '';
  const stack = error?.stack || '';
  
  // Check for wallet extension errors
  if (message.includes('phantom') || message.includes('solana') || 
      message.includes('binance') || message.includes('wallet') ||
      stack.includes('inpage.js')) {
    return ERROR_CATEGORIES.WALLET_EXTENSION;
  }
  
  // Check for browser extension errors
  if (message.includes('runtime.lastError') || 
      message.includes('Could not establish connection') ||
      message.includes('Receiving end does not exist')) {
    return ERROR_CATEGORIES.BROWSER_EXTENSION;
  }
  
  // Check for custom element conflicts
  if (message.includes('custom element') || 
      message.includes('already been defined') ||
      stack.includes('webcomponents')) {
    return ERROR_CATEGORIES.CUSTOM_ELEMENT;
  }
  
  // Check for network/connection errors
  if (message.includes('fetch') || message.includes('network') ||
      message.includes('timeout') || message.includes('CORS')) {
    return ERROR_CATEGORIES.NETWORK_CONNECTION;
  }
  
  return ERROR_CATEGORIES.APPLICATION;
};

/**
 * Determines if an error should be suppressed from console
 */
export const shouldSuppressError = (error) => {
  const message = error?.message || error?.toString() || '';
  const stack = error?.stack || '';
  
  // Check against known external errors
  return KNOWN_EXTERNAL_ERRORS.some(knownError => 
    message.includes(knownError) || stack.includes(knownError)
  );
};

/**
 * Enhanced error logger that filters external noise
 */
export const logError = (error, context = '', level = 'error') => {
  const category = classifyError(error);
  
  // Suppress known external errors but log to debug
  if (shouldSuppressError(error)) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[EXTERNAL ERROR - ${category}] ${context}:`, error);
    }
    return;
  }
  
  // Log application errors normally
  const logMethod = console[level] || console.error;
  logMethod(`[${category}] ${context}:`, error);
};

/**
 * Error boundary wrapper for React components
 */
export class ExternalErrorBoundary extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'ExternalErrorBoundary';
    this.originalError = originalError;
    this.category = classifyError(originalError);
  }
}

/**
 * Safe error wrapper that prevents external errors from breaking app
 */
export const safeExecute = async (fn, context = '', fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    const category = classifyError(error);
    
    // For external errors, return fallback instead of throwing
    if (category !== ERROR_CATEGORIES.APPLICATION) {
      logError(error, `Safe execution failed in ${context}`, 'warn');
      return fallback;
    }
    
    // Re-throw application errors
    logError(error, `Application error in ${context}`);
    throw error;
  }
};

/**
 * Setup global error handling for wallet extensions
 */
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (shouldSuppressError(event.reason)) {
      event.preventDefault(); // Prevent console noise
      if (process.env.NODE_ENV === 'development') {
        console.debug('[SUPPRESSED REJECTION]:', event.reason);
      }
    }
  });
  
  // Handle general window errors
  window.addEventListener('error', (event) => {
    if (shouldSuppressError(event.error)) {
      event.preventDefault(); // Prevent console noise
      if (process.env.NODE_ENV === 'development') {
        console.debug('[SUPPRESSED ERROR]:', event.error);
      }
    }
  });
  
  // Override console.error for external error filtering
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Check if any argument contains external error patterns
    const hasExternalError = args.some(arg => {
      if (typeof arg === 'string') {
        return KNOWN_EXTERNAL_ERRORS.some(pattern => arg.includes(pattern));
      }
      if (arg instanceof Error) {
        return shouldSuppressError(arg);
      }
      return false;
    });
    
    if (hasExternalError) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[FILTERED ERROR]:', ...args);
      }
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
  
  console.log('[ErrorHandling] Global error filtering initialized');
};

/**
 * Cleanup function for error handling
 */
export const cleanupErrorHandling = () => {
  // Remove event listeners if needed
  // This is primarily for testing or hot reloading scenarios
  if (typeof window !== 'undefined') {
    // Note: We don't remove the listeners in production as they should persist
    if (process.env.NODE_ENV === 'development') {
      console.log('[ErrorHandling] Cleanup called (dev mode)');
    }
  }
};

/**
 * Error reporter for analytics (future use)
 */
export const reportError = (error, context = '', metadata = {}) => {
  const category = classifyError(error);
  
  // Don't report external errors
  if (category === ERROR_CATEGORIES.APPLICATION) {
    // Future: Send to analytics service
    console.warn('[ERROR REPORT]', {
      message: error.message,
      stack: error.stack,
      context,
      category,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }
};

const errorHandlingUtils = {
  classifyError,
  shouldSuppressError,
  logError,
  safeExecute,
  setupGlobalErrorHandling,
  cleanupErrorHandling,
  reportError,
  ERROR_CATEGORIES
};

export default errorHandlingUtils;