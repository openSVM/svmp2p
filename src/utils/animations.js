/**
 * Animation utilities for enhancing UI interactions
 */

import { useRef, useEffect } from 'react';

/**
 * Hook to add a click ripple effect to elements
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} The ref to attach to the target element and event handlers
 */
export const useRippleEffect = (options = {}) => {
  const {
    color = 'rgba(255, 255, 255, 0.3)',
    duration = 600,
    centered = false,
  } = options;
  
  const elementRef = useRef(null);
  
  const createRipple = (event) => {
    const element = elementRef.current;
    if (!element) return;
    
    // Remove existing ripples
    const existingRipples = element.querySelectorAll('.ripple-effect');
    existingRipples.forEach(ripple => ripple.remove());
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    element.appendChild(ripple);
    
    // Calculate ripple size (should be at least as large as the element's diagonal)
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    // Position the ripple
    if (centered) {
      ripple.style.width = ripple.style.height = `${size * 2}px`;
      ripple.style.left = '50%';
      ripple.style.top = '50%';
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    } else {
      ripple.style.width = ripple.style.height = `${size * 2}px`;
      ripple.style.left = `${event.clientX - rect.left - size}px`;
      ripple.style.top = `${event.clientY - rect.top - size}px`;
    }
    
    // Apply color and animation
    ripple.style.backgroundColor = color;
    ripple.style.animation = `rippleAnimation ${duration}ms ease-out forwards`;
    
    // Remove after animation completes
    setTimeout(() => {
      if (ripple.parentNode === element) {
        element.removeChild(ripple);
      }
    }, duration);
  };
  
  // Setup and cleanup
  useEffect(() => {
    // Add ripple styles only once to the document if they don't exist yet
    if (!document.querySelector('#ripple-style')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'ripple-style';
      styleElement.textContent = `
        @keyframes rippleAnimation {
          to {
            transform: ${centered ? 'translate(-50%, -50%) scale(1)' : 'scale(1)'};
            opacity: 0;
          }
        }
        
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          transform: ${centered ? 'translate(-50%, -50%) scale(0)' : 'scale(0)'};
          opacity: 0.6;
          pointer-events: none;
        }
        
        [data-ripple] {
          position: relative;
          overflow: hidden;
          user-select: none;
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    const element = elementRef.current;
    if (element) {
      element.setAttribute('data-ripple', '');
      element.addEventListener('click', createRipple);
    }
    
    return () => {
      if (element) {
        element.removeEventListener('click', createRipple);
      }
    };
  }, [centered, color, duration]);
  
  return { ref: elementRef };
};

/**
 * Hook to add a hover lift effect to elements
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} The ref to attach to the target element and CSS classes
 */
export const useHoverLift = (options = {}) => {
  const {
    scale = 1.03,
    translateY = -5,
    duration = 300,
    easing = 'cubic-bezier(0.2, 0, 0.3, 1)'
  } = options;
  
  const elementRef = useRef(null);
  
  useEffect(() => {
    // Add lift styles only once to the document if they don't exist yet
    if (!document.querySelector('#hover-lift-style')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'hover-lift-style';
      styleElement.textContent = `
        .hover-lift {
          transition: transform ${duration}ms ${easing};
        }
        .hover-lift:hover {
          transform: translateY(${translateY}px) scale(${scale});
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    const element = elementRef.current;
    if (element) {
      element.classList.add('hover-lift');
    }
    
    return () => {
      if (element) {
        element.classList.remove('hover-lift');
      }
    };
  }, [scale, translateY, duration, easing]);
  
  return { ref: elementRef };
};

/**
 * Hook to add a press/active state animation
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} The ref to attach to the target element and event handlers
 */
export const usePressEffect = (options = {}) => {
  const {
    scale = 0.97,
    duration = 150,
  } = options;
  
  const elementRef = useRef(null);
  
  useEffect(() => {
    // Add press styles only once to the document if they don't exist yet
    if (!document.querySelector('#press-effect-style')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'press-effect-style';
      styleElement.textContent = `
        .press-effect {
          transition: transform ${duration}ms ease;
        }
        .press-effect.pressed {
          transform: scale(${scale});
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    const element = elementRef.current;
    if (!element) return;
    
    element.classList.add('press-effect');
    
    const handleMouseDown = () => element.classList.add('pressed');
    const handleMouseUp = () => element.classList.remove('pressed');
    const handleMouseLeave = () => element.classList.remove('pressed');
    const handleTouchStart = () => element.classList.add('pressed');
    const handleTouchEnd = () => element.classList.remove('pressed');
    
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      if (element) {
        element.classList.remove('press-effect');
        element.classList.remove('pressed');
        
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [scale, duration]);
  
  return { ref: elementRef };
};

/**
 * Hook to create staggered animation for lists of items
 *
 * @param {Object} options - Configuration options
 * @returns {Function} Function to get props for each child element
 */
export const useStaggeredAnimation = (options = {}) => {
  const {
    baseDelay = 50,
    animation = 'fadeInUp',
    duration = 500,
    once = true,
  } = options;
  
  return (index = 0) => ({
    className: `animate-${animation}`,
    style: {
      animationDelay: `${baseDelay * index}ms`,
      animationDuration: `${duration}ms`,
      opacity: 0, // Start invisible
      animationFillMode: 'forwards',
    },
    'data-animate-once': once ? 'true' : 'false',
  });
};

/**
 * Adds a subtle parallax effect to an element based on mouse movement
 * @param {Object} options - Configuration options
 * @returns {Object} The ref to attach to the target element
 */
export const useParallaxEffect = (options = {}) => {
  const {
    strength = 15,
    perspective = 1000,
    disabled = false,
  } = options;
  
  const elementRef = useRef(null);
  
  useEffect(() => {
    if (disabled) return;
    
    const element = elementRef.current;
    if (!element) return;
    
    let bounds;
    
    const handleMouseMove = (e) => {
      if (!bounds) bounds = element.getBoundingClientRect();
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      
      const percentX = (mouseX - centerX) / (bounds.width / 2);
      const percentY = (mouseY - centerY) / (bounds.height / 2);
      
      const rotateX = -percentY * strength;
      const rotateY = percentX * strength;
      
      element.style.transform = `
        perspective(${perspective}px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
      `;
    };
    
    const resetTransform = () => {
      bounds = null;
      element.style.transform = '';
      element.style.transition = 'transform 0.5s ease-out';
      
      // Remove the transition style after it completes
      setTimeout(() => {
        if (element) {
          element.style.transition = '';
        }
      }, 500);
    };
    
    const updateBounds = () => {
      if (element) {
        bounds = element.getBoundingClientRect();
      }
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', resetTransform);
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);
    
    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', resetTransform);
      }
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [strength, perspective, disabled]);
  
  return { ref: elementRef };
};