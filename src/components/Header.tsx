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
  onStartOver?: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, mounted, small, className, onClearSession, onStartOver }) => {
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
  <header className={`fixed top-0 left-0 z-20 transition-all duration-300 bg-[hsl(var(--header-bg))] backdrop-blur-md bg-opacity-80 h-24 ${small ? 'w-full max-w-[calc(100vw-440px)]' : 'w-full'} ${className || ''} ${theme === 'dark' ? 'header-dark' : ''} ${theme === 'cosmic' ? 'header-cosmic' : ''}`}>
    <div className="relative w-full">
      {/* Logo */}
      
      {/* Header Content */}
      <div className="absolute left-4 lg:left-16 right-4 lg:right-16 top-12 flex items-center justify-between">
        <Image
          src={theme === 'dark' || theme === 'cosmic' ? '/images/logoWhite.svg' : '/images/logoDark.svg'}
          alt="Cieden Logo"
          width={96}
          height={96}
          className="object-contain w-16 h-16 lg:w-24 lg:h-24"
          priority
        />
        <div className="flex items-center gap-2 lg:gap-3">
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
        

        
        {onStartOver && (
          <button
            onClick={onStartOver}
            className="px-2 lg:px-3 py-1 text-xs lg:text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1 lg:gap-2"
            title={t('header.startOver')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lg:w-4 lg:h-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="hidden sm:inline">{t('header.startOver')}</span>
            <span className="sm:hidden">Start</span>
          </button>
        )}
        
        {onClearSession && (
          <button
            onClick={onClearSession}
            className="p-1.5 lg:p-2 text-muted-foreground hover:text-foreground transition"
            title={t('header.clearSession')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lg:w-[18px] lg:h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 7h16" />
            </svg>
          </button>
        )}
        {/* Кнопка перемикача теми прибрана - залишаємо тільки космічну тему */}
        </div>
      </div>
    </div>
  </header>
  );
};

export default Header; 