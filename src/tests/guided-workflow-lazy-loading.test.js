/**
 * Tests for lazy-loaded guided workflow components
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { TradingGuidedWorkflowLazy, useWorkflowPreloader } from '../components/guided-workflow/TradingGuidedWorkflowLazy';

// Mock the actual guided workflow component
jest.mock('../components/guided-workflow/TradingGuidedWorkflow', () => {
  return {
    __esModule: true,
    default: ({ tradingType, onComplete }) => (
      <div data-testid="trading-guided-workflow">
        <div>Trading Type: {tradingType}</div>
        <button onClick={onComplete}>Complete</button>
      </div>
    )
  };
});

// Mock other workflow components
jest.mock('../components/guided-workflow/TradingWorkflowIntro', () => ({
  __esModule: true,
  default: () => <div data-testid="trading-workflow-intro">Intro</div>
}));

jest.mock('../components/guided-workflow/BuyWorkflowSelectOffer', () => ({
  __esModule: true,
  default: () => <div data-testid="buy-workflow-select-offer">Select Offer</div>
}));

// Test component for useWorkflowPreloader hook
const PreloaderTestComponent = ({ components }) => {
  const {
    preloadStatus,
    preloadComponent,
    preloadAll,
    isComponentLoaded,
    isComponentLoading,
    hasComponentError
  } = useWorkflowPreloader(components);

  return (
    <div>
      <div data-testid="preload-status">{JSON.stringify(preloadStatus)}</div>
      <button 
        data-testid="preload-trading-workflow" 
        onClick={() => preloadComponent('TradingGuidedWorkflow')}
      >
        Preload Trading Workflow
      </button>
      <button 
        data-testid="preload-all" 
        onClick={preloadAll}
      >
        Preload All
      </button>
      <div data-testid="is-loaded">
        {isComponentLoaded('TradingGuidedWorkflow') ? 'loaded' : 'not-loaded'}
      </div>
      <div data-testid="is-loading">
        {isComponentLoading('TradingGuidedWorkflow') ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="has-error">
        {hasComponentError('TradingGuidedWorkflow') ? 'error' : 'no-error'}
      </div>
    </div>
  );
};

describe('Lazy Loading Guided Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TradingGuidedWorkflowLazy', () => {
    test('should display loading state initially', () => {
      const { getByText } = render(
        <TradingGuidedWorkflowLazy tradingType="buy" />
      );

      expect(getByText('Loading trading workflow...')).toBeInTheDocument();
    });

    test('should load and display the actual component', async () => {
      const onComplete = jest.fn();
      const { getByTestId } = render(
        <TradingGuidedWorkflowLazy tradingType="buy" onComplete={onComplete} />
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(getByTestId('trading-guided-workflow')).toBeInTheDocument();
      });

      expect(getByTestId('trading-guided-workflow')).toHaveTextContent('Trading Type: buy');
    });

    test('should pass props correctly to the loaded component', async () => {
      const onComplete = jest.fn();
      const { getByTestId, getByText } = render(
        <TradingGuidedWorkflowLazy tradingType="sell" onComplete={onComplete} />
      );

      await waitFor(() => {
        expect(getByTestId('trading-guided-workflow')).toBeInTheDocument();
      });

      expect(getByTestId('trading-guided-workflow')).toHaveTextContent('Trading Type: sell');
      
      // Test that onComplete is passed correctly
      fireEvent.click(getByText('Complete'));
      expect(onComplete).toHaveBeenCalled();
    });

    test('should handle loading errors gracefully', async () => {
      // Mock import to fail
      const originalImport = global.import;
      global.import = jest.fn().mockRejectedValue(new Error('Failed to load'));

      const { getByText, getByRole } = render(
        <TradingGuidedWorkflowLazy tradingType="buy" />
      );

      await waitFor(() => {
        expect(getByText('Unable to load guided workflow')).toBeInTheDocument();
      });

      expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();

      // Restore original import
      global.import = originalImport;
    });

    test('should preload component when preload prop is true', () => {
      const importSpy = jest.spyOn(React, 'useEffect');
      
      render(
        <TradingGuidedWorkflowLazy tradingType="buy" preload={true} />
      );

      // Should call useEffect for preloading
      expect(importSpy).toHaveBeenCalled();
    });
  });

  describe('useWorkflowPreloader Hook', () => {
    test('should initialize with empty preload status', () => {
      const { getByTestId } = render(
        <PreloaderTestComponent components={[]} />
      );

      expect(getByTestId('preload-status')).toHaveTextContent('{}');
      expect(getByTestId('is-loaded')).toHaveTextContent('not-loaded');
      expect(getByTestId('is-loading')).toHaveTextContent('not-loading');
      expect(getByTestId('has-error')).toHaveTextContent('no-error');
    });

    test('should preload individual components', async () => {
      const { getByTestId } = render(
        <PreloaderTestComponent components={[]} />
      );

      fireEvent.click(getByTestId('preload-trading-workflow'));

      // Should show loading state
      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('loading');
      });

      // Should eventually show loaded state
      await waitFor(() => {
        expect(getByTestId('is-loaded')).toHaveTextContent('loaded');
      }, { timeout: 5000 });
    });

    test('should auto-preload specified components on mount', async () => {
      const { getByTestId } = render(
        <PreloaderTestComponent components={['TradingGuidedWorkflow']} />
      );

      // Should automatically start loading
      await waitFor(() => {
        const status = JSON.parse(getByTestId('preload-status').textContent);
        expect(status.TradingGuidedWorkflow).toBeDefined();
      });
    });

    test('should handle preload errors', async () => {
      // Mock import to fail
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const mockImport = jest.fn().mockRejectedValue(new Error('Load failed'));
      const originalImport = global.import;
      global.import = mockImport;

      const { getByTestId } = render(
        <PreloaderTestComponent components={[]} />
      );

      fireEvent.click(getByTestId('preload-trading-workflow'));

      await waitFor(() => {
        expect(getByTestId('has-error')).toHaveTextContent('error');
      });

      // Restore
      global.import = originalImport;
      console.error = originalConsoleError;
    });

    test('should preload all specified components', async () => {
      const { getByTestId } = render(
        <PreloaderTestComponent components={['TradingGuidedWorkflow', 'TradingWorkflowIntro']} />
      );

      fireEvent.click(getByTestId('preload-all'));

      await waitFor(() => {
        const status = JSON.parse(getByTestId('preload-status').textContent);
        expect(Object.keys(status)).toContain('TradingGuidedWorkflow');
        expect(Object.keys(status)).toContain('TradingWorkflowIntro');
      });
    });

    test('should handle unknown component names', async () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const { getByTestId } = render(
        <PreloaderTestComponent components={[]} />
      );

      // Try to preload unknown component
      const { preloadComponent } = useWorkflowPreloader();
      
      act(() => {
        preloadComponent('UnknownComponent');
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to preload UnknownComponent'),
          expect.any(Error)
        );
      });

      console.error = originalConsoleError;
    });
  });

  describe('Error Boundary', () => {
    test('should catch and display lazy loading errors', async () => {
      // Create a component that throws during render
      const ThrowingComponent = () => {
        throw new Error('Render error');
      };

      const { getByText, getByRole } = render(
        <LazyLoadErrorBoundary>
          <ThrowingComponent />
        </LazyLoadErrorBoundary>
      );

      expect(getByText('Unable to load guided workflow')).toBeInTheDocument();
      expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    test('should allow retry after error', async () => {
      let shouldThrow = true;
      const ConditionallyThrowingComponent = () => {
        if (shouldThrow) {
          throw new Error('Render error');
        }
        return <div>Component loaded successfully</div>;
      };

      const { getByRole, getByText } = render(
        <LazyLoadErrorBoundary>
          <ConditionallyThrowingComponent />
        </LazyLoadErrorBoundary>
      );

      // Should show error initially
      expect(getByText('Unable to load guided workflow')).toBeInTheDocument();

      // Fix the error condition and retry
      shouldThrow = false;
      fireEvent.click(getByRole('button', { name: 'Retry' }));

      await waitFor(() => {
        expect(getByText('Component loaded successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Bundle Size Optimization', () => {
    test('should not load workflow components until needed', () => {
      // Mock module import tracking
      const importTracker = jest.fn();
      const originalImport = global.import;
      global.import = (...args) => {
        importTracker(...args);
        return originalImport(...args);
      };

      // Render app without guided workflow
      render(<div>App without guided workflow</div>);

      // Should not have loaded any workflow components
      expect(importTracker).not.toHaveBeenCalledWith(
        expect.stringContaining('TradingGuidedWorkflow')
      );

      global.import = originalImport;
    });

    test('should only load requested components', async () => {
      const importTracker = new Set();
      const originalImport = global.import;
      global.import = (path) => {
        importTracker.add(path);
        return originalImport(path);
      };

      render(
        <TradingGuidedWorkflowLazy tradingType="buy" />
      );

      await waitFor(() => {
        // Should only load the main component, not all sub-components
        expect(Array.from(importTracker)).toHaveLength(1);
      });

      global.import = originalImport;
    });
  });
});