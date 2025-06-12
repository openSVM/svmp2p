import React from 'react';
import { Tooltip } from './common';

/**
 * Component to show demo mode indicator
 */
const DemoIndicator = ({ 
  type = 'badge', // 'badge', 'banner', 'inline'
  message = 'Demo Data',
  tooltip = 'This is sample data for demonstration. Connect your wallet to see real trading opportunities.',
  className = ''
}) => {
  const baseClasses = 'demo-indicator';
  const typeClasses = {
    badge: 'demo-badge',
    banner: 'demo-banner',
    inline: 'demo-inline'
  };

  if (type === 'banner') {
    return (
      <div className={`${baseClasses} ${typeClasses.banner} ${className}`}>
        <div className="demo-banner-content">
          <div className="demo-banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M13 17h-2v-6h2v6zm0-8h-2V7h2v2zm-1-5.99L12 2C6.47 2 2 6.48 2 12s4.47 10 10 10 10-4.47 10-10S17.52 2 12 2.01zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            </svg>
          </div>
          <div className="demo-banner-text">
            <strong>{message}</strong>
            <span className="demo-banner-description">
              {tooltip}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'inline') {
    return (
      <span className={`${baseClasses} ${typeClasses.inline} ${className}`}>
        <Tooltip content={tooltip} position="top">
          <span className="demo-inline-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M13 17h-2v-6h2v6zm0-8h-2V7h2v2zm-1-5.99L12 2C6.47 2 2 6.48 2 12s4.47 10 10 10 10-4.47 10-10S17.52 2 12 2.01zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            </svg>
            {message}
          </span>
        </Tooltip>
      </span>
    );
  }

  // Default: badge type
  return (
    <Tooltip content={tooltip} position="top">
      <div className={`${baseClasses} ${typeClasses.badge} ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
          <path d="M13 17h-2v-6h2v6zm0-8h-2V7h2v2zm-1-5.99L12 2C6.47 2 2 6.48 2 12s4.47 10 10 10 10-4.47 10-10S17.52 2 12 2.01zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        </svg>
        <span>{message}</span>
      </div>
    </Tooltip>
  );
};

export default DemoIndicator;