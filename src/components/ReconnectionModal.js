/**
 * Reconnection Modal Component
 * 
 * Displays reconnection progress to users with cancellation option
 */

import React from 'react';

/**
 * Reconnection progress modal
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether modal is visible
 * @param {Object} props.progress - Reconnection progress state
 * @param {Function} props.onCancel - Cancel callback
 */
export const ReconnectionModal = ({ isVisible, progress, onCancel }) => {
  if (!isVisible) return null;

  const { attempt, maxAttempts, nextRetryIn, canCancel } = progress;

  // Calculate progress percentage for visual indicator
  const progressPercentage = Math.max(0, Math.min(100, (attempt / maxAttempts) * 100));
  
  // Calculate circle stroke for progress ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="reconnection-modal">
      <div className="modal-content">
        {nextRetryIn > 0 ? (
          <>
            {/* Countdown display */}
            <div className="progress-ring">
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
                <span className="text-2xl font-bold text-gray-700">{nextRetryIn}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connection Lost
            </h3>
            <p className="text-gray-600 mb-4">
              Attempting to reconnect in {nextRetryIn} second{nextRetryIn !== 1 ? 's' : ''}...
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Attempt {attempt} of {maxAttempts}
            </p>
          </>
        ) : (
          <>
            {/* Connecting display */}
            <div className="spinner"></div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reconnecting...
            </h3>
            <p className="text-gray-600 mb-4">
              Attempting to restore connection
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Attempt {attempt} of {maxAttempts}
            </p>
          </>
        )}

        {canCancel && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Refresh Page
            </button>
          </div>
        )}

        {!canCancel && attempt >= maxAttempts && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
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