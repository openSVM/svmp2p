import React, { useState } from 'react';

/**
 * BuyWorkflowComplete component - Final step for the buy workflow
 */
const BuyWorkflowComplete = ({ transaction, onFinish }) => {
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  
  const handleSubmitRating = () => {
    // In a real implementation, this would submit the rating to the backend
    setIsRatingSubmitted(true);
    
    // After a short delay, call the onFinish callback
    setTimeout(() => {
      onFinish();
    }, 1500);
  };
  
  return (
    <div className="buy-workflow-complete">
      <div className="completion-header">
        <div className="success-icon">✓</div>
        <h3>Transaction Complete!</h3>
        <p>Your SOL has been successfully transferred to your wallet.</p>
      </div>
      
      <div className="transaction-summary">
        <h4>Transaction Summary</h4>
        
        <div className="detail-row">
          <div className="detail-label">Amount Received:</div>
          <div className="detail-value highlight">{transaction.solAmount.toFixed(6)} SOL</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Transaction Hash:</div>
          <div className="detail-value hash">
            {transaction.txHash}
            <button className="copy-button" onClick={() => navigator.clipboard.writeText(transaction.txHash)}>
              Copy
            </button>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Seller:</div>
          <div className="detail-value">
            {transaction.seller.substring(0, 4)}...{transaction.seller.substring(transaction.seller.length - 4)}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Date & Time:</div>
          <div className="detail-value">{new Date(transaction.timestamp).toLocaleString()}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Status:</div>
          <div className="detail-value status-complete">Complete</div>
        </div>
      </div>
      
      {!isRatingSubmitted ? (
        <div className="rate-experience">
          <h4>Rate Your Experience</h4>
          <p>Please take a moment to rate your experience with this seller.</p>
          
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                className={`star ${star <= rating ? 'filled' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
          
          <div className="form-group">
            <label htmlFor="feedback">Additional Feedback (Optional):</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with this seller..."
              rows={4}
            />
          </div>
          
          <button 
            className="primary-button" 
            onClick={handleSubmitRating}
          >
            Submit Rating
          </button>
        </div>
      ) : (
        <div className="rating-submitted">
          <div className="success-message">
            <span className="icon">✓</span>
            <span className="message">Thank you for your feedback!</span>
          </div>
        </div>
      )}
      
      <div className="next-steps">
        <h4>What's Next?</h4>
        <ul>
          <li>Your SOL is now available in your wallet</li>
          <li>You can view this transaction in your transaction history</li>
          <li>Need help? Contact our support team</li>
        </ul>
      </div>
      
      <div className="step-actions">
        <button className="secondary-button" onClick={onFinish}>
          Return to Dashboard
        </button>
        <button className="primary-button" onClick={() => window.location.href = '/offers/buy'}>
          Browse More Offers
        </button>
      </div>
    </div>
  );
};

export default BuyWorkflowComplete;
