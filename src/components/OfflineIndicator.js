import React from 'react';
import { useOfflineState } from '../hooks/useOfflineState';

const OfflineIndicator = ({ className = '' }) => {
  const { isOffline, syncStatus, getQueueSize } = useOfflineState();

  if (!isOffline && syncStatus === 'idle') {
    return null;
  }

  const renderContent = () => {
    if (isOffline) {
      const queueSize = getQueueSize();
      return (
        <div className="offline-indicator offline" aria-live="polite" aria-label="You're offline">
          <div className="offline-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              <path d="M8.5 16.5L7 18"/>
              <path d="M22 2L2 22"/>
            </svg>
          </div>
          <span className="offline-text">
            You're offline
            {queueSize > 0 && (
              <span className="queue-count"> • {queueSize} pending</span>
            )}
          </span>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div className="offline-indicator syncing" aria-live="polite" aria-label="Syncing...">
          <div className="sync-spinner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            </svg>
          </div>
          <span className="sync-text">Syncing...</span>
        </div>
      );
    }

    if (syncStatus === 'success') {
      return (
        <div className="offline-indicator success" aria-live="polite" aria-label="Synced">
          <div className="success-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="9"/>
            </svg>
          </div>
          <span className="success-text">Synced</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`offline-indicator-container ${className}`}>
      {renderContent()}
    </div>
  );
};

export default OfflineIndicator;