import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * TransactionProgressIndicator component
 * Advanced multi-step progress indicator for complex transactions
 * Provides detailed progress tracking and estimated completion times
 */
const TransactionProgressIndicator = ({
  steps = [],
  currentStepIndex = 0,
  progress = 0,
  estimatedTimeRemaining = null,
  totalSteps = null,
  status = 'pending',
  onStepClick = null,
  showTimeEstimate = true,
  showProgressBar = true,
  showStepDetails = true,
  compact = false
}) => {
  const [startTime] = useState(Date.now());
  const [, forceRender] = useState({});

  // Force re-render every second to update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      forceRender({});
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed time directly during render for accuracy
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

  // Calculate progress percentage
  const progressPercentage = totalSteps 
    ? Math.min(100, (currentStepIndex / totalSteps) * 100)
    : Math.min(100, progress);

  // Format time display
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get step status
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return status;
    return 'pending';
  };

  // Get step icon
  const getStepIcon = (stepStatus, stepIndex) => {
    switch (stepStatus) {
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'pending':
        return stepIndex + 1;
      default:
        return '●';
    }
  };

  if (compact) {
    return (
      <div className="transaction-progress-compact">
        <div className="progress-summary">
          <span className="progress-text">
            Step {currentStepIndex + 1} of {totalSteps || steps.length}
          </span>
          {showProgressBar && (
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
          {showTimeEstimate && estimatedTimeRemaining && (
            <span className="time-estimate">
              ~{formatTime(estimatedTimeRemaining)} remaining
            </span>
          )}
        </div>
        
      </div>
    );
  }

  return (
    <div className="transaction-progress-indicator">
      {/* Header with overall progress */}
      <div className="progress-header">
        <h4 className="progress-title">Transaction Progress</h4>
        <div className="progress-stats">
          <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
          {showTimeEstimate && (
            <div className="time-info">
              <span className="elapsed-time">Elapsed: {formatTime(elapsedTime)}</span>
              {estimatedTimeRemaining && (
                <span className="remaining-time">
                  Remaining: ~{formatTime(estimatedTimeRemaining)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgressBar && (
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Step details */}
      {showStepDetails && steps.length > 0 && (
        <div className="steps-container">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(index);
            const isClickable = onStepClick && (stepStatus === 'completed' || stepStatus === 'error');
            
            return (
              <div
                key={index}
                className={`step-item ${stepStatus} ${isClickable ? 'clickable' : ''}`}
                onClick={isClickable ? () => onStepClick(index, step) : undefined}
              >
                <div className="step-icon">
                  {getStepIcon(stepStatus, index)}
                </div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  {step.description && (
                    <div className="step-description">{step.description}</div>
                  )}
                  {step.details && stepStatus === 'pending' && (
                    <div className="step-details">{step.details}</div>
                  )}
                  {step.error && stepStatus === 'error' && (
                    <div className="step-error">{step.error}</div>
                  )}
                </div>
                {step.duration && stepStatus === 'completed' && (
                  <div className="step-duration">{formatTime(step.duration)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

TransactionProgressIndicator.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      details: PropTypes.string,
      error: PropTypes.string,
      duration: PropTypes.number
    })
  ),
  currentStepIndex: PropTypes.number,
  progress: PropTypes.number,
  estimatedTimeRemaining: PropTypes.number,
  totalSteps: PropTypes.number,
  status: PropTypes.oneOf(['pending', 'success', 'error', 'warning']),
  onStepClick: PropTypes.func,
  showTimeEstimate: PropTypes.bool,
  showProgressBar: PropTypes.bool,
  showStepDetails: PropTypes.bool,
  compact: PropTypes.bool
};

export default TransactionProgressIndicator;