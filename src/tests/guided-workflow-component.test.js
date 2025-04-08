import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GuidedWorkflow from '../components/guided-workflow/GuidedWorkflow';

// Mock step components
const MockStep1 = ({ onContinue }) => (
  <div>
    <h3>Step 1</h3>
    <button onClick={onContinue}>Continue</button>
  </div>
);

const MockStep2 = ({ onContinue, onBack }) => (
  <div>
    <h3>Step 2</h3>
    <button onClick={onBack}>Back</button>
    <button onClick={onContinue}>Continue</button>
  </div>
);

const MockStep3 = ({ onComplete, onBack }) => (
  <div>
    <h3>Step 3</h3>
    <button onClick={onBack}>Back</button>
    <button onClick={onComplete}>Complete</button>
  </div>
);

describe('GuidedWorkflow Component Tests', () => {
  test('renders workflow with initial step', () => {
    const mockSteps = [
      {
        title: 'Step 1',
        description: 'First step',
        component: <MockStep1 onContinue={() => {}} />
      },
      {
        title: 'Step 2',
        description: 'Second step',
        component: <MockStep2 onContinue={() => {}} onBack={() => {}} />
      },
      {
        title: 'Step 3',
        description: 'Final step',
        component: <MockStep3 onComplete={() => {}} onBack={() => {}} />
      }
    ];
    
    render(<GuidedWorkflow steps={mockSteps} initialStep={0} />);
    
    // Should render the first step
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 3')).not.toBeInTheDocument();
    
    // Should render progress indicators for all steps
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
  
  test('navigates between steps correctly', () => {
    let currentStep = 0;
    
    const goToNextStep = () => {
      currentStep += 1;
      rerender();
    };
    
    const goToPreviousStep = () => {
      currentStep -= 1;
      rerender();
    };
    
    const mockSteps = [
      {
        title: 'Step 1',
        description: 'First step',
        component: <MockStep1 onContinue={goToNextStep} />
      },
      {
        title: 'Step 2',
        description: 'Second step',
        component: <MockStep2 onContinue={goToNextStep} onBack={goToPreviousStep} />
      },
      {
        title: 'Step 3',
        description: 'Final step',
        component: <MockStep3 onComplete={() => {}} onBack={goToPreviousStep} />
      }
    ];
    
    const { rerender } = render(<GuidedWorkflow steps={mockSteps} initialStep={currentStep} />);
    
    // Should start with Step 1
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    
    // Navigate to Step 2
    fireEvent.click(screen.getByText('Continue'));
    rerender(<GuidedWorkflow steps={mockSteps} initialStep={currentStep} />);
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    
    // Navigate to Step 3
    fireEvent.click(screen.getByText('Continue'));
    rerender(<GuidedWorkflow steps={mockSteps} initialStep={currentStep} />);
    expect(screen.getByText('Step 3')).toBeInTheDocument();
    
    // Navigate back to Step 2
    fireEvent.click(screen.getByText('Back'));
    rerender(<GuidedWorkflow steps={mockSteps} initialStep={currentStep} />);
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });
  
  test('calls onComplete callback when workflow is completed', () => {
    const mockOnComplete = jest.fn();
    
    const mockSteps = [
      {
        title: 'Step 1',
        description: 'First step',
        component: <MockStep1 onContinue={() => {}} />
      },
      {
        title: 'Step 2',
        description: 'Second step',
        component: <MockStep2 onContinue={() => {}} onBack={() => {}} />
      },
      {
        title: 'Step 3',
        description: 'Final step',
        component: <MockStep3 onComplete={mockOnComplete} onBack={() => {}} />
      }
    ];
    
    render(<GuidedWorkflow steps={mockSteps} initialStep={2} onComplete={mockOnComplete} />);
    
    // Complete the workflow
    fireEvent.click(screen.getByText('Complete'));
    
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
