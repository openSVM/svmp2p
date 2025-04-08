import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import NotificationList from './NotificationList';

/**
 * NotificationCenter component provides a dropdown notification center
 */
const NotificationCenter = ({ 
  notifications, 
  onRead, 
  onDelete, 
  onAction, 
  onReadAll, 
  onDeleteAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  
  // Calculate unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  }, [notifications]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="notification-center" ref={dropdownRef}>
      <button 
        className="notification-center-button"
        onClick={toggleDropdown}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <NotificationList
            notifications={notifications}
            onRead={onRead}
            onDelete={onDelete}
            onAction={onAction}
            onReadAll={onReadAll}
            onDeleteAll={onDeleteAll}
          />
        </div>
      )}
    </div>
  );
};

NotificationCenter.propTypes = {
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

export default NotificationCenter;
