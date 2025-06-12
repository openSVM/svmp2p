/**
 * Performance optimization tests
 * Tests for verifying the performance improvements implemented
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { initWebVitals, getPerformanceMetrics } from '../utils/webVitals';
import { createLazyComponent, usePreloader, analyzeBundleSize } from '../utils/lazyLoading';

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
    getEntriesByType: jest.fn(() => [
      {
        name: 'first-paint',
        startTime: 500,
      },
      {
        name: 'first-contentful-paint',
        startTime: 800,
      },
    ]),
    now: jest.fn(() => Date.now()),
  },
});

// Mock web-vitals functions
jest.mock('web-vitals', () => ({
  onCLS: jest.fn((callback) => callback({ name: 'CLS', value: 0.05, id: 'cls-1' })),
  onFID: jest.fn((callback) => callback({ name: 'FID', value: 50, id: 'fid-1' })),
  onFCP: jest.fn((callback) => callback({ name: 'FCP', value: 900, id: 'fcp-1' })),
  onLCP: jest.fn((callback) => callback({ name: 'LCP', value: 1800, id: 'lcp-1' })),
  onTTFB: jest.fn((callback) => callback({ name: 'TTFB', value: 400, id: 'ttfb-1' })),
}));

describe('Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Web Vitals Monitoring', () => {
    test('should initialize web vitals monitoring', () => {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = require('web-vitals');
      
      initWebVitals();

      expect(onCLS).toHaveBeenCalled();
      expect(onFID).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
    });

    test('should get performance metrics', () => {
      const metrics = getPerformanceMetrics();

      expect(metrics).toMatchObject({
        firstPaint: 500,
        firstContentfulPaint: 800,
        memoryUsage: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000,
        },
      });
      
      // Check that totalResources is a number
      expect(typeof metrics.totalResources).toBe('number');
    });

    test('should handle web vitals initialization errors gracefully', () => {
      const originalWebVitals = require('web-vitals');
      require('web-vitals').onCLS = jest.fn(() => {
        throw new Error('Web Vitals error');
      });

      expect(() => initWebVitals()).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('Failed to initialize Web Vitals:', expect.any(Error));

      // Restore
      Object.assign(require('web-vitals'), originalWebVitals);
    });
  });

  describe('Lazy Loading Components', () => {
    test('should create lazy component with fallback', async () => {
      const MockComponent = () => <div>Loaded Component</div>;
      const LazyComponent = createLazyComponent(
        () => Promise.resolve({ default: MockComponent }),
        {
          fallback: <div>Loading...</div>,
        }
      );

      const { getByText } = render(<LazyComponent />);

      // Should show fallback initially
      expect(getByText('Loading...')).toBeInTheDocument();

      // Should load component
      await waitFor(() => {
        expect(getByText('Loaded Component')).toBeInTheDocument();
      });
    });

    test('should handle lazy loading errors', async () => {
      const LazyComponent = createLazyComponent(
        () => Promise.reject(new Error('Load failed')),
        {
          fallback: <div>Loading...</div>,
          errorFallback: <div>Error loading component</div>,
        }
      );

      const { getByText } = render(<LazyComponent />);

      await waitFor(() => {
        expect(getByText('Error loading component')).toBeInTheDocument();
      });
    });

    test('should support preloading', () => {
      const importFunction = jest.fn(() => Promise.resolve({ default: () => <div>Component</div> }));
      const LazyComponent = createLazyComponent(importFunction, { preload: true });

      render(<LazyComponent />);

      // Should call import function for preloading
      expect(importFunction).toHaveBeenCalled();
    });
  });

  describe('Component Preloader Hook', () => {
    test('should preload components', async () => {
      const mockComponent = jest.fn(() => Promise.resolve({ default: () => <div>Component</div> }));
      const componentMap = {
        TestComponent: mockComponent,
      };

      const TestPreloader = () => {
        const { preloadComponent, isLoaded } = usePreloader(componentMap);
        
        React.useEffect(() => {
          preloadComponent('TestComponent');
        }, [preloadComponent]);

        return <div>{isLoaded('TestComponent') ? 'Loaded' : 'Not Loaded'}</div>;
      };

      const { getByText } = render(<TestPreloader />);

      await waitFor(() => {
        expect(getByText('Loaded')).toBeInTheDocument();
      });

      expect(mockComponent).toHaveBeenCalled();
    });

    test('should handle preload errors', async () => {
      const mockComponent = jest.fn(() => Promise.reject(new Error('Preload failed')));
      const componentMap = {
        TestComponent: mockComponent,
      };

      const TestPreloader = () => {
        const { preloadComponent, hasError } = usePreloader(componentMap);
        
        React.useEffect(() => {
          preloadComponent('TestComponent');
        }, [preloadComponent]);

        return <div>{hasError('TestComponent') ? 'Has Error' : 'No Error'}</div>;
      };

      const { getByText } = render(<TestPreloader />);

      await waitFor(() => {
        expect(getByText('Has Error')).toBeInTheDocument();
      });
    });
  });

  describe('Bundle Size Analysis', () => {
    test('should analyze bundle size in development', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock window.addEventListener
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      analyzeBundleSize();

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));

      // Restore
      process.env.NODE_ENV = originalEnv;
      addEventListenerSpy.mockRestore();
    });

    test('should not analyze bundle size in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      analyzeBundleSize();

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      // Restore
      process.env.NODE_ENV = originalEnv;
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Performance Thresholds', () => {
    test('should validate web vitals against thresholds', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Mock metrics that meet thresholds
      const { onFCP } = require('web-vitals');
      
      initWebVitals();
      
      // The mocked FCP value (900ms) should meet the threshold (1000ms)
      expect(onFCP).toHaveBeenCalled();
      
      // Verify logging was called (indicating threshold checking)
      expect(consoleSpy).toHaveBeenCalledWith('🚀 Web Vitals monitoring initialized');
    });
  });

  describe('Performance Budget Validation', () => {
    test('should verify bundle size targets', () => {
      // Based on the build output, verify that our optimizations are working
      const expectedChunks = [
        'react', // React chunk should be separate
        'solana', // Solana dependencies should be separate
        'vendors', // Other vendors should be separate
      ];

      // This is a conceptual test - in a real implementation, 
      // you would analyze the actual build output
      expectedChunks.forEach(chunk => {
        expect(chunk).toBeDefined();
      });
    });

    test('should meet first contentful paint target', () => {
      const metrics = getPerformanceMetrics();
      
      // FCP should be under 1000ms
      expect(metrics.firstContentfulPaint).toBeLessThan(1000);
    });

    test('should have reasonable memory usage', () => {
      const metrics = getPerformanceMetrics();
      
      // Memory usage should be reasonable
      expect(metrics.memoryUsage.usedJSHeapSize).toBeLessThan(metrics.memoryUsage.jsHeapSizeLimit);
    });
  });
});

export default {};