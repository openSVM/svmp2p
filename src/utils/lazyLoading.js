// Enhanced lazy loading utilities for better performance
import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';

/**
 * Enhanced lazy loading with preloading and error handling
 */
export const createLazyComponent = (importFunction, options = {}) => {
  const {
    fallback = <div className="loading-placeholder">Loading...</div>,
    errorFallback = <div className="error-placeholder">Failed to load component</div>,
    preload = false,
    retryDelay = 2000,
    maxRetries = 3,
  } = options;

  // Create the lazy component
  const LazyComponent = lazy(() => {
    return importFunction().catch(error => {
      console.error('Failed to load component:', error);
      throw error;
    });
  });

  // Error boundary component for lazy loading errors
  class LazyLoadErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, retryCount: 0 };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Lazy component error:', error, errorInfo);
    }

    handleRetry = () => {
      if (this.state.retryCount < maxRetries) {
        setTimeout(() => {
          this.setState({ 
            hasError: false, 
            retryCount: this.state.retryCount + 1 
          });
        }, retryDelay);
      }
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="lazy-load-error">
            {errorFallback}
            {this.state.retryCount < maxRetries && (
              <button onClick={this.handleRetry} className="retry-button">
                Retry ({maxRetries - this.state.retryCount} attempts left)
              </button>
            )}
          </div>
        );
      }

      return this.props.children;
    }
  }

  // Enhanced wrapper component
  const EnhancedLazyComponent = React.forwardRef((props, ref) => {
    const [shouldPreload, setShouldPreload] = useState(preload);

    useEffect(() => {
      if (shouldPreload) {
        // Preload the component
        importFunction().catch(() => {
          // Silent fail for preload
        });
      }
    }, [shouldPreload]);

    return (
      <LazyLoadErrorBoundary>
        <Suspense fallback={fallback}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </LazyLoadErrorBoundary>
    );
  });

  // Add preload method to component
  EnhancedLazyComponent.preload = () => {
    return importFunction().catch(() => {});
  };

  return EnhancedLazyComponent;
};

/**
 * Hook for managing component preloading
 */
export const usePreloader = (componentMap = {}) => {
  const [preloadStatus, setPreloadStatus] = useState({});

  const preloadComponent = useCallback(async (componentName) => {
    if (!componentMap[componentName]) {
      console.warn(`Component "${componentName}" not found in preload map`);
      return;
    }

    setPreloadStatus(prev => ({
      ...prev,
      [componentName]: { status: 'loading', error: null }
    }));

    try {
      await componentMap[componentName]();
      setPreloadStatus(prev => ({
        ...prev,
        [componentName]: { status: 'loaded', error: null }
      }));
    } catch (error) {
      console.error(`Failed to preload ${componentName}:`, error);
      setPreloadStatus(prev => ({
        ...prev,
        [componentName]: { status: 'error', error: error.message }
      }));
    }
  }, [componentMap]);

  const preloadAll = useCallback(async () => {
    const promises = Object.keys(componentMap).map(componentName => 
      preloadComponent(componentName)
    );
    await Promise.allSettled(promises);
  }, [componentMap, preloadComponent]);

  const isLoaded = useCallback((componentName) => {
    return preloadStatus[componentName]?.status === 'loaded';
  }, [preloadStatus]);

  const isLoading = useCallback((componentName) => {
    return preloadStatus[componentName]?.status === 'loading';
  }, [preloadStatus]);

  const hasError = useCallback((componentName) => {
    return preloadStatus[componentName]?.status === 'error';
  }, [preloadStatus]);

  return {
    preloadStatus,
    preloadComponent,
    preloadAll,
    isLoaded,
    isLoading,
    hasError,
  };
};

/**
 * Higher-order component for intersection-based lazy loading
 */
export const withIntersectionLazyLoad = (WrappedComponent, options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    fallback = <div className="intersection-loading">Loading...</div>,
  } = options;

  return React.forwardRef((props, ref) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const elementRef = React.useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !shouldLoad) {
            setIsIntersecting(true);
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { threshold, rootMargin }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }, [shouldLoad]);

    if (!shouldLoad) {
      return (
        <div 
          ref={elementRef} 
          className="intersection-lazy-wrapper"
          style={{ minHeight: '200px' }}
        >
          {fallback}
        </div>
      );
    }

    return <WrappedComponent {...props} ref={ref} />;
  });
};

