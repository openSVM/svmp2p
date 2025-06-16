/**
 * Toast hook for managing toast notifications
 */

import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * Hook for managing toast notifications
 * @returns {Object} Toast management functions and state
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 5000, action = null }) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration,
      action,
      timestamp: Date.now()
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

  // Convenience methods for different toast types
  const success = useCallback((message, options = {}) => {
    return addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ message, type: 'error', duration: 8000, ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ message, type: 'warning', duration: 6000, ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ message, type: 'info', ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

export default useToast;