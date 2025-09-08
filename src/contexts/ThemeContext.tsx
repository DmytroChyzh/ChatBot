'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'cosmic';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'cosmic') => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'cosmic'>('cosmic');

  useEffect(() => {
    // Встановлюємо тему тільки після монтування на клієнті
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'cosmic' || 'cosmic';
    setThemeState(savedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Завжди встановлюємо космічну тему
      document.body.classList.add('cosmic');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'cosmic');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'cosmic';
      return 'light';
    });
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'cosmic') => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}; 