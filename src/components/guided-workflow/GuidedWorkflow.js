import React, { useState } from 'react';
import GuidedWorkflowStep from './GuidedWorkflowStep';

/**
 * GuidedWorkflow component - Manages the overall workflow and transitions between steps
 */
const GuidedWorkflow = ({ 
  steps, 
  onComplete,
  initialStep = 0
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      // Move to next step
      setCurrentStep(currentStep + 1);
    } else {
      // Final step completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      // Call onComplete callback
      if (onComplete) {
        onComplete();
      }
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (stepIndex) => {
    // Only allow jumping to completed steps or the next available step
    if (completedSteps.includes(stepIndex) || stepIndex === currentStep || 
        (stepIndex === completedSteps.length && stepIndex < steps.length)) {
      setCurrentStep(stepIndex);
    }
  };
  
  const isStepCompleted = (stepIndex) => {
    return completedSteps.includes(stepIndex);
  };
  
  return (
    <div className="guided-workflow">
      <div className="workflow-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`progress-step ${index === currentStep ? 'active' : ''} ${isStepCompleted(index) ? 'completed' : ''}`}
              onClick={() => goToStep(index)}
            >
              {isStepCompleted(index) ? '✓' : index + 1}
            </div>
          ))}
        </div>
      </div>
      
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <GuidedWorkflowStep
            key={index}
            stepNumber={index + 1}
            title={step.title}
            description={step.description}
            isActive={index === currentStep}
            isCompleted={isStepCompleted(index)}
          >
            {index === currentStep && step.component}
          </GuidedWorkflowStep>
        ))}
      </div>
      
      <div className="workflow-navigation">
        <button 
          className="previous-button"
          onClick={goToPreviousStep}
          disabled={currentStep === 0}
        >
          Previous
        </button>
        
        <button 
          className="next-button"
          onClick={goToNextStep}
        >
          {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default GuidedWorkflow;
