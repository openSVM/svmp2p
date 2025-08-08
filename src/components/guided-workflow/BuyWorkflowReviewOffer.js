import React, { useState } from 'react';

/**
 * BuyWorkflowReviewOffer component - Step for reviewing the selected offer in the buy workflow
 */
const BuyWorkflowReviewOffer = ({ selectedOffer, onConfirm, onBack }) => {
  const [isReviewed, setIsReviewed] = useState(false);
  
  const handleConfirm = () => {
    setIsReviewed(true);
    onConfirm();
  };
  
  // Calculate estimated fees and total cost
  const networkFee = 0.000005; // SOL
  const serviceFee = selectedOffer.solAmount * 0.01; // 1% service fee
  const totalSolCost = selectedOffer.solAmount + networkFee + serviceFee;
  const totalFiatCost = selectedOffer.fiatAmount;
  
  return (
    <div className="buy-workflow-review-offer">
      <div className="review-header">
        <h3>Review Your Selected Offer</h3>
        <p>Please carefully review the details of this offer before proceeding.</p>
      </div>
      
      <div className="offer-details">
        <div className="detail-row">
          <div className="detail-label">Seller:</div>
          <div className="detail-value">
            <span className="seller-name">
              {selectedOffer.seller.slice(0, 4)}...{selectedOffer.seller.slice(-4)}
            </span>
            <span className="seller-rating">★★★★☆ (32 trades)</span>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Amount:</div>
          <div className="detail-value">{selectedOffer.solAmount.toFixed(2)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Price per SOL:</div>
          <div className="detail-value">
            {(selectedOffer.fiatAmount / selectedOffer.solAmount).toFixed(2)} {selectedOffer.fiatCurrency}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Total Price:</div>
          <div className="detail-value highlight">
            {selectedOffer.fiatAmount.toFixed(2)} {selectedOffer.fiatCurrency}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Payment Method:</div>
          <div className="detail-value">{selectedOffer.paymentMethod}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Network Fee:</div>
          <div className="detail-value">{networkFee.toFixed(6)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Service Fee:</div>
          <div className="detail-value">{serviceFee.toFixed(6)} SOL (1%)</div>
        </div>
        
        <div className="detail-row total">
          <div className="detail-label">Total SOL Received:</div>
          <div className="detail-value highlight">
            {(selectedOffer.solAmount - serviceFee).toFixed(6)} SOL
          </div>
        </div>
      </div>
      
      <div className="payment-instructions">
        <h4>Payment Instructions</h4>
        <p>
          After confirming this offer, you will need to send payment using the specified payment method.
          The seller will provide their payment details in the next step.
        </p>
        <p>
          <strong>Important:</strong> Only use the payment method specified in this offer.
          Using a different payment method may result in transaction cancellation.
        </p>
      </div>
      
      <div className="escrow-information">
        <h4>Escrow Protection</h4>
        <p>
          This transaction is protected by a smart contract escrow on the Solana blockchain.
          The SOL will only be released to you after the seller confirms receipt of your payment.
        </p>
        <p>
          If any issues arise, you can open a dispute which will be resolved by our decentralized
          juror system.
        </p>
      </div>
      
      <div className="review-confirmation">
        <label className="checkbox-container">
          <input 
            type="checkbox" 
            checked={isReviewed} 
            onChange={() => setIsReviewed(!isReviewed)}
          />
          <span className="checkmark"></span>
          I have reviewed the offer details and agree to the terms
        </label>
      </div>
      
      <div className="step-actions">
        <button className="secondary-button" onClick={onBack}>
          Back to Offers
        </button>
        <button 
          className="primary-button" 
          onClick={handleConfirm}
          disabled={!isReviewed}
        >
          Confirm and Proceed
        </button>
      </div>
    </div>
  );
};

export default BuyWorkflowReviewOffer;
