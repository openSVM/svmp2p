import React, { useState } from 'react';

/**
 * BuyWorkflowPayment component - Step for making payment in the buy workflow
 */
const BuyWorkflowPayment = ({ selectedOffer, onPaymentComplete, onBack }) => {
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, completed, failed
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(selectedOffer.paymentMethod);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Mock payment details that would come from the seller
  const paymentDetails = {
    'Bank Transfer': {
      accountName: 'John Smith',
      accountNumber: '****4567',
      bankName: 'Chase Bank',
      routingNumber: '****1234',
      reference: `SOL-${selectedOffer.id.substring(0, 8)}`
    },
    'PayPal': {
      email: 'seller@example.com',
      reference: `SOL-${selectedOffer.id.substring(0, 8)}`
    },
    'Venmo': {
      username: '@seller-username',
      reference: `SOL-${selectedOffer.id.substring(0, 8)}`
    },
    'Cash App': {
      cashtag: '$sellerusername',
      reference: `SOL-${selectedOffer.id.substring(0, 8)}`
    },
    'Zelle': {
      email: 'seller@example.com',
      phone: '***-***-5678',
      reference: `SOL-${selectedOffer.id.substring(0, 8)}`
    }
  };
  
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };
  
  const handleConfirmPayment = () => {
    setIsConfirming(true);
    
    // Simulate payment confirmation process
    setTimeout(() => {
      setPaymentStatus('completed');
      setIsConfirming(false);
      // Call the callback after a short delay to allow the user to see the success message
      setTimeout(() => onPaymentComplete(paymentReference, paymentProof), 1500);
    }, 2000);
  };
  
  const renderPaymentDetails = () => {
    const details = paymentDetails[paymentMethod];
    
    switch (paymentMethod) {
      case 'Bank Transfer':
        return (
          <div className="payment-details bank-transfer">
            <div className="detail-row">
              <div className="detail-label">Account Name:</div>
              <div className="detail-value">{details.accountName}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Account Number:</div>
              <div className="detail-value">{details.accountNumber}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Bank Name:</div>
              <div className="detail-value">{details.bankName}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Routing Number:</div>
              <div className="detail-value">{details.routingNumber}</div>
            </div>
          </div>
        );
        
      case 'PayPal':
        return (
          <div className="payment-details paypal">
            <div className="detail-row">
              <div className="detail-label">PayPal Email:</div>
              <div className="detail-value">{details.email}</div>
            </div>
          </div>
        );
        
      case 'Venmo':
        return (
          <div className="payment-details venmo">
            <div className="detail-row">
              <div className="detail-label">Venmo Username:</div>
              <div className="detail-value">{details.username}</div>
            </div>
          </div>
        );
        
      case 'Cash App':
        return (
          <div className="payment-details cash-app">
            <div className="detail-row">
              <div className="detail-label">Cash App Tag:</div>
              <div className="detail-value">{details.cashtag}</div>
            </div>
          </div>
        );
        
      case 'Zelle':
        return (
          <div className="payment-details zelle">
            <div className="detail-row">
              <div className="detail-label">Zelle Email:</div>
              <div className="detail-value">{details.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Zelle Phone:</div>
              <div className="detail-value">{details.phone}</div>
            </div>
          </div>
        );
        
      default:
        return <div>No payment details available</div>;
    }
  };
  
  return (
    <div className="buy-workflow-payment">
      <div className="payment-header">
        <h3>Make Payment</h3>
        <p>Please send payment using the method specified below.</p>
      </div>
      
      <div className="payment-summary">
        <div className="detail-row">
          <div className="detail-label">Amount to Pay:</div>
          <div className="detail-value highlight">
            {selectedOffer.fiatAmount.toFixed(2)} {selectedOffer.fiatCurrency}
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Payment Method:</div>
          <div className="detail-value">{paymentMethod}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Reference Code:</div>
          <div className="detail-value">
            {paymentDetails[paymentMethod].reference}
            <button className="copy-button" onClick={() => navigator.clipboard.writeText(paymentDetails[paymentMethod].reference)}>
              Copy
            </button>
          </div>
        </div>
      </div>
      
      <div className="payment-instructions">
        <h4>Payment Details</h4>
        {renderPaymentDetails()}
        
        <div className="important-note">
          <p>
            <strong>Important:</strong> Include the reference code in your payment description.
            This helps the seller identify your payment.
          </p>
        </div>
      </div>
      
      <div className="payment-confirmation">
        <h4>Confirm Your Payment</h4>
        <p>After sending the payment, please provide the following information:</p>
        
        <div className="form-group">
          <label htmlFor="paymentReference">Payment Reference/Transaction ID:</label>
          <input
            id="paymentReference"
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Enter the transaction ID or reference number"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="paymentProof">Upload Payment Proof (optional):</label>
          <input
            id="paymentProof"
            type="file"
            onChange={handleFileUpload}
            accept="image/*,.pdf"
          />
          <div className="file-upload-info">
            {paymentProof ? (
              <span className="file-name">{paymentProof.name}</span>
            ) : (
              <span className="file-instructions">Upload a screenshot or PDF of your payment confirmation</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="payment-status">
        {paymentStatus === 'completed' && (
          <div className="status-message success">
            <span className="icon">✓</span>
            <span className="message">Payment confirmed! Waiting for seller to release SOL.</span>
          </div>
        )}
        
        {paymentStatus === 'failed' && (
          <div className="status-message error">
            <span className="icon">✗</span>
            <span className="message">Payment confirmation failed. Please try again.</span>
          </div>
        )}
      </div>
      
      <div className="step-actions">
        <button className="secondary-button" onClick={onBack} disabled={isConfirming}>
          Back
        </button>
        <button 
          className="primary-button" 
          onClick={handleConfirmPayment}
          disabled={!paymentReference || isConfirming}
        >
          {isConfirming ? 'Confirming...' : 'I Have Made the Payment'}
        </button>
      </div>
    </div>
  );
};

export default BuyWorkflowPayment;
