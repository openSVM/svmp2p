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
    </div>
  );
};

export default Tooltip;