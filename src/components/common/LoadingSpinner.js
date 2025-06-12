import React from 'react';

/**
 * LoadingSpinner component
 * A reusable loading spinner with customizable size and color
 */
const LoadingSpinner = ({ size = 'medium', color = 'primary', text = 'Loading...' }) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size] || 'spinner-medium';

  const colorClass = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    success: 'spinner-success',
    danger: 'spinner-danger',
    warning: 'spinner-warning',
    info: 'spinner-info'
  }[color] || 'spinner-primary';

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${sizeClass} ${colorClass}`}>
        <div className="spinner-circle"></div>
      </div>
      {text && <p className="spinner-text">{text}</p>}
      
      <style jsx>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .loading-spinner {
          position: relative;
          display: inline-block;
        }
        
        .spinner-circle {
          border-radius: 0;
          border: 3px solid var(--ascii-neutral-300);
          border-top-color: currentColor;
          animation: spin 0.8s linear infinite;
        }
        
        .spinner-small .spinner-circle {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }
        
        .spinner-medium .spinner-circle {
          width: 24px;
          height: 24px;
          border-width: 3px;
        }
        
        .spinner-large .spinner-circle {
          width: 40px;
          height: 40px;
          border-width: 4px;
        }
        
        .spinner-primary {
          color: var(--ascii-neutral-700);
        }
        
        .spinner-secondary {
          color: var(--ascii-neutral-600);
        }
        
        .spinner-success {
          color: var(--ascii-neutral-800);
        }
        
        .spinner-danger {
          color: var(--ascii-neutral-900);
        }
        
        .spinner-warning {
          color: var(--ascii-neutral-600);
        }
        
        .spinner-info {
          color: var(--ascii-neutral-700);
        }
        
        .spinner-text {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--ascii-neutral-600);
          font-family: 'Courier New', Courier, monospace;
          text-transform: uppercase;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
