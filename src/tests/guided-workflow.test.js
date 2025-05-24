import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TradingGuidedWorkflow from '../components/guided-workflow/TradingGuidedWorkflow';
import GuidedWorkflow from '../components/guided-workflow/GuidedWorkflow';
import GuidedWorkflowStep from '../components/guided-workflow/GuidedWorkflowStep';

// Mock the child components to simplify testing
jest.mock('../components/guided-workflow/GuidedWorkflow', () => {
  return jest.fn(({ steps, initialStep, onComplete }) => (
    <div data-testid="guided-workflow">
      <div data-testid="steps-count">{steps.length}</div>
      <div data-testid="current-step">{initialStep}</div>
      <button data-testid="complete-button" onClick={onComplete}>Complete</button>
    </div>
  ));
});

describe('Trading Guided Workflow Tests', () => {
  beforeEach(() => {
    GuidedWorkflow.mockClear();
  });

  test('renders buy workflow with correct steps', () => {
    render(<TradingGuidedWorkflow tradingType="buy" onComplete={() => {}} />);
    
    expect(GuidedWorkflow).toHaveBeenCalled();
    const workflowProps = GuidedWorkflow.mock.calls[0][0];
    
    // Buy workflow should have 5 steps
    expect(workflowProps.steps.length).toBe(5);
    expect(workflowProps.initialStep).toBe(0);
    
    // Verify step titles
    expect(workflowProps.steps[0].title).toBe('Introduction');
    expect(workflowProps.steps[1].title).toBe('Select Offer');
    expect(workflowProps.steps[2].title).toBe('Review Offer');
    expect(workflowProps.steps[3].title).toBe('Make Payment');
    expect(workflowProps.steps[4].title).toBe('Complete');
  });

  test('renders sell workflow with correct steps', () => {
    render(<TradingGuidedWorkflow tradingType="sell" onComplete={() => {}} />);
    
    expect(GuidedWorkflow).toHaveBeenCalled();
    const workflowProps = GuidedWorkflow.mock.calls[0][0];
    
    // Sell workflow should have 4 steps
    expect(workflowProps.steps.length).toBe(4);
    expect(workflowProps.initialStep).toBe(0);
    
    // Verify step titles
    expect(workflowProps.steps[0].title).toBe('Introduction');
    expect(workflowProps.steps[1].title).toBe('Create Offer');
    expect(workflowProps.steps[2].title).toBe('Review Escrow');
    expect(workflowProps.steps[3].title).toBe('Complete');
  });

  test('calls onComplete callback when workflow is completed', () => {
    const mockOnComplete = jest.fn();
    render(<TradingGuidedWorkflow tradingType="buy" onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByTestId('complete-button'));
    
    expect(mockOnComplete).toHaveBeenCalled();
  });
});

describe('GuidedWorkflowStep Tests', () => {
  test('renders step correctly when active', () => {
    render(
      <GuidedWorkflowStep
        stepNumber={1}
        title="Test Step"
        description="Test description"
        isActive={true}
        isCompleted={false}
      >
        <div data-testid="step-content">Step content</div>
      </GuidedWorkflowStep>
    );
    
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByTestId('step-content')).toBeInTheDocument();
  });
  
  test('does not render content when inactive', () => {
    render(
      <GuidedWorkflowStep
        stepNumber={1}
        title="Test Step"
        description="Test description"
        isActive={false}
        isCompleted={false}
      >
        <div data-testid="step-content">Step content</div>
      </GuidedWorkflowStep>
    );
    
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-content')).not.toBeInTheDocument();
  });
  
  test('shows completed status when step is completed', () => {
    render(
      <GuidedWorkflowStep
        stepNumber={1}
        title="Test Step"
        description="Test description"
        isActive={false}
        isCompleted={true}
      >
        <div>Step content</div>
      </GuidedWorkflowStep>
    );
    
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
