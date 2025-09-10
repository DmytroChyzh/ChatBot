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
      className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 select-none bg-gradient-to-r from-[#651FFF] to-[#FF6B35] hover:from-[#5A1AE6] hover:to-[#E55A2B] text-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title="Use voice mode"
    >
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
    </button>
  );
};

export default VoiceChatButton;
