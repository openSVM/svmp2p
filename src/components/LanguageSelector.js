import React, { useState, useRef, useEffect } from 'react';

const LanguageSelector = ({ currentLocale = 'en', onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  const languages = [
    { code: 'en', name: 'English', country: 'US' },
    { code: 'es', name: 'Español', country: 'ES' },
    { code: 'fr', name: 'Français', country: 'FR' },
    { code: 'de', name: 'Deutsch', country: 'DE' },
    { code: 'ja', name: '日本語', country: 'JP' },
    { code: 'ko', name: '한국어', country: 'KR' },
    { code: 'zh', name: '中文', country: 'CN' },
    { code: 'pt', name: 'Português', country: 'PT' },
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

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

  useEffect(() => {
    // Focus management for keyboard navigation
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex, isOpen]);

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < languages.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : languages.length - 1
          );
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          handleLanguageSelect(languages[focusedIndex].code);
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

  const handleLanguageSelect = (languageCode) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    // Return focus to trigger button
    triggerRef.current?.focus();
  };

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  };

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        ref={triggerRef}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 min-w-[80px] h-8 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 ease-in-out"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        aria-label={`Current language: ${currentLanguage.name}. Click to change language`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="language-dropdown"
        role="combobox"
      >
        <span className="mr-2 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {currentLanguage.country} {currentLanguage.code.toUpperCase()}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          id="language-dropdown"
          className="absolute top-full right-0 z-50 mt-1 min-w-[200px] bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
        >
          <div 
            className="py-1 max-h-60 overflow-auto"
            role="listbox"
            aria-label="Language options"
          >
            {languages.map((language, index) => (
              <button
                key={language.code}
                ref={el => optionRefs.current[index] = el}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ${
                  language.code === currentLocale 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700'
                } ${
                  focusedIndex === index ? 'bg-gray-50' : ''
                }`}
                onClick={() => handleLanguageSelect(language.code)}
                onKeyDown={handleKeyDown}
                role="option"
                aria-selected={language.code === currentLocale}
                tabIndex={-1}
              >
                <div className="flex items-center">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-3">
                    {language.country}
                  </span>
                  <span className="font-medium">{language.name}</span>
                </div>
                {language.code === currentLocale && (
                  <svg 
                    className="w-4 h-4 text-blue-600"
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
      )}
    </div>
  );
};

export default LanguageSelector;