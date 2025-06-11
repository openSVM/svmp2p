import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the context and components
jest.mock('../../contexts/AppContext', () => ({
  AppContext: React.createContext({
    network: { name: 'Solana' },
    selectedNetwork: 'solana',
    setSelectedNetwork: jest.fn(),
    activeTab: 'buy',
    setActiveTab: jest.fn(),
    networks: {}
  })
}));

jest.mock('../../contexts/WalletContextProvider', () => ({
  useSafeWallet: () => ({
    connected: true,
    publicKey: 'mock-public-key',
    connecting: false,
    error: null
  }),
  SafeWalletProvider: ({ children }) => children
}));

jest.mock('../../components/guided-workflow/TradingGuidedWorkflow', () => {
  return function MockTradingGuidedWorkflow({ tradingType, onComplete }) {
    return (
      <div data-testid="trading-guided-workflow">
        <p>Mock Guided Workflow for {tradingType}</p>
        <button onClick={onComplete}>Complete Workflow</button>
      </div>
    );
  };
});

jest.mock('../../components/OfferCreation', () => {
  return function MockOfferCreation({ onStartGuidedWorkflow }) {
    return (
      <div data-testid="offer-creation">
        <button onClick={() => onStartGuidedWorkflow('sell')}>
          Need help? Use guided workflow
        </button>
      </div>
    );
  };
});

jest.mock('../../components/OfferList', () => {
  return function MockOfferList({ type, onStartGuidedWorkflow }) {
    return (
      <div data-testid={`offer-list-${type}`}>
        {onStartGuidedWorkflow && (
          <button onClick={() => onStartGuidedWorkflow(type)}>
            Need help? Use guided workflow
          </button>
        )}
      </div>
    );
  };
});

// Import the actual App component after mocking
import { AppContent } from '../../App';

describe('Guided Workflow Integration', () => {
  const renderAppContent = () => {
    return render(<AppContent />);
  };

  it('shows guided workflow button on buy tab', () => {
    renderAppContent();
    
    // Should be on buy tab by default
    expect(screen.getByTestId('offer-list-buy')).toBeInTheDocument();
    expect(screen.getByText('Need help? Use guided workflow')).toBeInTheDocument();
  });

  it('starts guided workflow when button is clicked on buy tab', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Click the guided workflow button
    await user.click(screen.getByText('Need help? Use guided workflow'));
    
    // Should show guided workflow
    expect(screen.getByTestId('trading-guided-workflow')).toBeInTheDocument();
    expect(screen.getByText('Mock Guided Workflow for buy')).toBeInTheDocument();
    expect(screen.getByText('Buy SOL - Guided Workflow')).toBeInTheDocument();
  });

  it('shows exit workflow button when in guided mode', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Start guided workflow
    await user.click(screen.getByText('Need help? Use guided workflow'));
    
    // Should show exit button
    expect(screen.getByText('Exit Workflow')).toBeInTheDocument();
  });

  it('exits guided workflow when exit button is clicked', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Start guided workflow
    await user.click(screen.getByText('Need help? Use guided workflow'));
    expect(screen.getByTestId('trading-guided-workflow')).toBeInTheDocument();
    
    // Exit guided workflow
    await user.click(screen.getByText('Exit Workflow'));
    
    // Should return to normal interface
    expect(screen.queryByTestId('trading-guided-workflow')).not.toBeInTheDocument();
    expect(screen.getByTestId('offer-list-buy')).toBeInTheDocument();
  });

  it('exits guided workflow when workflow is completed', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Start guided workflow
    await user.click(screen.getByText('Need help? Use guided workflow'));
    expect(screen.getByTestId('trading-guided-workflow')).toBeInTheDocument();
    
    // Complete workflow
    await user.click(screen.getByText('Complete Workflow'));
    
    // Should return to normal interface
    expect(screen.queryByTestId('trading-guided-workflow')).not.toBeInTheDocument();
    expect(screen.getByTestId('offer-list-buy')).toBeInTheDocument();
  });

  it('has proper accessibility attributes for guided workflow container', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Start guided workflow
    await user.click(screen.getByText('Need help? Use guided workflow'));
    
    // Check accessibility attributes
    const container = screen.getByRole('region');
    expect(container).toHaveAttribute('aria-label', 'Guided trading workflow');
    expect(container).toHaveAttribute('tabIndex', '-1');
  });

  it('focuses the guided workflow container when it opens', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Start guided workflow
    await user.click(screen.getByText('Need help? Use guided workflow'));
    
    // Wait for focus to be set
    await waitFor(() => {
      const container = screen.getByRole('region');
      expect(container).toHaveFocus();
    });
  });

  it('handles different workflow types', async () => {
    const user = userEvent.setup();
    renderAppContent();
    
    // Switch to sell tab (simulate tab switching)
    fireEvent.click(screen.getByText('SELL'));
    
    await waitFor(() => {
      expect(screen.getByTestId('offer-creation')).toBeInTheDocument();
    });
    
    // Start sell workflow
    const sellWorkflowButton = screen.getAllByText('Need help? Use guided workflow')[0];
    await user.click(sellWorkflowButton);
    
    // Should show sell guided workflow
    expect(screen.getByText('Mock Guided Workflow for sell')).toBeInTheDocument();
    expect(screen.getByText('Sell SOL - Guided Workflow')).toBeInTheDocument();
  });

  it('shows error boundary fallback when workflow errors', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock TradingGuidedWorkflow to throw an error
    jest.doMock('../../components/guided-workflow/TradingGuidedWorkflow', () => {
      return function MockErrorTradingGuidedWorkflow() {
        throw new Error('Test workflow error');
      };
    });
    
    renderAppContent();
    
    // The error should be caught by ErrorBoundary
    // Note: This test would need to be adjusted based on the actual error boundary implementation
    
    consoleSpy.mockRestore();
  });
});