import React from 'react';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  mounted: boolean;
  small?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, mounted, small, className }) => (
  <header className={`fixed top-0 left-0 z-20 transition-all duration-300 bg-[#F7F8F9] dark:bg-[#18181C] h-16 ${small ? 'w-full max-w-[calc(100vw-440px)]' : 'w-full'} ${className || ''}`}>
    <div className="relative w-full">
      {/* Logo */}
      <div className={`fixed left-8 top-3 flex items-center gap-2 z-10 ${small ? 'h-8' : 'h-10'}`}>
        <div className={`${small ? 'w-7 h-7 text-base' : 'w-8 h-8 text-lg'} rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center font-semibold`}>
          C
        </div>
        <h1 className={`${small ? 'text-base' : 'text-lg'} font-medium text-[#23232B] dark:text-white`}>Cieden Асистент</h1>
      </div>
      {/* Theme Toggle */}
      <div className="absolute right-8 top-3">
        <button
          onClick={toggleTheme}
          className="p-2 text-[#6B7280] hover:text-[#23232B] dark:text-[#E5E7EB] dark:hover:text-white transition"
          title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
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

export default Header; 