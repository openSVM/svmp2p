import { useState, useEffect, useCallback } from 'react';

export const useOfflineState = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Handle online/offline events
    const handleOnline = () => {
      console.log('[OfflineState] Going online');
      setIsOnline(true);
      setSyncStatus('syncing');
      
      // Trigger background sync if service worker supports it
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_SYNC'
        });
      }
      
      // Auto-sync after coming online
      setTimeout(() => {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }, 1000);
    };

    const handleOffline = () => {
      console.log('[OfflineState] Going offline');
      setIsOnline(false);
      setSyncStatus('idle');
    };

    // Handle service worker messages
    const handleServiceWorkerMessage = (event) => {
      if (event.data) {
        switch (event.data.type) {
          case 'TRANSACTION_SYNC_SUCCESS':
            console.log('[OfflineState] Transaction synced:', event.data.transactionId);
            removeFromQueue(event.data.transactionId);
            break;
          case 'PROFILE_SYNC_SUCCESS':
            console.log('[OfflineState] Profile synced:', event.data.updateId);
            removeFromQueue(event.data.updateId);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Queue an action for when we come back online
  const queueAction = useCallback((action) => {
    const queueItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action
    };
    
    setOfflineQueue(prev => [...prev, queueItem]);
    
    // If we have a service worker, send the action there too
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: action.type === 'transaction' ? 'QUEUE_TRANSACTION' : 'QUEUE_PROFILE_UPDATE',
        [action.type]: action.data
      });
    }
    
    return queueItem.id;
  }, []);

  // Remove an item from the queue
  const removeFromQueue = useCallback((id) => {
    setOfflineQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear all queued actions
  const clearQueue = useCallback(() => {
    setOfflineQueue([]);
  }, []);

  // Get queue size
  const getQueueSize = useCallback(() => {
    return offlineQueue.length;
  }, [offlineQueue.length]);

  // Check if a specific type of action is queued
  const hasQueuedActions = useCallback((actionType) => {
    if (!actionType) return offlineQueue.length > 0;
    return offlineQueue.some(item => item.type === actionType);
  }, [offlineQueue]);

  return {
    isOnline,
    isOffline: !isOnline,
    offlineQueue,
    syncStatus,
    queueAction,
    removeFromQueue,
    clearQueue,
    getQueueSize,
    hasQueuedActions
  };
};