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
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-6.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-6.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
        </svg>
        
        {/* Animated sound waves */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </button>
  );
};

export default VoiceChatButton;
