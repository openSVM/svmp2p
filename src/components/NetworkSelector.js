import React, { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const network = networks[selectedNetwork];

  return (
    <div className="network-selector">
      <button 
        className="network-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div 
          className="w-3 h-3 rounded-full mr-1.5"
          style={{ backgroundColor: network.color }}
        />
        <span>{network.name}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 ml-1.5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="network-selector-dropdown" role="listbox">
          {Object.entries(networks).map(([key, network]) => (
            <div 
              key={key}
              className={`network-option ${key === selectedNetwork ? 'active' : ''}`}
              onClick={() => {
                onSelectNetwork(key);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={key === selectedNetwork}
            >
              <div 
                className="w-3 h-3 rounded-full mr-1.5"
                style={{ backgroundColor: network.color }}
              />
              <span className="network-option-name">{network.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
