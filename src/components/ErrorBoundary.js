import React from 'react';

/**
 * Error boundary component to catch and handle React rendering errors
 * Enhanced with better fallback UI and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error in a controlled fashion to avoid sensitive data exposure
    console.error("Error caught by ErrorBoundary:", error.message || "Unknown error");
    
    this.setState(prevState => ({ 
      errorInfo,
      // Track number of errors to prevent infinite error loops
      errorCount: prevState.errorCount + 1
    }));
    
    // Report error to analytics or monitoring service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'javascript_error', {
        error_message: error.message,
        error_type: error.name,
        error_stack: error.stack ? error.stack.slice(0, 500) : 'Not available'
      });
    }
  }

  handleRefresh = () => {
    // Reset error state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null
    });
    
    // If refreshing the component doesn't work, offer page refresh
    if (this.state.errorCount > 2) {
      window.location.reload();
    }
  }

  getErrorMessage = () => {
    const { error } = this.state;
    if (!error) return 'An unexpected error occurred';
    
    // Map common wallet-related errors to user-friendly messages
    if (error.message && error.message.includes('publicKey')) {
      return 'There was an issue with your wallet connection. Please disconnect and reconnect your wallet.';
    }
    
    if (error.message && error.message.includes('WalletContext')) {
      return 'Wallet connection error. Please refresh the page and try connecting your wallet again.';
    }
    
    if (error.message && error.message.includes('ethereum')) {
      return 'Multiple wallet extensions detected. Please disable unused wallet extensions and refresh the page.';
    }
    
    if (error.message && error.message.includes('Cannot set property ethereum')) {
      return 'Wallet extension conflict detected. Please disable conflicting extensions.';
    }
    
    return error.message || 'An unexpected error occurred';
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>{this.getErrorMessage()}</p>
          
          <div className="error-boundary-actions">
            <button
              className="error-boundary-reset-button"
              onClick={this.handleRefresh}
            >
              {this.state.errorCount > 2 ? 'Refresh Page' : 'Try Again'}
            </button>
            
            <button 
              className="error-boundary-home-button"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Return to Home
            </button>
          </div>
          
          {/* Only show technical details if enabled - hidden by default */}
          {this.props.showDetails && (
            <details className="error-technical-details">
              <summary>Technical details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p>Component Stack:</p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;