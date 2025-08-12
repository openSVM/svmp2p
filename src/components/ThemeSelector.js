import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const ThemeSelector = ({ 
  value, 
  onChange, 
  className = "app-dropdown-container"
}) => {
  const [selectedTheme, setSelectedTheme] = useState(value || 'blueprint');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Available themes - memoized to prevent recreating on each render
  const themes = useMemo(() => [
    { key: 'blueprint', label: 'BLUEPRINT', description: 'Enhanced technical drawing style' },
    { key: 'grayscale', label: 'GRAYSCALE', description: 'Monospace ASCII terminal style' },
    { key: 'corporate', label: 'CORPORATE', description: 'Clean blue professional design' },
    { key: 'retro', label: 'RETRO', description: '80s neon cyberpunk aesthetic' },
    { key: 'terminal', label: 'TERMINAL', description: 'Green on black hacker style' },
    { key: 'minimal', label: 'MINIMAL', description: 'Clean whitespace design' },
    { key: 'cyberpunk', label: 'CYBERPUNK', description: 'Dark futuristic interface' },
    { key: 'organic', label: 'ORGANIC', description: 'Earth tones natural design' },
    { key: 'high-contrast', label: 'HIGH CONTRAST', description: 'Accessibility black/white' },
    { key: 'pastel', label: 'PASTEL', description: 'Soft colors gentle design' },
  ], []);

  // Define applyTheme before any useEffect that uses it
  const applyTheme = useCallback((themeKey) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all existing theme classes
    themes.forEach(theme => {
      root.classList.remove(`theme-${theme.key}`);
      body.classList.remove(`theme-${theme.key}`);
    });
    
    // Add new theme class
    root.classList.add(`theme-${themeKey}`);
    body.classList.add(`theme-${themeKey}`);
    
    // Set theme attribute for CSS selectors
    root.setAttribute('data-theme', themeKey);
    body.setAttribute('data-theme', themeKey);
  }, [themes]);

  useEffect(() => {
    // Load saved theme from localStorage or use passed value
    const savedTheme = value || localStorage.getItem('theme') || 'blueprint';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, [applyTheme, value]);

  // Update when external value changes
  useEffect(() => {
    if (value && value !== selectedTheme) {
      setSelectedTheme(value);
      applyTheme(value);
    }
  }, [value, selectedTheme, applyTheme]);

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

  const handleThemeSelect = (themeKey) => {
    setSelectedTheme(themeKey);
    localStorage.setItem('theme', themeKey);
    applyTheme(themeKey);
    setIsOpen(false);
    
    // Call external onChange if provided
    if (onChange) {
      onChange(themeKey);
    }
  };

  const currentTheme = themes.find(theme => theme.key === selectedTheme);

  return (
    <div className={className} ref={dropdownRef}>
      <button 
        className="app-header-control app-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current theme: ${currentTheme?.label}`}
      >
        {currentTheme?.label} ▼
      </button>
      
      {isOpen && (
        <div className="app-dropdown-menu theme-selector-menu">
          {themes.map((theme) => (
            <button
              key={theme.key}
              className={`app-dropdown-item theme-option ${theme.key === selectedTheme ? 'active' : ''}`}
              onClick={() => handleThemeSelect(theme.key)}
            >
              <div className="theme-option-content">
                <span className="theme-name">{theme.label}</span>
                <span className="theme-description">{theme.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;