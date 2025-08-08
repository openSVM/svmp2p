import React from 'react';
import PropTypes from 'prop-types';

/**
 * PropertyValueTable component displays data in a table format with property names and values
 */
const PropertyValueTable = ({ title, data, className = '', actions = null }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`property-value-table card ${className}`}>
        {title && (
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
        )}
        <div className="ascii-form-message no-data">
          <span className="message-icon">[!]</span>
          <span className="message-text">NO DATA AVAILABLE</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`property-value-table card ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      
      <div className="ascii-table">
        <div className="ascii-table-header">
          <div className="ascii-table-col property-col">PROPERTY</div>
          <div className="ascii-table-col value-col">VALUE</div>
        </div>
        
        {data.map((item, index) => (
          <div key={index} className={`ascii-table-row ${item.className || ''}`}>
            <div className="ascii-table-col property-col">
              <span className="property-name">{item.property}</span>
              {item.description && (
                <div className="property-description">{item.description}</div>
              )}
            </div>
            <div className="ascii-table-col value-col">
              <span className={`property-value ${item.valueClassName || ''}`}>
                {item.value}
              </span>
              {item.badge && (
                <span className={`property-badge ${item.badgeClassName || ''}`}>
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

PropertyValueTable.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      property: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
      description: PropTypes.string,
      className: PropTypes.string,
      valueClassName: PropTypes.string,
      badge: PropTypes.string,
      badgeClassName: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
  actions: PropTypes.node,
};

export default PropertyValueTable;