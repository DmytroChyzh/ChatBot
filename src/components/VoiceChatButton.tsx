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
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        
        {/* Animated sound waves */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </button>
  );
};

export default VoiceChatButton;
