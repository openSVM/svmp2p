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
    primary: 'button-primary',
    secondary: 'button-secondary',
    success: 'button-success',
    danger: 'button-danger',
    warning: 'button-warning',
    info: 'button-info',
    outline: 'button-outline',
    accent: 'button-accent',
    ghost: 'button-ghost'
  };

  const sizeClasses = {
    small: 'button-sm',
    medium: '',
    large: 'button-lg',
    xl: 'button-xl'
  };

  const variantClass = variantClasses[variant] || 'button-primary';
  const sizeClass = sizeClasses[size] || '';
  const loadingClass = isLoading ? 'button-loading' : '';

  return (
    <button
      type={type}
      className={`button ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="sr-only">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default ButtonLoader;
