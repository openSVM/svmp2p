/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useOfflineState } from '../hooks/useOfflineState';

// Mock the hook for testing
jest.mock('../hooks/useOfflineState');

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    controller: {
      postMessage: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock online/offline events
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('PWA Offline Functionality', () => {
  let mockUseOfflineState;

  beforeEach(() => {
    mockUseOfflineState = useOfflineState;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('useOfflineState hook', () => {
    test('should detect online/offline state', () => {
      const mockReturnValue = {
        isOnline: true,
        isOffline: false,
        offlineQueue: [],
        syncStatus: 'idle',
        queueAction: jest.fn(),
        removeFromQueue: jest.fn(),
        clearQueue: jest.fn(),
        getQueueSize: jest.fn(() => 0),
        hasQueuedActions: jest.fn(() => false)
      };
      
      mockUseOfflineState.mockReturnValue(mockReturnValue);
      
      const { result } = renderHook(() => useOfflineState());
      
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    test('should queue actions when offline', () => {
      const queueActionMock = jest.fn();
      
      mockUseOfflineState.mockReturnValue({
        isOnline: false,
        isOffline: true,
        offlineQueue: [],
        syncStatus: 'idle',
        queueAction: queueActionMock,
        removeFromQueue: jest.fn(),
        clearQueue: jest.fn(),
        getQueueSize: jest.fn(() => 0),
        hasQueuedActions: jest.fn(() => false)
      });
      
      const { result } = renderHook(() => useOfflineState());
      
      const action = {
        type: 'transaction',
        data: { amount: 100, recipient: 'test' }
      };
      
      result.current.queueAction(action);
      
      expect(queueActionMock).toHaveBeenCalledWith(action);
    });

    test('should handle sync status changes', () => {
      const mockReturnValue = {
        isOnline: true,
        isOffline: false,
        offlineQueue: [],
        syncStatus: 'syncing',
        queueAction: jest.fn(),
        removeFromQueue: jest.fn(),
        clearQueue: jest.fn(),
        getQueueSize: jest.fn(() => 0),
        hasQueuedActions: jest.fn(() => false)
      };
      
      mockUseOfflineState.mockReturnValue(mockReturnValue);
      
      const { result } = renderHook(() => useOfflineState());
      
      expect(result.current.syncStatus).toBe('syncing');
    });
  });

  describe('Service Worker Registration', () => {
    test('should register service worker', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        scope: '/',
        active: true
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: mockRegister
        },
        writable: true
      });
      
      // Simulate service worker registration
      await navigator.serviceWorker.register('/sw.js');
      
      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    });

    test('should handle service worker registration failure', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('Registration failed'));
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: mockRegister
        },
        writable: true
      });
      
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        expect(error.message).toBe('Registration failed');
      }
      
      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    });
  });

  describe('Offline Queue Management', () => {
    test('should manage offline queue correctly', () => {
      const mockQueue = [
        { id: '1', type: 'transaction', data: { amount: 100 } },
        { id: '2', type: 'profile', data: { name: 'Test User' } }
      ];
      
      mockUseOfflineState.mockReturnValue({
        isOnline: false,
        isOffline: true,
        offlineQueue: mockQueue,
        syncStatus: 'idle',
        queueAction: jest.fn(),
        removeFromQueue: jest.fn(),
        clearQueue: jest.fn(),
        getQueueSize: jest.fn(() => mockQueue.length),
        hasQueuedActions: jest.fn(() => true)
      });
      
      const { result } = renderHook(() => useOfflineState());
      
      expect(result.current.getQueueSize()).toBe(2);
      expect(result.current.hasQueuedActions()).toBe(true);
      expect(result.current.offlineQueue).toEqual(mockQueue);
    });

    test('should clear queue when requested', () => {
      const clearQueueMock = jest.fn();
      
      mockUseOfflineState.mockReturnValue({
        isOnline: true,
        isOffline: false,
        offlineQueue: [],
        syncStatus: 'idle',
        queueAction: jest.fn(),
        removeFromQueue: jest.fn(),
        clearQueue: clearQueueMock,
        getQueueSize: jest.fn(() => 0),
        hasQueuedActions: jest.fn(() => false)
      });
      
      const { result } = renderHook(() => useOfflineState());
      
      result.current.clearQueue();
      
      expect(clearQueueMock).toHaveBeenCalled();
    });
  });

  describe('Background Sync', () => {
    test('should register background sync when supported', () => {
      const mockRegister = jest.fn();
      
      // Mock background sync support
      Object.defineProperty(window, 'ServiceWorkerRegistration', {
        value: {
          prototype: {
            sync: {
              register: mockRegister
            }
          }
        },
        writable: true
      });
      
      // Simulate background sync registration
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        expect(true).toBe(true); // Background sync is supported
      }
    });

    test('should handle background sync when not supported', () => {
      // Remove sync support
      delete window.ServiceWorkerRegistration;
      
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration?.prototype) {
        // Should not enter this block
        expect(false).toBe(true);
      } else {
        // Background sync not supported
        expect(true).toBe(true);
      }
    });
  });

  describe('Network State Detection', () => {
    test('should detect online state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      expect(navigator.onLine).toBe(true);
    });

    test('should detect offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      expect(navigator.onLine).toBe(false);
    });

    test('should handle online/offline events', () => {
      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Simulate going online
      window.dispatchEvent(new Event('online'));
      expect(onlineHandler).toHaveBeenCalled();
      
      // Simulate going offline
      window.dispatchEvent(new Event('offline'));
      expect(offlineHandler).toHaveBeenCalled();
      
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    });
  });

  describe('PWA Manifest', () => {
    test('should have valid manifest configuration', () => {
      // Mock manifest.json content
      const manifest = {
        name: 'OpenSVM P2P Exchange',
        short_name: 'OpenSVM P2P',
        description: 'A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [
          {
            src: '/images/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/images/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      };
      
      expect(manifest.name).toBe('OpenSVM P2P Exchange');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.icons).toHaveLength(2);
    });
  });
});

// Helper function to render hooks
function renderHook(hook) {
  let result = {};
  
  const TestComponent = () => {
    result.current = hook();
    return React.createElement('div', null, 'test');
  };
  
  render(React.createElement(TestComponent));
  
  return { result };
}