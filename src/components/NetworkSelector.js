import React, { useState, useRef, useEffect } from 'react';

/**
 * NetworkSelector component for selecting between different SVM networks
 * Now using ASCII dropdown style matching ProfileDropdown
 * 
 * @param {Object} props - Component props
 * @param {Object} props.networks - Object containing network configurations
 * @param {string} props.selectedNetwork - Currently selected network key
 * @param {Function} props.onSelectNetwork - Callback function when network is selected
 * @returns {JSX.Element} NetworkSelector component
 */
export const NetworkSelector = ({ networks, selectedNetwork, onSelectNetwork }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const network = networks[selectedNetwork];
  
  const networkKeys = Object.keys(networks);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNetworkSelect = (networkKey) => {
    onSelectNetwork(networkKey);
    setIsOpen(false);
  };

  return (
    <div className="ascii-dropdown-container" ref={dropdownRef}>
      <button 
        className="ascii-header-control ascii-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current network: ${network.name}`}
      >
        <div 
          className="network-indicator"
          style={{ backgroundColor: network.color }}
        />
        {network.name} ▼
      </button>
      
      {isOpen && (
        <div className="ascii-dropdown-menu">
          {Object.entries(networks).map(([key, networkOption]) => (
            <button
              key={key}
              className={`ascii-dropdown-item ${key === selectedNetwork ? 'active' : ''}`}
              onClick={() => handleNetworkSelect(key)}
            >
              <div 
                className="network-indicator"
                style={{ backgroundColor: networkOption.color }}
              />
              {networkOption.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
