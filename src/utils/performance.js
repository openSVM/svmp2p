// Performance optimization utilities
import React, { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for debouncing values
 * Prevents excessive re-renders when values change rapidly
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

/**
 * Custom hook for detecting when an element is in viewport
 * Useful for lazy loading images and other content
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(ref.current);
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);
  
  return [ref, isIntersecting];
};

/**
 * Custom hook for window resize events with throttling
 * Prevents excessive re-renders during window resizing
 */
export const useWindowSize = (throttleMs = 100) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    let throttleTimeout = null;
    
    const handleResize = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
        throttleTimeout = null;
      }, throttleMs);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [throttleMs]);
  
  return windowSize;
};

/**
 * HOC for lazy loading images
 * Only loads images when they are about to enter the viewport
 */
export const LazyImage = ({ src, alt, placeholder, threshold = 0.1, ...props }) => {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold,
    rootMargin: '100px'
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div ref={ref} className="lazy-image-container" {...props}>
      {(isIntersecting || isLoaded) ? (
        <img 
          src={src} 
          alt={alt} 
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="lazy-image-placeholder">
          {placeholder || <div className="placeholder-shimmer"></div>}
        </div>
      )}
    </div>
  );
};

/**
 * HOC for memoizing components with custom comparison
 * Prevents unnecessary re-renders by comparing specific props
 */
export const withMemoization = (Component, propsAreEqual) => {
  return React.memo(Component, propsAreEqual);
};

/**
 * Utility for chunking array data for virtualized lists
 * Improves performance when rendering large lists
 */
export const chunkArray = (array, size) => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
};

/**
 * Simple virtualized list component
 * Only renders items that are visible in the viewport
 */
export const VirtualizedList = ({ 
  items, 
  renderItem, 
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
};
