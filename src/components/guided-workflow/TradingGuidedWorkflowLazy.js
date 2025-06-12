/**
 * Lazy loading wrapper for TradingGuidedWorkflow
 * 
 * This component implements lazy loading to reduce the initial bundle size
 * by only loading the guided workflow components when they are actually needed.
 */

import React, { lazy, Suspense } from 'react';

// Lazy load the main guided workflow component
const TradingGuidedWorkflowLazy = lazy(() => 
  import('./TradingGuidedWorkflow').then(module => ({
    default: module.default
  }))
);

// Lazy load individual workflow step components
const TradingWorkflowIntroLazy = lazy(() => import('./TradingWorkflowIntro'));
const BuyWorkflowSelectOfferLazy = lazy(() => import('./BuyWorkflowSelectOffer'));
const BuyWorkflowReviewOfferLazy = lazy(() => import('./BuyWorkflowReviewOffer'));
const BuyWorkflowPaymentLazy = lazy(() => import('./BuyWorkflowPayment'));
const BuyWorkflowCompleteLazy = lazy(() => import('./BuyWorkflowComplete'));
const SellWorkflowCreateOfferLazy = lazy(() => import('./SellWorkflowCreateOffer'));
const SellWorkflowReviewEscrowLazy = lazy(() => import('./SellWorkflowReviewEscrow'));
const SellWorkflowCompleteLazy = lazy(() => import('./SellWorkflowComplete'));

// Loading fallback component
const WorkflowLoadingFallback = ({ message = "Loading guided workflow..." }) => (
  <div className="guided-workflow-loading">
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-message">{message}</p>
    </div>
  </div>
);

// Error boundary for lazy loading failures
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="guided-workflow-error">
          <div className="error-container">
            <h3>Unable to load guided workflow</h3>
            <p>Please refresh the page and try again.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy-loaded Trading Guided Workflow component
 * 
 * @param {Object} props - Component props
 * @param {string} props.tradingType - Type of trading ('buy' or 'sell')
 * @param {Function} props.onComplete - Callback when workflow is complete
 * @param {boolean} props.preload - Whether to preload the component
 * @returns {JSX.Element} Lazy-loaded guided workflow
 */
export const TradingGuidedWorkflowLazy = ({ tradingType, onComplete, preload = false, ...props }) => {
  // Preload the component if requested
  React.useEffect(() => {
    if (preload) {
      import('./TradingGuidedWorkflow').catch(error => {
        console.warn('Failed to preload guided workflow:', error);
      });
    }
  }, [preload]);

  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={<WorkflowLoadingFallback message="Loading trading workflow..." />}>
        <TradingGuidedWorkflowLazy 
          tradingType={tradingType}
          onComplete={onComplete}
          {...props}
        />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

/**
 * Lazy-loaded individual workflow step components
 * These can be used independently if needed
 */

export const TradingWorkflowIntro = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading introduction..." />}>
      <TradingWorkflowIntroLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const BuyWorkflowSelectOffer = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading offer selection..." />}>
      <BuyWorkflowSelectOfferLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const BuyWorkflowReviewOffer = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading offer review..." />}>
      <BuyWorkflowReviewOfferLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const BuyWorkflowPayment = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading payment interface..." />}>
      <BuyWorkflowPaymentLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const BuyWorkflowComplete = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading completion screen..." />}>
      <BuyWorkflowCompleteLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const SellWorkflowCreateOffer = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading offer creation..." />}>
      <SellWorkflowCreateOfferLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const SellWorkflowReviewEscrow = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading escrow review..." />}>
      <SellWorkflowReviewEscrowLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

export const SellWorkflowComplete = ({ ...props }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<WorkflowLoadingFallback message="Loading completion screen..." />}>
      <SellWorkflowCompleteLazy {...props} />
    </Suspense>
  </LazyLoadErrorBoundary>
);

/**
 * Hook for preloading guided workflow components
 * 
 * @param {Array} components - Array of component names to preload
 * @returns {Object} Preloading status and functions
 */
export const useWorkflowPreloader = (components = []) => {
  const [preloadStatus, setPreloadStatus] = React.useState({});
  
  const preloadComponent = React.useCallback(async (componentName) => {
    setPreloadStatus(prev => ({ ...prev, [componentName]: 'loading' }));
    
    try {
      switch (componentName) {
        case 'TradingGuidedWorkflow':
          await import('./TradingGuidedWorkflow');
          break;
        case 'TradingWorkflowIntro':
          await import('./TradingWorkflowIntro');
          break;
        case 'BuyWorkflowSelectOffer':
          await import('./BuyWorkflowSelectOffer');
          break;
        case 'BuyWorkflowReviewOffer':
          await import('./BuyWorkflowReviewOffer');
          break;
        case 'BuyWorkflowPayment':
          await import('./BuyWorkflowPayment');
          break;
        case 'BuyWorkflowComplete':
          await import('./BuyWorkflowComplete');
          break;
        case 'SellWorkflowCreateOffer':
          await import('./SellWorkflowCreateOffer');
          break;
        case 'SellWorkflowReviewEscrow':
          await import('./SellWorkflowReviewEscrow');
          break;
        case 'SellWorkflowComplete':
          await import('./SellWorkflowComplete');
          break;
        default:
          throw new Error(`Unknown component: ${componentName}`);
      }
      
      setPreloadStatus(prev => ({ ...prev, [componentName]: 'loaded' }));
    } catch (error) {
      console.error(`Failed to preload ${componentName}:`, error);
      setPreloadStatus(prev => ({ ...prev, [componentName]: 'error' }));
    }
  }, []);
  
  const preloadAll = React.useCallback(async () => {
    const promises = components.map(component => preloadComponent(component));
    await Promise.allSettled(promises);
  }, [components, preloadComponent]);
  
  // Auto-preload specified components on mount
  React.useEffect(() => {
    if (components.length > 0) {
      preloadAll();
    }
  }, [components, preloadAll]);
  
  return {
    preloadStatus,
    preloadComponent,
    preloadAll,
    isComponentLoaded: (componentName) => preloadStatus[componentName] === 'loaded',
    isComponentLoading: (componentName) => preloadStatus[componentName] === 'loading',
    hasComponentError: (componentName) => preloadStatus[componentName] === 'error'
  };
};

/**
 * Default export for the main lazy-loaded workflow
 */
export default TradingGuidedWorkflowLazy;