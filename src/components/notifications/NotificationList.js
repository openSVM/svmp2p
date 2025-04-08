import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import NotificationItem from './NotificationItem';

/**
 * NotificationList component displays a list of notifications
 */
const NotificationList = ({ 
  notifications, 
  onRead, 
  onDelete, 
  onAction, 
  onReadAll, 
  onDeleteAll 
}) => {
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Calculate unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  }, [notifications]);
  
  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });
  
  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(notification);
    return groups;
  }, {});
  
  return (
    <div className="notification-list">
      <div className="notification-list-header">
        <h3 className="notification-list-title">
          Notifications
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </h3>
        
        <div className="notification-filters">
          <button 
            className={`notification-filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`notification-filter-button ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button 
            className={`notification-filter-button ${filter === 'trade' ? 'active' : ''}`}
            onClick={() => setFilter('trade')}
          >
            Trades
          </button>
          <button 
            className={`notification-filter-button ${filter === 'info' ? 'active' : ''}`}
            onClick={() => setFilter('info')}
          >
            Info
          </button>
        </div>
        
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button 
              className="notification-action-button"
              onClick={onReadAll}
              title="Mark all as read"
            >
              Mark all as read
            </button>
          )}
          
          {notifications.length > 0 && (
            <button 
              className="notification-action-button"
              onClick={onDeleteAll}
              title="Clear all notifications"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      
      <div className="notification-list-content">
        {Object.keys(groupedNotifications).length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
            </div>
            <div className="notification-empty-text">
              {filter === 'all' 
                ? 'No notifications yet' 
                : filter === 'unread' 
                  ? 'No unread notifications' 
                  : `No ${filter} notifications`}
            </div>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date} className="notification-group">
              <div className="notification-date-header">{date}</div>
              
              {dateNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={onRead}
                  onDelete={onDelete}
                  onAction={onAction}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'trade', 'default']).isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      read: PropTypes.bool.isRequired,
      category: PropTypes.string,
      actionText: PropTypes.string,
      actionType: PropTypes.string
    })
  ).isRequired,
  onRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
  onReadAll: PropTypes.func.isRequired,
  onDeleteAll: PropTypes.func.isRequired
};

export default NotificationList;
