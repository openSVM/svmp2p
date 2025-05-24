import React, { useState } from 'react';
import { Tooltip } from '../common';

/**
 * GuidedWorkflowStep component - Renders a single step in the guided workflow
 */
const GuidedWorkflowStep = ({ 
  stepNumber, 
  title, 
  description, 
  isActive, 
  isCompleted, 
  helpText = 'Click on the question mark for more information',
  children 
}) => {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <div className={`guided-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <div className="step-title">
          <h3>{title}</h3>
          {isCompleted && <span className="step-completed-badge">✓</span>}
          
          <Tooltip content={helpText} position="right" width="250px">
            <button 
              className="help-button" 
              aria-label="Help"
              onClick={() => setShowHelp(!showHelp)}
            >
              ?
            </button>
          </Tooltip>
        </div>
      </div>
      
      {isActive && (
        <div className="step-content">
          <p className="step-description">{description}</p>
          {showHelp && (
            <div className="step-help-text">
              <p>{helpText}</p>
            </div>
          )}
          <div className="step-form">
            {children}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .help-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #e5e7eb;
          color: #4b5563;
          font-size: 14px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          margin-left: 10px;
          transition: all 0.2s;
        }
        
        .help-button:hover {
          background-color: #d1d5db;
        }
        
        .step-help-text {
          background-color: #f3f4f6;
          border-left: 4px solid #3b82f6;
          padding: 10px 15px;
          margin: 10px 0;
          border-radius: 0 4px 4px 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default GuidedWorkflowStep;
