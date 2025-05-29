import React, { useState } from 'react';

/**
 * GuidedWorkflowStep component - Renders a single step in the guided workflow
 */
const GuidedWorkflowStep = ({ 
  stepNumber, 
  title, 
  description, 
  isActive, 
  isCompleted, 
  children 
}) => {
  return (
    <div className={`guided-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <div className="step-title">
          <h3>{title}</h3>
          {isCompleted && <span className="step-completed-badge">[+]</span>}
        </div>
      </div>
      
      {isActive && (
        <div className="step-content">
          <p className="step-description">{description}</p>
          <div className="step-form">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedWorkflowStep;
