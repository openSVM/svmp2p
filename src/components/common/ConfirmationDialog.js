import React from 'react';

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
      
      <style jsx>{`
        .confirmation-dialog-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .confirmation-dialog {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 450px;
          max-height: 90vh;
          overflow-y: auto;
          animation: dialogFadeIn 0.2s;
        }
        
        @keyframes dialogFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .confirmation-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .confirmation-dialog-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
        }
        
        .confirmation-dialog-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        
        .confirmation-dialog-body {
          padding: 16px;
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .confirmation-dialog-actions {
          display: flex;
          justify-content: flex-end;
          padding: 16px;
          gap: 8px;
          border-top: 1px solid #eee;
        }
        
        .cancel-button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #fff;
          color: #333;
          cursor: pointer;
        }
        
        .confirm-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
        }
        
        .confirmation-dialog.default .confirm-button {
          background-color: #3b82f6;
        }
        
        .confirmation-dialog.warning .confirm-button {
          background-color: #f59e0b;
        }
        
        .confirmation-dialog.danger .confirm-button {
          background-color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationDialog;