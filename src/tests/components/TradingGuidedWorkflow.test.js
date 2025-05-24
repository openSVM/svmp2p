import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { TradingGuidedWorkflow } from '../../components/guided-workflow/TradingGuidedWorkflow';

// Mock components
jest.mock('../../components/guided-workflow/GuidedWorkflow', () => ({
  __esModule: true,
  default: ({ children, currentStep, onNext, onPrevious, onComplete }) => (
    <div data-testid="guided-workflow">
      <div data-testid="current-step">{currentStep}</div>
      <div>{children}</div>
      <button onClick={() => onPrevious()}>Previous</button>
      <button onClick={() => onNext()}>Next</button>
      <button onClick={() => onComplete()}>Complete</button>
    </div>
  )
}));

jest.mock('../../components/guided-workflow/TradingWorkflowIntro', () => ({
  __esModule: true,
  default: () => <div data-testid="trading-workflow-intro">Trading Workflow Intro</div>
}));

jest.mock('../../components/guided-workflow/BuyWorkflowSelectOffer', () => ({
  __esModule: true,
  default: () => <div data-testid="buy-workflow-select-offer">Select Offer</div>
}));

jest.mock('../../components/guided-workflow/BuyWorkflowReviewOffer', () => ({
  __esModule: true,
  default: () => <div data-testid="buy-workflow-review-offer">Review Offer</div>
}));

jest.mock('../../components/guided-workflow/BuyWorkflowPayment', () => ({
  __esModule: true,
  default: () => <div data-testid="buy-workflow-payment">Payment</div>
}));

jest.mock('../../components/guided-workflow/BuyWorkflowComplete', () => ({
  __esModule: true,
  default: () => <div data-testid="buy-workflow-complete">Complete</div>
}));

jest.mock('../../components/guided-workflow/SellWorkflowCreateOffer', () => ({
  __esModule: true,
  default: () => <div data-testid="sell-workflow-create-offer">Create Offer</div>
}));

describe('TradingGuidedWorkflow Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders workflow intro initially', () => {
    renderWithProviders(<TradingGuidedWorkflow />);
    
    expect(screen.getByTestId('trading-workflow-intro')).toBeInTheDocument();
  });

  test('navigates through buy workflow steps', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingGuidedWorkflow initialMode="buy" />);
    
    // Check if intro is rendered
    expect(screen.getByTestId('trading-workflow-intro')).toBeInTheDocument();
    
    // Navigate to next step (select offer)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('buy-workflow-select-offer')).toBeInTheDocument();
    
    // Navigate to next step (review offer)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('buy-workflow-review-offer')).toBeInTheDocument();
    
    // Navigate to next step (payment)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('buy-workflow-payment')).toBeInTheDocument();
    
    // Navigate to next step (complete)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('buy-workflow-complete')).toBeInTheDocument();
  });

  test('navigates through sell workflow steps', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingGuidedWorkflow initialMode="sell" />);
    
    // Check if intro is rendered
    expect(screen.getByTestId('trading-workflow-intro')).toBeInTheDocument();
    
    // Navigate to next step (create offer)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('sell-workflow-create-offer')).toBeInTheDocument();
  });

  test('allows navigation back to previous steps', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingGuidedWorkflow initialMode="buy" />);
    
    // Navigate to select offer step
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('buy-workflow-select-offer')).toBeInTheDocument();
    
    // Navigate back to intro
    await user.click(screen.getByText('Previous'));
    expect(screen.getByTestId('trading-workflow-intro')).toBeInTheDocument();
  });

  test('handles workflow completion', async () => {
    const user = userEvent.setup();
    const handleComplete = jest.fn();
    
    renderWithProviders(<TradingGuidedWorkflow onComplete={handleComplete} initialMode="buy" />);
    
    // Navigate through all steps
    await user.click(screen.getByText('Next')); // to select offer
    await user.click(screen.getByText('Next')); // to review offer
    await user.click(screen.getByText('Next')); // to payment
    await user.click(screen.getByText('Next')); // to complete
    
    // Complete workflow
    await user.click(screen.getByText('Complete'));
    
    // Check if completion handler was called
    expect(handleComplete).toHaveBeenCalled();
  });

  test('allows switching between buy and sell modes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingGuidedWorkflow />);
    
    // Check if intro is rendered with mode selection
    expect(screen.getByTestId('trading-workflow-intro')).toBeInTheDocument();
    
    // Select buy mode
    await user.click(screen.getByText(/I want to buy/i));
    
    // Navigate to next step (select offer)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('buy-workflow-select-offer')).toBeInTheDocument();
    
    // Go back to intro
    await user.click(screen.getByText('Previous'));
    
    // Select sell mode
    await user.click(screen.getByText(/I want to sell/i));
    
    // Navigate to next step (create offer)
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('sell-workflow-create-offer')).toBeInTheDocument();
  });
});
