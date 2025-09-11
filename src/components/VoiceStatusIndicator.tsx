'use client';

import React from 'react';

interface VoiceStatusIndicatorProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
}

const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  isActive,
  isListening,
  isSpeaking,
  isProcessing
}) => {
  if (!isActive) return null;

  const getStatusInfo = () => {
    if (isListening) {
      return {
        icon: "🎤",
        text: "Speak now...",
        color: "text-green-500",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-300 dark:border-green-700"
      };
    }
    
    if (isSpeaking) {
      return {
        icon: "🔊",
        text: "AI is speaking...",
        color: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        borderColor: "border-blue-300 dark:border-blue-700"
      };
    }
    
    if (isProcessing) {
      return {
        icon: "🤔",
        text: "AI is thinking...",
        color: "text-yellow-500",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        borderColor: "border-yellow-300 dark:border-yellow-700"
      };
    }
    
    // No default state - if voice chat is active, it should always be in one of the active states
    return null;
  };

  const status = getStatusInfo();

  // Don't render anything if no active status
  if (!status) return null;

  return (
    <div className="w-full max-w-[900px] mx-auto mb-2">
      <div className={`
        flex items-center gap-3 px-4 py-2 rounded-2xl border-2
        ${status.bgColor} ${status.borderColor}
        transition-all duration-300 ease-in-out
        animate-in slide-in-from-top-2 fade-in
      `}>
        {/* Status Icon */}
        <div className="text-2xl animate-pulse">
          {status.icon}
        </div>
        
        {/* Status Text */}
        <div className={`font-medium ${status.color}`}>
          {status.text}
        </div>
        
        {/* Animated dots for active states */}
        {(isListening || isSpeaking || isProcessing) && (
          <div className="flex gap-1 ml-auto">
            <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceStatusIndicator;
