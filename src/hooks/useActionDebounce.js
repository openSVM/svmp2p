import React, { useState, useCallback, useRef } from 'react';
import { ACTION_DEBOUNCE_TIME } from '../constants/tradingConstants';

/**
 * Hook to debounce actions and prevent rapid repeated clicks
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} - { debouncedCallback, isDisabled }
 */
export const useActionDebounce = (callback, delay = ACTION_DEBOUNCE_TIME) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (isDisabled) {
      return; // Prevent rapid clicks
    }

    setIsDisabled(true);
    
    // Execute the callback immediately
    callback(...args);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to re-enable the action
    timeoutRef.current = setTimeout(() => {
      setIsDisabled(false);
    }, delay);
  }, [callback, delay, isDisabled]);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsDisabled(false);
    }
  }, []);

  return { debouncedCallback, isDisabled, cleanup };
};

/**
 * Hook for input validation with debouncing
 * @param {*} value - The input value to validate
 * @param {Function} validator - The validation function
 * @param {number} delay - Debounce delay for validation
 * @returns {Object} - { isValid, error, validateNow }
 */
export const useInputValidation = (value, validator, delay = 300) => {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');
  const timeoutRef = useRef(null);

  const validateNow = useCallback(() => {
    try {
      const result = validator(value);
      if (result === true) {
        setIsValid(true);
        setError('');
      } else {
        setIsValid(false);
        setError(result || 'Invalid input');
      }
    } catch (err) {
      setIsValid(false);
      setError(err.message || 'Validation error');
    }
  }, [value, validator]);

  // Debounced validation
  const debouncedValidate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      validateNow();
    }, delay);
  }, [validateNow, delay]);

  // Run validation when value changes
  React.useEffect(() => {
    if (value !== undefined && value !== '') {
      debouncedValidate();
    } else {
      setIsValid(true);
      setError('');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, debouncedValidate]);

  return { isValid, error, validateNow };
};