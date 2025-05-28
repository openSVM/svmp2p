import React, { useState, useRef, useEffect } from 'react';

const LanguageSelector = ({ currentLocale = 'en', onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (languageCode) => {
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
  };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="language-country">{currentLanguage.country}</span>
        <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
        <svg 
          className={`language-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
          fill="none"
        >
          <path 
            d="M3 4.5L6 7.5L9 4.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="language-list">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`language-option ${language.code === currentLocale ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(language.code)}
              >
                <span className="language-country">{language.country}</span>
                <span className="language-name">{language.name}</span>
                {language.code === currentLocale && (
                  <svg 
                    className="language-check"
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path 
                      d="M13.5 4.5L6 12L2.5 8.5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
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