'use client';

import React from 'react';

interface ContinueVoiceChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ContinueVoiceChatButton: React.FC<ContinueVoiceChatButtonProps> = ({
  onClick,
  disabled = false
}) => {
  return (
    <div className="w-full max-w-[900px] mx-auto mb-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border-2
          bg-gradient-to-r from-[#651FFF] to-[#FF6B35] hover:from-[#5A1AE6] hover:to-[#E55A2B]
          border-[#651FFF] dark:border-[#651FFF]
          text-white font-medium text-lg
          transition-all duration-300 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          animate-in slide-in-from-top-2 fade-in
        `}
      >
        {/* Microphone Icon */}
        <div className="text-2xl animate-pulse">
          🎤
        </div>
        
        {/* Button Text */}
        <div>
          Continue Voice Chat
        </div>
        
        {/* Arrow Icon */}
        <div className="text-xl">
          →
        </div>
      </button>
    </div>
  );
};

export default ContinueVoiceChatButton;
