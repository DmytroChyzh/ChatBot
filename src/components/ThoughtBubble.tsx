'use client';

import React from 'react';

interface ThoughtBubbleProps {
  isVisible: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
}

const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({
  isVisible,
  isThinking,
  isSpeaking
}) => {
  if (!isVisible) return null;

  const getBubbleContent = () => {
    if (isThinking) {
      return {
        icon: "🤔",
        text: "Thinking...",
        color: "text-white",
        bgColor: "bg-gradient-to-r from-purple-500 to-blue-500",
        borderColor: "border-purple-500"
      };
    }
    
    if (isSpeaking) {
      return {
        icon: "💬",
        text: "Speaking...",
        color: "text-white",
        bgColor: "bg-gradient-to-r from-purple-500 to-blue-500",
        borderColor: "border-purple-500"
      };
    }
    
    return null;
  };

  const content = getBubbleContent();
  if (!content) return null;

  return (
    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
      {/* Thought bubble */}
      <div className={`
        relative px-4 py-2 rounded-2xl border-2 shadow-lg
        ${content.bgColor} ${content.borderColor}
        animate-in fade-in slide-in-from-bottom-2 duration-300
      `}>
        {/* Bubble content */}
        <div className="flex items-center gap-2">
          <div className="text-lg animate-pulse">
            {content.icon}
          </div>
          <div className={`font-medium text-sm ${content.color}`}>
            {content.text}
          </div>
        </div>
        
        {/* Animated dots */}
        <div className="flex gap-1 mt-1 justify-center">
          <div className="w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>
        
        {/* Bubble tail */}
        <div className={`
          absolute top-full left-1/2 transform -translate-x-1/2
          w-0 h-0 border-l-8 border-r-8 border-t-8
          border-l-transparent border-r-transparent
          ${content.borderColor.replace('border-', 'border-t-')}
        `}></div>
        
        {/* Inner tail */}
        <div className={`
          absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5
          w-0 h-0 border-l-6 border-r-6 border-t-6
          border-l-transparent border-r-transparent
          ${content.bgColor.replace('bg-', 'border-t-')}
        `}></div>
      </div>
    </div>
  );
};

export default ThoughtBubble;
