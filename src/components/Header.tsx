import React, { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  mounted: boolean;
  small?: boolean;
  className?: string;
  onClearSession?: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, mounted, small, className, onClearSession }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);
  
  return (
  <header className={`fixed top-0 left-0 z-20 transition-all duration-300 bg-[hsl(var(--header-bg))] h-32 ${small ? 'w-full max-w-[calc(100vw-440px)]' : 'w-full'} ${className || ''}`}>
    <div className="relative w-full">
      {/* Logo */}
              <div className={`absolute left-16 top-8 flex items-center z-10`}>
          <h1 className={`${small ? 'text-base' : 'text-lg'} font-medium text-foreground`}>Асистент</h1>
        </div>
      {/* Theme Toggle */}
      <div className="absolute right-8 top-8 flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative language-dropdown">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <span className="text-muted-foreground">{t(`language.${language}`)}</span>
            <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[80px]">
              <button
                onClick={() => {
                  setLanguage('en');
                  setShowLanguageDropdown(false);
                }}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors ${
                  language === 'en' ? 'bg-accent text-accent-foreground' : 'text-foreground'
                }`}
              >
                {t('language.en')}
              </button>
              <button
                onClick={() => {
                  setLanguage('uk');
                  setShowLanguageDropdown(false);
                }}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors ${
                  language === 'uk' ? 'bg-accent text-accent-foreground' : 'text-foreground'
                }`}
              >
                {t('language.uk')}
              </button>
            </div>
          )}
        </div>
        
        {onClearSession && (
          <button
            onClick={onClearSession}
            className="p-2 text-muted-foreground hover:text-foreground transition"
            title={t('header.clearSession')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground transition"
          title={theme === 'dark' ? t('header.lightTheme') : t('header.darkTheme')}
        >
          {mounted ? (theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )) : null}
        </button>
      </div>
    </div>
  </header>
  );
};

export default Header; 