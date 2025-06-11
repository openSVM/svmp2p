import React, { useState, useRef, useEffect } from 'react';

// Custom SVG Icon Component (replace with your actual SVG path data)
const DropdownIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path 
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14l-4-4h8l-4 4z" 
      fill="currentColor"
    />
  </svg>
);

const LanguageSelector = ({ 
  languages = [], // Default to empty array
  currentLocale = 'en', 
  onLanguageChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  // Ensure languages is always an array
  const safeLanguages = Array.isArray(languages) ? languages : [];

  // Find current language safely, provide a fallback default
  const currentLanguage = 
    safeLanguages.find(lang => lang.code === currentLocale) || 
    safeLanguages[0] || 
    { code: 'en', name: 'English', country: 'US' }; // Fallback default

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (triggerRef.current) {
      const buttonRect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 200; // Approximate dropdown width
      const dropdownHeight = Math.min(300, safeLanguages.length * 48 + 16); // Dynamic height based on options
      
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
          setFocusedIndex(0);
        } else if (safeLanguages.length > 0) {
          setFocusedIndex(prev => 
            prev < safeLanguages.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen && safeLanguages.length > 0) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : safeLanguages.length - 1
          );
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && safeLanguages[focusedIndex]) {
          handleLanguageSelect(safeLanguages[focusedIndex].code);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };
  
  // Handle language selection
  const handleLanguageSelect = (languageCode) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    triggerRef.current?.focus(); // Return focus to trigger button
  };
  
  // Handle trigger button click
  const handleTriggerClick = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  };
  
  return (
    <div className="language-selector relative inline-flex" ref={dropdownRef}>
      <button
        ref={triggerRef}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-all duration-200 ease-in-out min-w-[90px]"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        aria-label={`Current language: ${currentLanguage.name}. Click to change language`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="language-dropdown"
        role="combobox"
      >
        <span className="text-sm font-medium">
          {currentLanguage.country} {currentLanguage.code.toUpperCase()}
        </span>
        <DropdownIcon 
          className={`h-5 w-5 ml-1.5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div 
            id="language-dropdown"
            className="language-dropdown"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 99999,
              minWidth: '200px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div 
              className="py-1 max-h-60 overflow-auto"
              role="listbox"
              aria-label="Language options"
            >
              {/* Map over safeLanguages */} 
              {safeLanguages.map((language, index) => (
                <button
                  key={language.code}
                  ref={el => optionRefs.current[index] = el}
                  className={`language-option w-full flex items-center px-4 py-3 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150 ${
                    language.code === currentLocale 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-700'
                  } ${
                    focusedIndex === index ? 'bg-gray-100' : '' // Keep focus style separate
                  }`}
                  onClick={() => handleLanguageSelect(language.code)}
                  onKeyDown={handleKeyDown}
                  role="option"
                  aria-selected={language.code === currentLocale}
                  tabIndex={-1}
                >
                  <span className="font-medium">
                    {language.country}{language.code.toUpperCase()}
                  </span>
                  <span className="ml-3">{language.name}</span>
                  {language.code === currentLocale && (
                    <svg 
                      className="w-4 h-4 ml-auto text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default LanguageSelector;

