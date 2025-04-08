import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

// Create notification context
const NotificationContext = createContext();

/**
 * NotificationProvider component manages the notification state and provides methods
 * to add, update, and remove notifications
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('svmp2p_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
  }, []);
  
  // Save notifications to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('svmp2p_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);
  
  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    
    // Auto-dismiss success notifications after 5 seconds
    if (notification.type === 'success' && notification.autoDismiss !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
    
    return newNotification.id;
  };
  
  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };
  
  // Remove all notifications
  const removeAllNotifications = () => {
    setNotifications([]);
  };
  
  // Update a notification
  const updateNotification = (id, updates) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, ...updates }
          : notification
      )
    );
  };
  
  // Helper methods for common notification types
  const notifySuccess = (title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  };
  
  const notifyError = (title, message, options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      autoDismiss: false,
      ...options
    });
  };
  
  const notifyWarning = (title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      autoDismiss: false,
      ...options
    });
  };
  
  const notifyInfo = (title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  };
  
  const notifyTrade = (title, message, options = {}) => {
    return addNotification({
      type: 'trade',
      title,
      message,
      category: 'Trade',
      autoDismiss: false,
      ...options
    });
  };
  
  // Context value
  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    removeAllNotifications,
    updateNotification,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyTrade
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
