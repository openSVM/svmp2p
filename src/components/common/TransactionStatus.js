import React from 'react';

/**
 * TransactionStatus component
 * A reusable component for displaying transaction status in a toast-like notification
 */
const TransactionStatus = ({ 
  status, 
  message, 
  onClose, 
  autoClose = true,
  autoCloseTime = 5000
}) => {
  const [visible, setVisible] = React.useState(true);
  
  React.useEffect(() => {
    if (autoClose && status !== 'pending') {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose, status]);
  
  if (!visible) return null;  
  
  const statusClasses = {
    pending: 'status-pending',
    success: 'status-success',
    error: 'status-error',
    warning: 'status-warning'
  };
  
  const statusIcons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  const statusClass = statusClasses[status] || 'status-pending';
  const statusIcon = statusIcons[status] || '⏳';
  
  return (
    <div className={`transaction-status ${statusClass}`}>
      <div className="status-icon">{statusIcon}</div>
      <div className="status-content">
        <div className="status-title">
          {status === 'pending' && 'Transaction in Progress'}
          {status === 'success' && 'Transaction Successful'}
          {status === 'error' && 'Transaction Failed'}
          {status === 'warning' && 'Transaction Warning'}
        </div>
        {message && <div className="status-message">{message}</div>}
      </div>
      <button className="close-button" onClick={() => {
        setVisible(false);
        if (onClose) onClose();
      }}>
        ×
      </button>
      
      <style jsx>{`
        .transaction-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-width: 400px;
          animation: slide-in 0.3s ease-out;
        }
        
        .status-pending {
          border-left: 4px solid #f59e0b;
        }
        
        .status-success {
          border-left: 4px solid #10b981;
        }
        
        .status-error {
          border-left: 4px solid #ef4444;
        }
        
        .status-warning {
          border-left: 4px solid #f59e0b;
        }
        
        .status-icon {
          margin-right: 12px;
          font-size: 20px;
        }
        
        .status-content {
          flex: 1;
        }
        
        .status-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .status-message {
          font-size: 14px;
          color: #6b7280;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          color: #6b7280;
          margin-left: 12px;
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionStatus;
