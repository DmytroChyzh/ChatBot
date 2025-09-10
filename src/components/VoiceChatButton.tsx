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
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
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
