import React, { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', country: 'US' },
  { code: 'es', name: 'Español', country: 'ES' },
  { code: 'fr', name: 'Français', country: 'FR' },
  { code: 'de', name: 'Deutsch', country: 'DE' },
  { code: 'it', name: 'Italiano', country: 'IT' },
  { code: 'pt', name: 'Português', country: 'PT' },
  { code: 'ru', name: 'Русский', country: 'RU' },
  { code: 'zh', name: '中文', country: 'CN' },
  { code: 'ja', name: '日本語', country: 'JP' },
  { code: 'ko', name: '한국어', country: 'KR' },
];

const LanguageSelector = ({ currentLocale = 'en', onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

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
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex].focus();
    }
  }, [isOpen, focusedIndex]);

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
        <DropdownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
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
