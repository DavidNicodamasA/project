/**
 * White & Blue Theme Context & Provider
 * Path: src/context/ThemeContext.jsx
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Central Theme Tokens (White Backgrounds + Primary/Accent Blue Palette)
export const BLUE_THEME_TOKENS = {
  light: {
    name: 'light',
    bgPrimary: 'bg-white',
    bgSecondary: 'bg-blue-50/50',
    bgCard: 'bg-white',
    border: 'border-blue-100',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-blue-600/70',
    brandPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    brandSecondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    accent: 'bg-sky-500 text-white',
    ring: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    badge: 'bg-blue-100 text-blue-800',
  },
  dark: {
    name: 'dark',
    bgPrimary: 'bg-slate-950',
    bgSecondary: 'bg-slate-900',
    bgCard: 'bg-slate-900',
    border: 'border-slate-800',
    textPrimary: 'text-slate-50',
    textSecondary: 'text-slate-400',
    textMuted: 'text-blue-400',
    brandPrimary: 'bg-blue-600 hover:bg-blue-500 text-white',
    brandSecondary: 'bg-slate-800 text-blue-400 hover:bg-slate-700 border border-slate-700',
    accent: 'bg-sky-400 text-slate-950',
    ring: 'focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950',
    badge: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  },
};

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Initialize state with stored theme or default to 'light' (White & Blue)
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return savedTheme ? savedTheme : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('app_theme', themeMode);

    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const tokens = BLUE_THEME_TOKENS[themeMode] || BLUE_THEME_TOKENS.light;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark: themeMode === 'dark',
        tokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook for accessing ThemeContext
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;