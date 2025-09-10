'use client';

import React from 'react';

interface VoiceChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#651FFF] to-[#FF6B35] hover:from-[#5A1AE6] hover:to-[#E55A2B] text-white rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        >
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
          <path d="M12 18v4"/>
          <path d="M8 22h8"/>
        </svg>
        
        {/* Animated sound waves */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="text-left">
        <div className="font-semibold text-lg">Використати голосовий режим</div>
        <div className="text-sm opacity-90">Розмова з Ceiden Assistant</div>
      </div>
    </button>
  );
};

export default VoiceChatButton;
