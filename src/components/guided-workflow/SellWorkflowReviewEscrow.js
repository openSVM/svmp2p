import React, { useState } from 'react';

/**
 * SellWorkflowReviewEscrow component - Step for reviewing escrow details in the sell workflow
 */
const SellWorkflowReviewEscrow = ({ offerDetails, onConfirm, onBack }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  
  // Calculate fees
  const networkFee = 0.000005; // SOL
  const serviceFee = offerDetails.solAmount * 0.01; // 1% service fee
  const totalSolLocked = offerDetails.solAmount + networkFee + serviceFee;
  
  const handleConfirm = () => {
    setIsConfirming(true);
    
    // Simulate blockchain interaction
    setTimeout(() => {
      setIsConfirming(false);
      onConfirm();
    }, 2000);
  };
  
  return (
    <div className="sell-workflow-review-escrow">
      <div className="review-header">
        <h3>Review Escrow Details</h3>
        <p>Please review the escrow details before proceeding.</p>
      </div>
      
      <div className="offer-summary">
        <h4>Offer Summary</h4>
        
        <div className="detail-row">
          <div className="detail-label">SOL Amount:</div>
          <div className="detail-value">{offerDetails.solAmount.toFixed(2)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Fiat Amount:</div>
          <div className="detail-value">
            {offerDetails.fiatAmount.toFixed(2)} {offerDetails.fiatCurrency}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Price per SOL:</div>
          <div className="detail-value">
            {(offerDetails.fiatAmount / offerDetails.solAmount).toFixed(2)} {offerDetails.fiatCurrency}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Payment Method:</div>
          <div className="detail-value">{offerDetails.paymentMethod}</div>
        </div>
      </div>
      
      <div className="escrow-details">
        <h4>Escrow Details</h4>
        
        <div className="detail-row">
          <div className="detail-label">SOL to Lock in Escrow:</div>
          <div className="detail-value">{offerDetails.solAmount.toFixed(6)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Network Fee:</div>
          <div className="detail-value">{networkFee.toFixed(6)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Service Fee (1%):</div>
          <div className="detail-value">{serviceFee.toFixed(6)} SOL</div>
        </div>
        
        <div className="detail-row total">
          <div className="detail-label">Total SOL Required:</div>
          <div className="detail-value highlight">{totalSolLocked.toFixed(6)} SOL</div>
        </div>
      </div>
      
      <div className="escrow-explanation">
        <h4>How Escrow Works</h4>
        <ol>
          <li>Your SOL will be locked in a secure smart contract</li>
          <li>When a buyer accepts your offer, they'll send you payment via your specified method</li>
          <li>After confirming receipt of payment, you'll release the SOL from escrow to the buyer</li>
          <li>If there's a dispute, our decentralized juror system will help resolve it</li>
        </ol>
      </div>
      
      <div className="terms-agreement">
        <label className="checkbox-container">
          <input 
            type="checkbox" 
            checked={isAgreed} 
            onChange={() => setIsAgreed(!isAgreed)}
          />
          <span className="checkmark"></span>
          I understand that my SOL will be locked in escrow until the trade is completed
        </label>
      </div>
      
      <div className="step-actions">
        <button 
          className="secondary-button" 
          onClick={onBack}
          disabled={isConfirming}
        >
          Back
        </button>
        <button 
          className="primary-button" 
          onClick={handleConfirm}
          disabled={!isAgreed || isConfirming}
        >
          {isConfirming ? 'Creating Escrow...' : 'Confirm and Create Escrow'}
        </button>
      </div>
    </div>
  );
};

export default SellWorkflowReviewEscrow;
