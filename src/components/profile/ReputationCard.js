import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PropertyValueTable from '../common/PropertyValueTable';

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
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'VERY GOOD';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 50) return 'MODERATE';
    if (score >= 40) return 'DEVELOPING';
    if (score >= 30) return 'BASIC';
    return 'NEW USER';
  };
  
  // Generate star rating display
  const getStarRating = (score) => {
    const starCount = Math.round(score / 20); // 0-5 stars
    return `${'★'.repeat(starCount)}${'☆'.repeat(5 - starCount)}`;
  };
  
  const score = calculateReputationScore(reputation);
  const level = getReputationLevel(score);

  // Prepare reputation data for PropertyValueTable
  const reputationData = [
    { 
      property: 'REPUTATION SCORE', 
      value: `${score}/100`,
      badge: level,
      badgeClassName: `level-${level.toLowerCase().replace(/\s+/g, '-')}`,
      description: 'Overall reputation based on trading history and ratings'
    },
    { 
      property: 'STAR RATING', 
      value: getStarRating(score),
      valueClassName: 'star-rating'
    },
    { 
      property: 'COMPLETION RATE', 
      value: `${reputation?.completionRate || 0}%`,
      valueClassName: reputation?.completionRate >= 90 ? 'excellent' : reputation?.completionRate >= 80 ? 'good' : 'average'
    },
    { 
      property: 'AVERAGE RATING', 
      value: `${reputation?.averageRating?.toFixed(1) || '0.0'}/5.0`,
      valueClassName: reputation?.averageRating >= 4.5 ? 'excellent' : reputation?.averageRating >= 4.0 ? 'good' : 'average'
    },
    { 
      property: 'RESPONSE TIME', 
      value: reputation?.averageResponseTime || 'N/A',
      description: 'Average time to respond to trade requests'
    },
    { 
      property: 'DISPUTE RATE', 
      value: `${reputation?.disputeRate || 0}%`,
      valueClassName: reputation?.disputeRate <= 5 ? 'excellent' : reputation?.disputeRate <= 10 ? 'good' : 'warning',
      description: 'Percentage of trades that resulted in disputes'
    },
    { 
      property: 'LAST UPDATED', 
      value: reputation?.lastUpdated || 'Never',
      valueClassName: 'last-updated'
    },
  ];

  // Detailed metrics (shown when expanded)
  const detailedData = showDetails ? [
    { property: 'TOTAL TRADES', value: reputation?.totalTrades || 0 },
    { property: 'SUCCESSFUL TRADES', value: reputation?.successfulTrades || 0, badge: 'SUCCESS', badgeClassName: 'badge-success' },
    { property: 'DISPUTED TRADES', value: reputation?.disputedTrades || 0, badge: reputation?.disputedTrades > 0 ? 'DISPUTED' : null, badgeClassName: 'badge-warning' },
    { property: 'DISPUTES WON', value: reputation?.disputesWon || 0, description: 'Disputes resolved in your favor' },
    { property: 'CALCULATION METHOD', value: 'WEIGHTED FORMULA', description: '40% trade success + 30% dispute resolution + 30% user ratings' },
  ] : [];

  const reputationActions = (
    <button 
      className="button button-ghost button-sm"
      onClick={() => setShowDetails(!showDetails)}
    >
      {showDetails ? 'HIDE DETAILS' : 'SHOW DETAILS'}
    </button>
  );

  return (
    <div className="reputation-card">
      <PropertyValueTable
        title="Reputation Score"
        data={reputationData}
        actions={reputationActions}
        className="reputation-table"
      />
      
      {showDetails && (
        <PropertyValueTable
          title="Detailed Metrics"
          data={detailedData}
          className="reputation-details-table"
        />
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
