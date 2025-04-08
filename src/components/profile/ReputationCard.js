import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ReputationCard component displays the user's reputation metrics and score
 */
const ReputationCard = ({ reputation }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate overall reputation score (0-100)
  const calculateReputationScore = (rep) => {
    if (!rep) return 0;
    
    const {
      successfulTrades = 0,
      disputedTrades = 0,
      disputesWon = 0,
      totalTrades = 0,
      completionRate = 0,
      averageRating = 0,
    } = rep;
    
    // Weighted calculation
    const tradeWeight = 0.4;
    const disputeWeight = 0.3;
    const ratingWeight = 0.3;
    
    // Trade success factor (0-1)
    const tradeFactor = totalTrades > 0 ? 
      (successfulTrades / totalTrades) : 0;
    
    // Dispute resolution factor (0-1)
    const disputeFactor = disputedTrades > 0 ? 
      (disputesWon / disputedTrades) : 1;
    
    // Rating factor (0-1)
    const ratingFactor = averageRating / 5;
    
    // Calculate weighted score
    const score = (
      (tradeFactor * tradeWeight) +
      (disputeFactor * disputeWeight) +
      (ratingFactor * ratingWeight)
    ) * 100;
    
    return Math.round(score);
  };
  
  // Get reputation level based on score
  const getReputationLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Moderate';
    if (score >= 40) return 'Developing';
    if (score >= 30) return 'Basic';
    return 'New User';
  };
  
  // Generate star rating display
  const getStarRating = (score) => {
    const starCount = Math.round(score / 20); // 0-5 stars
    
    return (
      <div className="star-rating" aria-label={`${starCount} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <span 
            key={i} 
            className={`star ${i < starCount ? 'star-filled' : 'star-empty'}`}
            aria-hidden="true"
          >
            {i < starCount ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };
  
  const score = calculateReputationScore(reputation);
  const level = getReputationLevel(score);
  
  return (
    <div className="reputation-card card">
      <div className="reputation-card-header">
        <h3 className="reputation-card-title">Reputation</h3>
        <button 
          className="button button-ghost button-sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      <div className="reputation-score-container">
        <div className="reputation-score-circle">
          <svg viewBox="0 0 36 36" className="reputation-score-chart">
            <path
              className="reputation-score-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="reputation-score-fill"
              strokeDasharray={`${score}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" className="reputation-score-text">
              {score}
            </text>
          </svg>
        </div>
        
        <div className="reputation-score-info">
          <div className="reputation-level">{level}</div>
          {getStarRating(score)}
          <div className="reputation-last-updated">
            Last updated: {reputation?.lastUpdated || 'Never'}
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="reputation-details">
          <div className="reputation-metrics">
            <div className="reputation-metric">
              <div className="reputation-metric-label">Completion Rate</div>
              <div className="reputation-metric-value">
                {reputation?.completionRate || 0}%
              </div>
            </div>
            
            <div className="reputation-metric">
              <div className="reputation-metric-label">Avg. Rating</div>
              <div className="reputation-metric-value">
                {reputation?.averageRating?.toFixed(1) || '0.0'}/5.0
              </div>
            </div>
            
            <div className="reputation-metric">
              <div className="reputation-metric-label">Response Time</div>
              <div className="reputation-metric-value">
                {reputation?.averageResponseTime || 'N/A'}
              </div>
            </div>
            
            <div className="reputation-metric">
              <div className="reputation-metric-label">Dispute Rate</div>
              <div className="reputation-metric-value">
                {reputation?.disputeRate || 0}%
              </div>
            </div>
          </div>
          
          <div className="reputation-explanation">
            <h4>How is reputation calculated?</h4>
            <p>
              Your reputation score is based on your trading history, dispute resolution success,
              and ratings from other users. Maintain a high completion rate and positive
              interactions to improve your score.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

ReputationCard.propTypes = {
  reputation: PropTypes.shape({
    successfulTrades: PropTypes.number,
    disputedTrades: PropTypes.number,
    disputesWon: PropTypes.number,
    totalTrades: PropTypes.number,
    completionRate: PropTypes.number,
    averageRating: PropTypes.number,
    averageResponseTime: PropTypes.string,
    disputeRate: PropTypes.number,
    lastUpdated: PropTypes.string,
  }),
};

ReputationCard.defaultProps = {
  reputation: {
    successfulTrades: 0,
    disputedTrades: 0,
    disputesWon: 0,
    totalTrades: 0,
    completionRate: 0,
    averageRating: 0,
    averageResponseTime: 'N/A',
    disputeRate: 0,
    lastUpdated: 'Never',
  },
};

export default ReputationCard;
