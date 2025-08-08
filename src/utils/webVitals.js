// Web Vitals monitoring and reporting
import React from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

/**
 * Web Vitals configuration
 */
const VITALS_CONFIG = {
  // Thresholds for performance metrics (in milliseconds)
  thresholds: {
    FCP: 1000,    // First Contentful Paint < 1s
    LCP: 2000,    // Largest Contentful Paint < 2s
    INP: 200,     // Interaction to Next Paint < 200ms
    CLS: 0.1,     // Cumulative Layout Shift < 0.1
    TTFB: 600,    // Time to First Byte < 600ms
  },
  // Enable detailed logging in development
  enableDebugLogs: process.env.NODE_ENV === 'development',
};

/**
 * Send metric to analytics service (placeholder)
 * In production, this would send to your analytics service
 */
const sendToAnalytics = (metric) => {
  if (VITALS_CONFIG.enableDebugLogs) {
    console.log('📊 Web Vitals:', metric);
  }
  
  // Example: Send to Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
  
  // Example: Send to custom analytics endpoint
  // Note: Disabled for static export - would need external analytics service
  if (typeof window !== 'undefined' && window.fetch && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_API === 'true') {
    // Batch analytics calls to avoid performance impact
    if (!window._vitalsQueue) {
      window._vitalsQueue = [];
      // Send batched metrics every 5 seconds
      setInterval(() => {
        if (window._vitalsQueue.length > 0) {
          fetch('/api/analytics/vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metrics: window._vitalsQueue }),
          }).catch(() => {}); // Silently fail to avoid affecting user experience
          window._vitalsQueue = [];
        }
      }, 5000);
    }
    window._vitalsQueue.push(metric);
  }
};

/**
 * Check if metric meets performance threshold
 */
const checkThreshold = (metric) => {
  const threshold = VITALS_CONFIG.thresholds[metric.name];
  if (threshold) {
    const status = metric.value <= threshold ? '✅' : '❌';
    const message = `${status} ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (threshold: ${threshold}${metric.name === 'CLS' ? '' : 'ms'})`;
    
    if (VITALS_CONFIG.enableDebugLogs) {
      console.log(message);
    }
    
    return metric.value <= threshold;
  }
  return true;
};

/**
 * Enhanced metric handler with threshold checking
 */
const handleMetric = (metric) => {
  // Check against thresholds
  const meetsThreshold = checkThreshold(metric);
  
  // Add threshold status to metric
  const enhancedMetric = {
    ...metric,
    meetsThreshold,
    threshold: VITALS_CONFIG.thresholds[metric.name],
  };
  
  // Send to analytics
  sendToAnalytics(enhancedMetric);
};

/**
 * Initialize Web Vitals monitoring
 */
export const initWebVitals = () => {
  try {
    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    
    if (VITALS_CONFIG.enableDebugLogs) {
      console.log('🚀 Web Vitals monitoring initialized');
    }
  } catch (error) {
    console.warn('Failed to initialize Web Vitals:', error);
  }
};

/**
 * Get current performance metrics summary
 */
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined') return null;
  
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  const metrics = {
    // Navigation timing
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
    
    // Paint timing
    firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
    
    // Resource timing
    totalResources: performance.getEntriesByType('resource').length,
    
    // Memory usage (if available)
    ...(performance.memory && {
      memoryUsage: {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      }
    }),
  };
  
  return metrics;
};

/**
 * Performance monitoring React hook
 */
export const usePerformanceMonitoring = () => {
  React.useEffect(() => {
    initWebVitals();
    
    // Log performance metrics after page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const metrics = getPerformanceMetrics();
          if (VITALS_CONFIG.enableDebugLogs && metrics) {
            console.log('📈 Performance Summary:', metrics);
          }
        }, 1000);
      });
    }
  }, []);
  
  return {
    getMetrics: getPerformanceMetrics,
    thresholds: VITALS_CONFIG.thresholds,
  };
};

/**
 * Performance observer for custom metrics
 */
export const observePerformance = (callback) => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(callback);
    });
    
    // Observe different types of performance entries
    observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
    
    return observer;
  } catch (error) {
    console.warn('Performance observer not supported:', error);
  }
};

export default {
  initWebVitals,
  getPerformanceMetrics,
  usePerformanceMonitoring,
  observePerformance,
  VITALS_CONFIG,
};