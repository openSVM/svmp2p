import React from 'react';

/**
 * NetworkSelector component for selecting between different SVM networks
 * 
 * @param {Object} props - Component props
 * @param {Object} props.networks - Object containing network configurations
 * @param {string} props.selectedNetwork - Currently selected network key
 * @param {Function} props.onSelectNetwork - Callback function when network is selected
 * @returns {JSX.Element} NetworkSelector component
 */
export const NetworkSelector = ({ networks, selectedNetwork, onSelectNetwork }) => {
  return (
    <div className="network-selector">
      <label htmlFor="network-select">Network:</label>
      <select 
        id="network-select"
        value={selectedNetwork}
        onChange={(e) => onSelectNetwork(e.target.value)}
        className="network-select"
      >
        {Object.entries(networks).map(([key, network]) => (
          <option key={key} value={key}>
            {network.name}
          </option>
        ))}
      </select>
      
      {/* Display selected network info */}
      <div className="selected-network-info">
        <div 
          className="network-icon" 
          style={{ 
            backgroundColor: networks[selectedNetwork].color,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            display: 'inline-block',
            marginRight: '5px'
          }} 
        />
        <span>{networks[selectedNetwork].name}</span>
      </div>
    </div>
  );
};
