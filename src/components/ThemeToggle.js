import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('system');
  const [actualTheme, setActualTheme] = useState('light');

  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (savedTheme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      // Also add to body for better coverage
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      setActualTheme('dark');
    } else if (selectedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      // Also add to body for better coverage
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      setActualTheme('light');
    } else { // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        setActualTheme('dark');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        setActualTheme('light');
      }
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const getThemeIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '🔄'; // system
  };

  const getNextTheme = () => {
    if (theme === 'light') return 'dark';
    if (theme === 'dark') return 'system';
    return 'light';
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'Auto';
  };

  return (
    <button
      className="theme-toggle"
      onClick={() => handleThemeChange(getNextTheme())}
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Theme: ${getThemeLabel()}. Click to switch to ${getNextTheme()}`}
    >
      <span className="theme-icon">{getThemeIcon()}</span>
    </button>
  );
};

export default ThemeToggle;