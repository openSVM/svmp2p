import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * NotificationItem component displays a single notification
 */
const NotificationItem = ({ 
  notification, 
  onRead, 
  onDelete, 
  onAction 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  
  // Format the time ago string
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const notificationTime = new Date(notification.timestamp);
      const diffInSeconds = Math.floor((now - notificationTime) / 1000);
      
      if (diffInSeconds < 60) {
        setTimeAgo('just now');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
      } else {
        setTimeAgo(notificationTime.toLocaleDateString());
      }
    };
    
    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [notification.timestamp]);
  
  // Get icon based on notification type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <div className="notification-icon notification-icon-success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="notification-icon notification-icon-warning">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="notification-icon notification-icon-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="notification-icon notification-icon-info">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
        );
      case 'trade':
        return (
          <div className="notification-icon notification-icon-trade">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="notification-icon notification-icon-default">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          </div>
        );
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    onRead(notification.id);
  };
  
  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification.id);
  };
  
  // Handle action button click
  const handleAction = (e) => {
    e.stopPropagation();
    onAction(notification.id, notification.actionType);
  };
  
  return (
    <div 
      className={`notification-item ${notification.read ? 'notification-read' : 'notification-unread'} notification-${notification.type}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="notification-header">
        {getNotificationIcon()}
        
        <div className="notification-content">
          <div className="notification-title">
            {notification.title}
          </div>
          
          <div className="notification-meta">
            <span className="notification-time">{timeAgo}</span>
            {notification.category && (
              <span className="notification-category">{notification.category}</span>
            )}
          </div>
        </div>
        
        <div className="notification-actions">
          {!notification.read && (
            <button 
              className="notification-action-button notification-read-button"
              onClick={handleMarkAsRead}
              aria-label="Mark as read"
              title="Mark as read"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </button>
          )}
          
          <button 
            className="notification-action-button notification-delete-button"
            onClick={handleDelete}
            aria-label="Delete notification"
            title="Delete notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="notification-details">
          <div className="notification-message">
            {notification.message}
          </div>
          
          {notification.actionText && (
            <div className="notification-action">
              <button 
                className="button button-sm"
                onClick={handleAction}
              >
                {notification.actionText}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'trade', 'default']).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired,
    category: PropTypes.string,
    actionText: PropTypes.string,
    actionType: PropTypes.string
  }).isRequired,
  onRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired
};

export default NotificationItem;
