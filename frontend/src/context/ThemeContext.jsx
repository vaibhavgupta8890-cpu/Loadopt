import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEME_OPTIONS = [
  { id: 'grid', label: 'Logistics Grid', className: 'bg-logistics-grid', description: 'Technical freight grid with ambient glow' },
  { id: 'clean', label: 'Clean Studio', className: 'bg-clean-studio', description: 'Crisp minimal executive slate' },
  { id: 'soft-blue', label: 'Azure Tint', className: 'bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/40', description: 'Luminous sky blue logistics ambience' },
  { id: 'slate', label: 'Cool Grey', className: 'bg-slate-100/90', description: 'Classic neutral operational surface' },
];

export const ThemeProvider = ({ children }) => {
  const [backgroundTheme, setBackgroundTheme] = useState(() => {
    return localStorage.getItem('loadopt_bg_theme') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('loadopt_bg_theme', backgroundTheme);
  }, [backgroundTheme]);

  const currentTheme = THEME_OPTIONS.find((t) => t.id === backgroundTheme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        backgroundTheme,
        setBackgroundTheme,
        currentTheme,
        themeClass: currentTheme.className,
        themeOptions: THEME_OPTIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