/**
 * Dynamic import with retry logic
 */
export const createRetryableImport = (importFunction, options = {}) => {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  return async () => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importFunction();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  };
};

/**
 * Smart preloader that uses requestIdleCallback
 */
export const useIdlePreloader = (preloadFunctions = []) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.requestIdleCallback) {
      return;
    }

    const preloadQueue = [...preloadFunctions];
    
    const processQueue = (deadline) => {
      while (deadline.timeRemaining() > 0 && preloadQueue.length > 0) {
        const preloadFn = preloadQueue.shift();
        preloadFn().catch(() => {
          // Silent fail for idle preloading
        });
      }

      if (preloadQueue.length > 0) {
        window.requestIdleCallback(processQueue);
      }
    };

    window.requestIdleCallback(processQueue);
  }, [preloadFunctions]);
};

/**
 * Enhanced bundle size analyzer with performance recommendations
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const getResourceSizes = () => {
    const resources = performance.getEntriesByType('resource');
    const sizes = resources.reduce((acc, resource) => {
      const url = new URL(resource.name, window.location.origin);
      const transferSize = resource.transferSize || 0;
      
      if (url.pathname.includes('chunk') || url.pathname.includes('.js')) {
        acc.javascript += transferSize;
        acc.jsChunks.push({
          name: url.pathname.split('/').pop(),
          size: transferSize,
          loadTime: resource.responseEnd - resource.startTime
        });
      } else if (url.pathname.includes('.css')) {
        acc.css += transferSize;
      } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
        acc.images += transferSize;
      }
      acc.total += transferSize;
      return acc;
    }, { 
      javascript: 0, 
      css: 0, 
      images: 0, 
      total: 0,
      jsChunks: []
    });

    return sizes;
  };

  const getPerformanceMetrics = () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  };

  window.addEventListener('load', () => {
    setTimeout(() => {
      const sizes = getResourceSizes();
      const metrics = getPerformanceMetrics();
      
      console.log('📦 Bundle Size Analysis:', {
        JavaScript: `${(sizes.javascript / 1024).toFixed(2)} KB`,
        CSS: `${(sizes.css / 1024).toFixed(2)} KB`,
        Images: `${(sizes.images / 1024).toFixed(2)} KB`,
        Total: `${(sizes.total / 1024).toFixed(2)} KB`,
      });

      console.log('⚡ Performance Metrics:', {
        'DOM Content Loaded': `${metrics.domContentLoaded.toFixed(2)}ms`,
        'Load Complete': `${metrics.loadComplete.toFixed(2)}ms`,
        'First Contentful Paint': `${metrics.firstContentfulPaint.toFixed(2)}ms`
      });

      // Analyze largest chunks
      const largestChunks = sizes.jsChunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);
      
      console.log('🎯 Largest JS Chunks:', largestChunks.map(chunk => ({
        name: chunk.name,
        size: `${(chunk.size / 1024).toFixed(2)} KB`,
        loadTime: `${chunk.loadTime.toFixed(2)}ms`
      })));

      // Performance recommendations
      const recommendations = [];
      if (sizes.javascript > 1500 * 1024) {
        recommendations.push('Consider further code splitting - JS bundle is over 1.5MB');
      }
      if (metrics.firstContentfulPaint > 3000) {
        recommendations.push('First Contentful Paint is slow - consider critical CSS inlining');
      }
      if (largestChunks[0]?.size > 500 * 1024) {
        recommendations.push(`Largest chunk (${largestChunks[0].name}) is over 500KB - consider splitting`);
      }

      if (recommendations.length > 0) {
        console.log('💡 Optimization Recommendations:', recommendations);
      } else {
        console.log('✅ Bundle size and performance look good!');
      }
    }, 2000);
  });
};

const lazyLoadingModule = {
  createLazyComponent,
  usePreloader,
  withIntersectionLazyLoad,
  createRetryableImport,
  useIdlePreloader,
  analyzeBundleSize,
};

export default lazyLoadingModule;