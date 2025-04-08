import React, { useState } from 'react';

/**
 * SellWorkflowComplete component - Final step for the sell workflow
 */
const SellWorkflowComplete = ({ offerDetails, onFinish }) => {
  const [isListingActive, setIsListingActive] = useState(true);
  
  const handleDeactivateListing = () => {
    // In a real implementation, this would call the blockchain to deactivate the listing
    setIsListingActive(false);
  };
  
  return (
    <div className="sell-workflow-complete">
      <div className="completion-header">
        <div className="success-icon">✓</div>
        <h3>Offer Created Successfully!</h3>
        <p>Your offer has been created and is now visible to potential buyers.</p>
      </div>
      
      <div className="offer-summary">
        <h4>Offer Details</h4>
        
        <div className="detail-row">
          <div className="detail-label">Offer ID:</div>
          <div className="detail-value">{offerDetails.id}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">SOL Amount:</div>
          <div className="detail-value">{offerDetails.solAmount.toFixed(2)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Price:</div>
          <div className="detail-value">
            {offerDetails.fiatAmount.toFixed(2)} {offerDetails.fiatCurrency}
            <span className="price-per-sol">
              ({(offerDetails.fiatAmount / offerDetails.solAmount).toFixed(2)} {offerDetails.fiatCurrency}/SOL)
            </span>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Payment Method:</div>
          <div className="detail-value">{offerDetails.paymentMethod}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Status:</div>
          <div className={`detail-value status-${isListingActive ? 'active' : 'inactive'}`}>
            {isListingActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Created:</div>
          <div className="detail-value">{new Date(offerDetails.createdAt).toLocaleString()}</div>
        </div>
      </div>
      
      <div className="escrow-status">
        <h4>Escrow Status</h4>
        <p>
          Your SOL is now securely locked in the escrow smart contract. It will remain there until:
        </p>
        <ul>
          <li>A buyer completes the purchase and you confirm payment receipt</li>
          <li>You cancel the offer (which will return the SOL to your wallet)</li>
          <li>The offer expires (if you set an expiration date)</li>
        </ul>
      </div>
      
      <div className="next-steps">
        <h4>What's Next?</h4>
        <ol>
          <li>Wait for a buyer to accept your offer</li>
          <li>You'll receive a notification when someone initiates a purchase</li>
          <li>Confirm payment receipt once you've received the funds</li>
          <li>The SOL will be automatically released to the buyer</li>
        </ol>
      </div>
      
      <div className="listing-management">
        <h4>Manage Your Listing</h4>
        <p>You can deactivate your listing at any time if you no longer wish to sell.</p>
        
        {isListingActive ? (
          <button 
            className="secondary-button" 
            onClick={handleDeactivateListing}
          >
            Deactivate Listing
          </button>
        ) : (
          <div className="deactivated-message">
            <span className="icon">✓</span>
            <span className="message">Listing deactivated. Your SOL has been returned to your wallet.</span>
          </div>
        )}
      </div>
      
      <div className="step-actions">
        <button className="secondary-button" onClick={onFinish}>
          Return to Dashboard
        </button>
        <button className="primary-button" onClick={() => window.location.href = '/offers/sell/new'}>
          Create Another Offer
        </button>
      </div>
    </div>
  );
};

export default SellWorkflowComplete;
