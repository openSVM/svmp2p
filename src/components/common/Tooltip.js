import React, { useState } from 'react';

/**
 * Tooltip component for displaying contextual help
 */
const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  width = '200px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  
  return (
    <div 
      className="tooltip-container" 
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          className={`tooltip tooltip-${position}`}
          style={{ width }}
          role="tooltip"
        >
          <div className="tooltip-content">{content}</div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
      
      <style jsx>{`
        .tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        
        .tooltip {
          position: absolute;
          z-index: 1000;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 4px;
          padding: 8px 10px;
          font-size: 0.85rem;
          line-height: 1.4;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .tooltip-content {
          text-align: center;
          white-space: normal;
        }
        
        .tooltip-arrow {
          position: absolute;
          width: 0;
          height: 0;
          border-style: solid;
        }
        
        .tooltip-top {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        }
        
        .tooltip-top .tooltip-arrow {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px 6px 0;
          border-color: rgba(0, 0, 0, 0.8) transparent transparent;
        }
        
        .tooltip-bottom {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        }
        
        .tooltip-bottom .tooltip-arrow {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 0 6px 6px;
          border-color: transparent transparent rgba(0, 0, 0, 0.8);
        }
        
        .tooltip-left {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        }
        
        .tooltip-left .tooltip-arrow {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px 0 6px 6px;
          border-color: transparent transparent transparent rgba(0, 0, 0, 0.8);
        }
        
        .tooltip-right {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        }
        
        .tooltip-right .tooltip-arrow {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px 6px 6px 0;
          border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
        }
      `}</style>
    </div>
  );
};

export default Tooltip;