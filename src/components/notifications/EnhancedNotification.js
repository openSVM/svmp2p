import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/EnhancedNotification.css';

/**
 * EnhancedNotification component
 * Advanced notification with action buttons, categories, and detailed information
 * Provides better user interaction and trust-building features
 */
const EnhancedNotification = ({
  id,
  type = 'info',
  category = 'general',
  title,
  message,
  details = null,
  timestamp,
  read = false,
  actions = [],
  priority = 'normal',
  persistent = false,
  autoClose = true,
  autoCloseTime = 5000,
  showProgressBar = false,
  progressValue = 0,
  verificationStatus = null,
  trustIndicators = {},
  onRead,
  onDelete,
  onAction,
  onExpand,
  expanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(autoClose ? autoCloseTime / 1000 : null);

  // Auto-close timer
  useEffect(() => {
    if (autoClose && !persistent && type !== 'error' && !read) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsVisible(false);
            if (onDelete) onDelete(id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoClose, persistent, type, read, id, onDelete]);

  // Mark as read when interacted with
  const handleRead = () => {
    if (!read && onRead) {
      onRead(id);
    }
  };

  // Handle expand/collapse
  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onExpand) onExpand(id, newExpanded);
    handleRead();
  };

  // Handle action click
  const handleActionClick = (action) => {
    if (onAction) {
      onAction(id, action);
    }
    handleRead();
  };

  // Handle delete
  const handleDelete = () => {
    setIsVisible(false);
    if (onDelete) onDelete(id);
  };

  if (!isVisible) return null;

  // Get notification icon
  const getNotificationIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ⓘ';
      case 'trade':
        return '↔';
      default:
        return '●';
    }
  };

  // Get priority indicator
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`enhanced-notification ${type} ${priority} ${read ? 'read' : 'unread'}`}>
      {/* Priority indicator */}
      {priority === 'high' && (
        <div className="priority-indicator" style={{ background: getPriorityColor() }} />
      )}

      <div className="notification-header">
        <div className="notification-icon">
          {getNotificationIcon()}
        </div>
        
        <div className="notification-content">
          <div className="notification-title-row">
            <h4 className="notification-title">{title}</h4>
            <div className="notification-meta">
              <span className="category-badge">{category}</span>
              <span className="timestamp">{formatTimestamp(timestamp)}</span>
            </div>
          </div>
          
          <div className="notification-message">{message}</div>
          
          {/* Trust indicators */}
          {Object.keys(trustIndicators).length > 0 && (
            <div className="trust-indicators">
              {trustIndicators.verified && (
                <span className="trust-badge verified">✓ Verified</span>
              )}
              {trustIndicators.secure && (
                <span className="trust-badge secure">🔒 Secure</span>
              )}
              {trustIndicators.successRate && (
                <span className="trust-badge success-rate">
                  📊 {trustIndicators.successRate}% success rate
                </span>
              )}
            </div>
          )}

          {/* Progress bar */}
          {showProgressBar && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <span className="progress-text">{progressValue}%</span>
            </div>
          )}

          {/* Verification status */}
          {verificationStatus && (
            <div className={`verification-status ${verificationStatus.status}`}>
              <span className="verification-icon">
                {verificationStatus.status === 'verified' ? '✓' : 
                 verificationStatus.status === 'pending' ? '⏳' : '⚠'}
              </span>
              {verificationStatus.message}
            </div>
          )}
        </div>

        {/* Auto-close timer */}
        {autoClose && !persistent && timeRemaining && timeRemaining > 0 && (
          <div className="auto-close-timer">
            <div 
              className="timer-circle"
              style={{ 
                strokeDashoffset: `${31.4 * (1 - timeRemaining / (autoCloseTime / 1000))}` 
              }}
            />
            <span className="timer-text">{timeRemaining}</span>
          </div>
        )}

        {/* Control buttons */}
        <div className="notification-controls">
          {details && (
            <button 
              className="expand-button"
              onClick={handleToggleExpand}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
          <button 
            className="close-button"
            onClick={handleDelete}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && details && (
        <div className="notification-details">
          <div className="details-content">
            {typeof details === 'string' ? (
              <p>{details}</p>
            ) : (
              details
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="notification-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`action-button ${action.type || 'secondary'}`}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

EnhancedNotification.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'trade']),
  category: PropTypes.string,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  details: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  timestamp: PropTypes.string.isRequired,
  read: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['primary', 'secondary', 'danger']),
      icon: PropTypes.string,
      disabled: PropTypes.bool,
      action: PropTypes.string.isRequired
    })
  ),
  priority: PropTypes.oneOf(['low', 'normal', 'medium', 'high']),
  persistent: PropTypes.bool,
  autoClose: PropTypes.bool,
  autoCloseTime: PropTypes.number,
  showProgressBar: PropTypes.bool,
  progressValue: PropTypes.number,
  verificationStatus: PropTypes.shape({
    status: PropTypes.oneOf(['verified', 'pending', 'failed']).isRequired,
    message: PropTypes.string.isRequired
  }),
  trustIndicators: PropTypes.shape({
    verified: PropTypes.bool,
    secure: PropTypes.bool,
    successRate: PropTypes.number
  }),
  onRead: PropTypes.func,
  onDelete: PropTypes.func,
  onAction: PropTypes.func,
  onExpand: PropTypes.func,
  expanded: PropTypes.bool
};

export default EnhancedNotification;