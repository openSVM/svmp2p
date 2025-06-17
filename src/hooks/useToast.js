/**
 * Toast hook for managing toast notifications
 * 
 * Provides categorized error handling:
 * - Critical errors: Show as persistent toasts (auth failures, network issues)
 * - Informational errors: Show inline or as brief toasts (form validation)
 * - System errors: Show as urgent toasts with actions (connection lost)
 */

import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * Error categories for proper UI placement
 */
export const ERROR_CATEGORIES = {
  CRITICAL: 'critical',     // Show as persistent toasts (auth, network)
  INFORMATIONAL: 'info',    // Show inline or brief toasts (validation)
  SYSTEM: 'system',         // Show as urgent toasts with actions (connection)
  SUCCESS: 'success',       // Show as brief success toasts
  WARNING: 'warning'        // Show as warning toasts
};

/**
 * Hook for managing categorized toast notifications
 * @returns {Object} Toast management functions and state
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ 
    message, 
    type = 'info', 
    category = ERROR_CATEGORIES.INFORMATIONAL,
    duration = 5000, 
    action = null,
    persistent = false 
  }) => {
    const id = ++toastId;
    
    // Adjust duration based on category
    let adjustedDuration = duration;
    if (category === ERROR_CATEGORIES.CRITICAL) {
      adjustedDuration = persistent ? 0 : 10000; // 10s or persistent
    } else if (category === ERROR_CATEGORIES.SYSTEM) {
      adjustedDuration = persistent ? 0 : 15000; // 15s or persistent 
    } else if (category === ERROR_CATEGORIES.SUCCESS) {
      adjustedDuration = 3000; // Brief success messages
    }
    
    const toast = {
      id,
      message,
      type,
      category,
      duration: adjustedDuration,
      action,
      timestamp: Date.now(),
      persistent
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const clearByCategory = useCallback((category) => {
    setToasts(prev => prev.filter(toast => toast.category !== category));
  }, []);

  // Convenience methods for different toast types with proper categorization
  const success = useCallback((message, options = {}) => {
    return addToast({ 
      message, 
      type: 'success', 
      category: ERROR_CATEGORIES.SUCCESS,
      ...options 
    });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ 
      message, 
      type: 'error', 
      category: ERROR_CATEGORIES.CRITICAL,
      duration: 8000, 
      ...options 
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ 
      message, 
      type: 'warning', 
      category: ERROR_CATEGORIES.WARNING,
      duration: 6000, 
      ...options 
    });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ 
      message, 
      type: 'info', 
      category: ERROR_CATEGORIES.INFORMATIONAL,
      ...options 
    });
  }, [addToast]);

  // Specialized methods for different error categories
  const criticalError = useCallback((message, options = {}) => {
    return addToast({
      message,
      type: 'error',
      category: ERROR_CATEGORIES.CRITICAL,
      duration: 10000,
      persistent: true,
      ...options
    });
  }, [addToast]);

  const systemError = useCallback((message, options = {}) => {
    return addToast({
      message,
      type: 'error',
      category: ERROR_CATEGORIES.SYSTEM,
      duration: 15000,
      ...options
    });
  }, [addToast]);

  const inlineError = useCallback((message, options = {}) => {
    // For inline errors, we provide the message but don't show toast
    // Components can use this for form validation, etc.
    return {
      message,
      type: 'error',
      category: ERROR_CATEGORIES.INFORMATIONAL,
      inline: true,
      ...options
    };
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    clearByCategory,
    success,
    error,
    warning,
    info,
    criticalError,
    systemError,
    inlineError,
    ERROR_CATEGORIES
  };
};

export default useToast;
