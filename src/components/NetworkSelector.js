import React, { useState, useRef, useEffect } from 'react';

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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);
  const network = networks[selectedNetwork];
  
  const networkKeys = Object.keys(networks);
  
  // Custom SVG icon component based on provided SVG file
  const DropdownIcon = ({ className }) => (
    <svg 
      className={className}
      width="24" 
      height="24" 
      viewBox="0 0 900 762" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform="translate(0.000000,762.000000) scale(0.100000,-0.100000)">
        <path d="M4185 6864 c-207 -16 -356 -44 -640 -119 -59 -16 -187 -60 -230 -80 -16 -7 -55 -23 -85 -35 -67 -26 -277 -132 -331 -166 -21 -13 -41 -24 -45 -24 -3 0 -23 -13 -44 -30 -21 -16 -40 -30 -44 -30 -3 0 -25 -14 -48 -30 -24 -17 -54 -38 -68 -47 -135 -90 -407 -342 -536 -495 -98 -117 -264 -346 -264 -365 0 -3 -6 -14 -14 -22 -59 -69 -232 -440 -290 -625 -36 -114 -53 -176 -71 -256 -9 -41 -21 -95 -27 -120 -28 -127 -48 -353 -48 -564 0 -296 20 -466 87 -731 14 -55 29 -116 33 -135 12 -50 58 -180 75 -212 8 -14 15 -33 15 -42 0 -8 9 -32 19 -53 11 -21 31 -65 46 -98 14 -33 32 -71 39 -85 68 -130 155 -275 198 -331 15 -20 28 -40 28 -43 0 -9 90 -125 179 -231 134 -158 325 -338 491 -461 65 -49 210 -147 230 -157 8 -4 38 -21 65 -37 162 -97 425 -213 615 -270 144 -43 166 -49 393 -95 250 -50 756 -51 1002 0 39 8 106 21 150 30 76 15 155 35 220 57 17 5 64 20 106 33 42 13 85 28 95 33 11 6 60 27 109 47 183 76 300 138 486 261 295 194 540 425 760 719 77 102 139 192 139 201 0 2 12 23 27 47 52 80 138 246 180 347 68 162 93 229 93 247 0 11 4 23 9 28 12 13 57 184 95 365 52 249 64 676 27 955 -12 83 -25 168 -30 190 -5 22 -19 81 -31 130 -35 151 -115 400 -149 463 -6 9 -24 49 -41 87 -35 79 -32 72 -90 180 -224 413 -554 779 -945 1048 -93 64 -120 81 -145 93 -8 4 -33 19 -55 33 -98 61 -364 184 -490 226 -39 13 -81 28 -95 33 -78 32 -354 94 -520 117 -110 16 -521 28 -635 19z m500 -225 c39 -5 102 -14 140 -19 445 -60 913 -257 1285 -540 119 -91 147 -115 295 -265 301 -303 490 -600 650 -1025 19 -51 72 -230 79 -265 3 -16 14 -71 25 -122 59 -269 76 -637 41 -860 -6 -37 -18 -111 -26 -163 -8 -52 -21 -120 -28 -150 -8 -30 -18 -73 -24 -95 -20 -82 -92 -296 -121 -359 -180 -396 -348 -642 -626 -919 -104 -103 -348 -307 -368 -307 -2 0 -35 -20 -73 -45 -37 -25 -74 -45 -82 -45 -8 0 -26 -6 -40 -14 -120 -65 -422 -65 -727 -1 -337 70 -409 79 -670 79 -192 0 -268 -3 -330 -16 -44 -9 -123 -24 -175 -33 -52 -9 -126 -23 -165 -31 -177 -35 -260 -44 -410 -44 -254 0 -318 22 -575 197 -73 50 -260 216 -365 325 -99 102 -260 299 -312 383 -123 196 -206 356 -275 535 -54 137 -108 307 -108 337 0 12 -5 34 -11 50 -12 32 -41 204 -60 353 -16 128 -16 411 0 540 18 145 52 343 62 362 5 9 9 26 9 38 0 36 92 323 131 409 119 261 256 494 385 653 33 40 70 86 83 103 52 63 272 275 367 351 159 128 336 239 519 328 55 27 108 53 118 58 9 4 43 18 75 29 31 11 71 27 87 34 30 14 186 61 280 85 96 24 207 43 405 70 84 11 456 11 535 -1z"/>
        <path d="M4837 4045 c-233 -234 -431 -425 -439 -425 -8 0 -196 182 -419 405 -222 223 -411 405 -420 405 -16 0 -159 -141 -159 -157 0 -14 978 -987 995 -991 19 -4 1034 1006 1035 1028 0 18 -139 160 -157 160 -6 0 -202 -191 -436 -425z"/>
      </g>
    </svg>
  );
  
  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 200; // Approximate dropdown width
      const dropdownHeight = 300; // Max dropdown height
      
      let top = buttonRect.bottom + 4;
      let left = buttonRect.right - dropdownWidth;
      
      // Adjust if dropdown would go off screen
      if (left < 8) {
        left = buttonRect.left;
      }
      
      if (top + dropdownHeight > window.innerHeight - 8) {
        top = buttonRect.top - dropdownHeight - 4;
      }
      
      setDropdownPosition({ top, left });
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex].focus();
    }
  }, [isOpen, focusedIndex]);
  
  // Update position when opening dropdown
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
      window.addEventListener('resize', calculateDropdownPosition);
      window.addEventListener('scroll', calculateDropdownPosition);
      
      return () => {
        window.removeEventListener('resize', calculateDropdownPosition);
        window.removeEventListener('scroll', calculateDropdownPosition);
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          calculateDropdownPosition();
          setFocusedIndex(0);
        } else if (networkKeys.length > 0) {
          setFocusedIndex(prev => 
            prev < networkKeys.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen && networkKeys.length > 0) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : networkKeys.length - 1
          );
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          calculateDropdownPosition();
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && networkKeys[focusedIndex]) {
          handleNetworkSelect(networkKeys[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const handleNetworkSelect = (networkKey) => {
    onSelectNetwork(networkKey);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus(); // Return focus to trigger button
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="network-selector" ref={dropdownRef}>
      <button 
        ref={buttonRef}
        className="network-selector-button"
        onClick={handleToggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current network: ${network.name}. Press Enter or Space to open network options`}
      >
        <div 
          className="w-3 h-3 rounded-full mr-1.5"
          style={{ backgroundColor: network.color }}
        />
        <span>{network.name}</span>
        <DropdownIcon 
          className={`h-4 w-4 ml-1.5 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div 
            className="network-selector-dropdown" 
            role="listbox"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 99999
            }}
          >
            {Object.entries(networks).map(([key, network], index) => (
              <div 
                key={key}
                ref={el => optionRefs.current[index] = el}
                className={`network-option ${key === selectedNetwork ? 'active' : ''} ${
                  focusedIndex === index ? 'focused' : ''
                }`}
                onClick={() => handleNetworkSelect(key)}
                onKeyDown={handleKeyDown}
                role="option"
                aria-selected={key === selectedNetwork}
                tabIndex={-1}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-1.5"
                  style={{ backgroundColor: network.color }}
                />
                <span className="network-option-name">{network.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
