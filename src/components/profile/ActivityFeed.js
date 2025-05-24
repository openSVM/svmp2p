import React from 'react';
import PropTypes from 'prop-types';

/**
 * ActivityFeed component displays the user's recent activity
 */
const ActivityFeed = ({ activities }) => {
  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityTime.toLocaleDateString();
    }
  };
  
  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'trade':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M8 5v14l11-7z" />
          </svg>
        );
      case 'offer':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        );
      case 'dispute':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      case 'rating':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      case 'system':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="activity-feed card">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
      </div>
      
      {activities.length === 0 ? (
        <div className="no-activities">
          No recent activity to display.
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
            <div key={activity.id} className={`activity-item activity-${activity.type}`}>
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="activity-content">
                <div className="activity-message">
                  {activity.message}
                </div>
                
                <div className="activity-meta">
                  <span className="activity-time">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                  
                  {activity.relatedId && (
                    <span className="activity-id">
                      ID: {activity.relatedId}
                    </span>
                  )}
                </div>
              </div>
              
              {activity.actionable && (
                <div className="activity-action">
                  <button 
                    className="button button-sm button-outline"
                    onClick={() => window.location.href = activity.actionLink}
                  >
                    {activity.actionText}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {activities.length > 0 && (
        <div className="activity-feed-footer">
          <button className="button button-ghost button-sm">
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['trade', 'offer', 'dispute', 'rating', 'system', 'other']).isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      relatedId: PropTypes.string,
      actionable: PropTypes.bool,
      actionText: PropTypes.string,
      actionLink: PropTypes.string,
    })
  ),
};

ActivityFeed.defaultProps = {
  activities: [],
};

export default ActivityFeed;
