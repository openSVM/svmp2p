/**
 * Reconnection Modal Component
 * 
 * Displays reconnection progress to users with cancellation option
 * Includes proper focus management and accessibility features
 */

import React, { useEffect, useRef } from 'react';

/**
 * Trap focus within modal for accessibility
 * @param {HTMLElement} element - Modal element to trap focus within
 */
const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  return () => element.removeEventListener('keydown', handleTabKey);
};

/**
 * Reconnection progress modal with accessibility features
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether modal is visible
 * @param {Object} props.progress - Reconnection progress state
 * @param {Function} props.onCancel - Cancel callback
 */
export const ReconnectionModal = ({ isVisible, progress, onCancel }) => {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isVisible && modalRef.current) {
      // Store currently focused element
      previousActiveElementRef.current = document.activeElement;
      
      // Focus the modal container
      modalRef.current.focus();
      
      // Set up focus trap
      const removeFocusTrap = trapFocus(modalRef.current);
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Cleanup
        removeFocusTrap();
        document.body.style.overflow = '';
        
        // Restore previous focus
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible && progress.canCancel) {
        onCancel();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, progress.canCancel, onCancel]);

  if (!isVisible) return null;

  const { attempt, maxAttempts, nextRetryIn, canCancel } = progress;

  // Calculate progress percentage for visual indicator
  const progressPercentage = Math.max(0, Math.min(100, (attempt / maxAttempts) * 100));
  
  // Calculate circle stroke for progress ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div 
      className="reconnection-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconnection-title"
      aria-describedby="reconnection-description"
    >
      <div 
        className="modal-content"
        ref={modalRef}
        tabIndex={-1}
      >
        {nextRetryIn > 0 ? (
          <>
            {/* Countdown display */}
            <div className="progress-ring" aria-hidden="true">
              <svg width="80" height="80" className="transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="progress-circle"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="progress-circle active"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="reconnection-timer-text" aria-live="polite">
                  {nextRetryIn}
                </span>
              </div>
            </div>
            
            <h3 id="reconnection-title" className="reconnection-title">
              Connection Lost
            </h3>
            <p id="reconnection-description" className="reconnection-description">
              Attempting to reconnect in {nextRetryIn} second{nextRetryIn !== 1 ? 's' : ''}...
            </p>
            <p className="reconnection-attempt-info" aria-live="polite">
              Attempt {attempt} of {maxAttempts}
            </p>
          </>
        ) : (
          <>
            {/* Connecting display */}
            <div className="spinner" aria-hidden="true"></div>
            
            <h3 id="reconnection-title" className="reconnection-title">
              Reconnecting...
            </h3>
            <p id="reconnection-description" className="reconnection-description">
              Attempting to restore connection
            </p>
            <p className="reconnection-attempt-info" aria-live="polite">
              Attempt {attempt} of {maxAttempts}
            </p>
          </>
        )}

        {canCancel && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="reconnection-cancel-button"
              aria-label="Cancel reconnection"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.reload()}
              className="reconnection-refresh-button"
              aria-label="Refresh page to retry connection"
            >
              Refresh Page
            </button>
          </div>
        )}

        {!canCancel && attempt >= maxAttempts && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Refresh page - all reconnection attempts failed"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconnectionModal;
