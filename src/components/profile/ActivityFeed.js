import React from 'react';
import PropTypes from 'prop-types';
import PropertyValueTable from '../common/PropertyValueTable';

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
      return 'JUST NOW';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} MINUTE${minutes > 1 ? 'S' : ''} AGO`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
    } else {
      return activityTime.toLocaleDateString().toUpperCase();
    }
  };
  
  // Get activity type icon as text
  const getActivityIcon = (type) => {
    switch (type) {
      case 'trade': return '[T]';
      case 'offer': return '[O]';
      case 'dispute': return '[D]';
      case 'rating': return '[R]';
      case 'system': return '[S]';
      default: return '[A]';
    }
  };

  // Prepare activity data for PropertyValueTable
  const activityData = activities.map((activity) => ({
    property: `${getActivityIcon(activity.type)} ${activity.type.toUpperCase()}`,
    value: (
      <div className="activity-summary">
        <div className="activity-message">{activity.message}</div>
        <div className="activity-meta">
          <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
          {activity.relatedId && (
            <span className="activity-id">ID: {activity.relatedId}</span>
          )}
          {activity.actionable && (
            <button 
              className="activity-action-btn"
              onClick={() => window.location.href = activity.actionLink}
            >
              {activity.actionText}
            </button>
          )}
        </div>
      </div>
    ),
    className: `activity-row activity-${activity.type}`,
    description: activity.actionable ? `Action available: ${activity.actionText}` : null,
  }));

  const activityActions = (
    <button className="button button-ghost button-sm">
      VIEW ALL ACTIVITY
    </button>
  );

  return (
    <div className="activity-feed">
      <PropertyValueTable
        title="Recent Activity"
        data={activityData}
        actions={activityActions}
        className="activity-table"
      />
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
