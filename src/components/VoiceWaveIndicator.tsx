'use client';

import React from 'react';

interface VoiceWaveIndicatorProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  audioLevel?: number;
}

const VoiceWaveIndicator: React.FC<VoiceWaveIndicatorProps> = ({
  isActive,
  isListening,
  isSpeaking,
  isProcessing,
  audioLevel = 0
}) => {
  if (!isActive) return null;

  const getStatusText = () => {
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    if (isProcessing) return 'Processing...';
    return 'Voice Chat Active';
  };

  const getStatusColor = () => {
    if (isListening) return 'text-[#651FFF]';
    if (isSpeaking) return 'text-[#FF6B35]';
    if (isProcessing) return 'text-[#651FFF]';
    return 'text-[#651FFF]';
  };

  return (
    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-white/10">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${isListening ? 'bg-green-500 animate-ping' : ''}
            ${isSpeaking ? 'bg-blue-500 animate-pulse' : ''}
            ${isProcessing ? 'bg-yellow-500 animate-spin' : ''}
            ${!isListening && !isSpeaking && !isProcessing ? 'bg-purple-500' : ''}
          `} />
          
          {/* Status Text */}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Voice Waves */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`
                  w-1 bg-gradient-to-t from-[#651FFF] to-[#FF6B35] rounded-full
                  transition-all duration-150
                  ${isListening ? 'animate-pulse' : ''}
                  ${isSpeaking ? 'animate-bounce' : ''}
                `}
                style={{
                  height: `${8 + (audioLevel * 20) + Math.sin(Date.now() / 100 + i) * 4}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceWaveIndicator;
