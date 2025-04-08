import React from 'react';

/**
 * ButtonLoader component
 * A button with integrated loading state
 */
const ButtonLoader = ({ 
  children, 
  isLoading = false, 
  disabled = false, 
  onClick, 
  type = 'button', 
  variant = 'primary',
  size = 'medium',
  className = '',
  loadingText = 'Processing...'
}) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info',
    outline: 'btn-outline'
  };

  const sizeClasses = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large'
  };

  const variantClass = variantClasses[variant] || 'btn-primary';
  const sizeClass = sizeClasses[size] || 'btn-medium';

  return (
    <button
      type={type}
      className={`button-loader ${variantClass} ${sizeClass} ${isLoading ? 'is-loading' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="spinner"></span>
          <span className="loading-text">{loadingText}</span>
        </>
      ) : (
        children
      )}
      
      <style jsx>{`
        .button-loader {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        
        .button-loader:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #4b5563;
        }
        
        .btn-success {
          background-color: #10b981;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background-color: #059669;
        }
        
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
        }
        
        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }
        
        .btn-warning:hover:not(:disabled) {
          background-color: #d97706;
        }
        
        .btn-info {
          background-color: #3b82f6;
          color: white;
        }
        
        .btn-info:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .btn-outline {
          background-color: transparent;
          color: #3b82f6;
          border-color: #3b82f6;
        }
        
        .btn-outline:hover:not(:disabled) {
          background-color: #3b82f6;
          color: white;
        }
        
        .btn-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }
        
        .btn-medium {
          padding: 0.5rem 1rem;
          font-size: 1rem;
        }
        
        .btn-large {
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        }
        
        .is-loading {
          color: transparent !important;
        }
        
        .spinner {
          position: absolute;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }
        
        .loading-text {
          position: absolute;
          color: white;
          font-size: 0.875rem;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
};

export default ButtonLoader;
