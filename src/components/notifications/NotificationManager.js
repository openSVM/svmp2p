import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';
import ToastContainer from './ToastContainer';

/**
 * NotificationManager component integrates the notification system with the application
 * It renders the toast notifications and handles their lifecycle
 */
const NotificationManager = () => {
  const [toasts, setToasts] = useState([]);
  const { notifications, removeNotification } = useNotifications();
  
  // Extract toast notifications from all notifications
  useEffect(() => {
    // Find notifications that should be displayed as toasts (recent success, error, warning)
    const now = new Date();
    const recentToasts = notifications
      .filter(notification => {
        // Only show notifications from the last 5 seconds as toasts
        const notificationTime = new Date(notification.timestamp);
        const diffInSeconds = Math.floor((now - notificationTime) / 1000);
        
        // Success notifications are auto-dismissed, so always show them
        if (notification.type === 'success') return true;
        
        // For errors and warnings, only show recent ones (within last 5 seconds)
        if ((notification.type === 'error' || notification.type === 'warning') && diffInSeconds < 5) {
          return true;
        }
        
        // Don't show other notification types as toasts
        return false;
      })
      .slice(0, 5); // Limit to 5 toasts at a time
    
    setToasts(recentToasts);
  }, [notifications]);
  
  // Handle closing a toast
  const handleCloseToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  return (
    <ToastContainer
      toasts={toasts}
      position="top-right"
      onClose={handleCloseToast}
    />
  );
};

export default NotificationManager;
