import React from 'react';
import '../styles/confirmation-dialog.css';

/**
 * ConfirmationDialog component for important actions requiring confirmation
 */
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default' // 'default', 'warning', 'danger'
}) => {
  if (!isOpen) return null;
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div className="confirmation-dialog-backdrop" onClick={handleBackdropClick}>
      <div className={`confirmation-dialog ${variant}`} role="dialog" aria-modal="true">
        <div className="confirmation-dialog-header">
          <h3 className="confirmation-dialog-title">{title}</h3>
          <button 
            className="confirmation-dialog-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="confirmation-dialog-body">
          <p>{message}</p>
        </div>
        
        <div className="confirmation-dialog-actions">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-button ${variant}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;