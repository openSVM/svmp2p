import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ToastNotification from './ToastNotification';

/**
 * ToastContainer component manages and displays toast notifications
 */
const ToastContainer = ({ 
  toasts, 
  position = 'top-right', 
  onClose 
}) => {
  const [visibleToasts, setVisibleToasts] = useState([]);
  
  // Update visible toasts when toasts prop changes
  useEffect(() => {
    setVisibleToasts(toasts);
  }, [toasts]);
  
  // Position classes
  const positionClasses = {
    'top-right': 'toast-container-top-right',
    'top-left': 'toast-container-top-left',
    'bottom-right': 'toast-container-bottom-right',
    'bottom-left': 'toast-container-bottom-left',
    'top-center': 'toast-container-top-center',
    'bottom-center': 'toast-container-bottom-center'
  };
  
  return (
    <div className={`toast-container ${positionClasses[position] || 'toast-container-top-right'}`}>
      {visibleToasts.map(toast => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'default']).isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string
    })
  ).isRequired,
  position: PropTypes.oneOf([
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'top-center',
    'bottom-center'
  ]),
  onClose: PropTypes.func.isRequired
};

export default ToastContainer;
