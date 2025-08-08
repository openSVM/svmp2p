import React from 'react';

/**
 * TransactionConfirmation component
 * A reusable component for displaying transaction confirmations and status
 */
const TransactionConfirmation = ({ 
  status, 
  txHash, 
  message, 
  onClose, 
  showDetails = true,
  network = 'mainnet'
}) => {
  const statusClasses = {
    pending: 'status-pending',
    success: 'status-success',
    error: 'status-error',
    warning: 'status-warning'
  };

  const statusClass = statusClasses[status] || 'status-pending';
  const explorerBaseUrl = network === 'devnet' 
    ? 'https://explorer.solana.com/tx/' 
    : 'https://explorer.solana.com/tx/';

  return (
    <div className={`transaction-confirmation ${statusClass}`}>
      <div className="confirmation-header">
        <h3>Transaction {status === 'success' ? 'Confirmed' : status === 'error' ? 'Failed' : 'Processing'}</h3>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>
      
      <div className="confirmation-body">
        {status === 'pending' && (
          <div className="status-indicator">
            <div className="pulse-animation"></div>
            <p>Transaction in progress...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="status-indicator">
            <div className="success-checkmark">[+]</div>
            <p>Transaction confirmed!</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="status-indicator">
            <div className="error-icon">[X]</div>
            <p>Transaction failed</p>
          </div>
        )}
        
        {status === 'warning' && (
          <div className="status-indicator">
            <div className="warning-icon">[!]</div>
            <p>Transaction needs attention</p>
          </div>
        )}
        
        {message && <p className="confirmation-message">{message}</p>}
        
        {showDetails && txHash && (
          <div className="transaction-details">
            <p className="tx-hash">
              Transaction ID: 
              <span className="hash-value">
                {txHash.slice(0, 8)}...{txHash.slice(-8)}
              </span>
            </p>
            <a 
              href={`${explorerBaseUrl}${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="explorer-link"
            >
              View on Solana Explorer
            </a>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .transaction-confirmation {
          border-radius: 0;
          margin: 1rem 0;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          /* Glass effect applied via glass-effects.css */
          /* background-color: white; */
          border-left: 4px solid var(--color-border);
        }
        
        .status-pending {
          border-left-color: #f59e0b;
        }
        
        .status-success {
          border-left-color: #10b981;
        }
        
        .status-error {
          border-left-color: #ef4444;
        }
        
        .status-warning {
          border-left-color: #f59e0b;
        }
        
        .confirmation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          /* Glass effect applied via glass-effects.css */
          /* background-color: #f9fafb; */
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .confirmation-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          color: #6b7280;
        }
        
        .confirmation-body {
          padding: 1rem;
        }
        
        .status-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .pulse-animation {
          width: 40px;
          height: 40px;
          border-radius: 0;
          background-color: var(--color-warning);
          margin-bottom: 0.5rem;
          animation: pulse 1.5s infinite;
        }
        
        .success-checkmark {
          width: 40px;
          height: 40px;
          border-radius: 0;
          background-color: var(--color-success);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .error-icon {
          width: 40px;
          height: 40px;
          border-radius: 0;
          background-color: var(--color-error);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .warning-icon {
          width: 40px;
          height: 40px;
          border-radius: 0;
          background-color: var(--color-warning);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .confirmation-message {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .transaction-details {
          /* Glass effect will be applied via glass-effects.css to form elements */
          /* background-color: #f9fafb; */
          padding: 0.75rem;
          border-radius: 0;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .tx-hash {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
        }
        
        .hash-value {
          font-family: monospace;
          margin-left: 0.5rem;
        }
        
        .explorer-link {
          color: #3b82f6;
          text-decoration: none;
          display: inline-block;
          margin-top: 0.5rem;
        }
        
        .explorer-link:hover {
          text-decoration: underline;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
          }
          
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
          }
          
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionConfirmation;
