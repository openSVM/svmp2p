/**
 * Enhanced Error Boundary Component
 * 
 * Provides comprehensive error handling for React components
 * with special handling for external script conflicts
 */

import React from 'react';
import { classifyError, shouldSuppressError, logError, ERROR_CATEGORIES } from '../utils/errorHandling';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    const category = classifyError(error);
    
    // Don't show error boundary for external errors
    if (shouldSuppressError(error)) {
      return null;
    }
    
    return {
      hasError: true,
      error,
      errorCategory: category
    };
  }

  componentDidCatch(error, errorInfo) {
    const category = classifyError(error);
    
    // Log error with appropriate level based on category
    if (category === ERROR_CATEGORIES.APPLICATION) {
      logError(error, 'ErrorBoundary caught application error');
      this.setState({
        error,
        errorInfo,
        errorCategory: category
      });
    } else {
      // External errors - just log for debugging
      logError(error, 'ErrorBoundary caught external error', 'debug');
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: null,
      retryCount: this.state.retryCount + 1
    });
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      const { error, errorCategory, retryCount } = this.state;
      const { fallback: FallbackComponent } = this.props;
      
      // If a custom fallback is provided, use it
      if (FallbackComponent) {
        return React.isValidElement(FallbackComponent) ? 
          FallbackComponent : 
          <FallbackComponent 
            error={error} 
            errorCategory={errorCategory}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            retryCount={retryCount}
          />;
      }

      // Default error UI based on error category
      return (
        <div className="error-boundary min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Application Error
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {errorCategory === ERROR_CATEGORIES.NETWORK_CONNECTION ? 
                    'Connection error occurred' :
                    'Something went wrong'
                  }
                </p>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <div className="font-mono text-red-600 dark:text-red-400">
                  {error?.message || 'Unknown error'}
                </div>
                {error?.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-300">
                      Stack trace
                    </summary>
                    <pre className="mt-1 text-gray-500 dark:text-gray-400 overflow-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex space-x-3">
              {retryCount < 3 && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try Again {retryCount > 0 && `(${retryCount + 1})`}
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
            
            {errorCategory === ERROR_CATEGORIES.NETWORK_CONNECTION && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This appears to be a network connectivity issue. Please check your internet connection and try again.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;