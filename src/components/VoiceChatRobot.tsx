'use client';

import React from 'react';

interface VoiceChatRobotProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
}

const VoiceChatRobot: React.FC<VoiceChatRobotProps> = ({
  isActive,
  isListening,
  isSpeaking,
  isProcessing
}) => {
  if (!isActive) return null;

  const getRobotState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    return 'idle';
  };

  const state = getRobotState();

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className={`
        relative w-24 h-24 rounded-full transition-all duration-500
        ${state === 'listening' ? 'animate-pulse scale-110' : ''}
        ${state === 'speaking' ? 'animate-bounce scale-105' : ''}
        ${state === 'processing' ? 'animate-spin' : ''}
        bg-gradient-to-br from-[#651FFF] via-[#8B5CF6] to-[#FF6B35]
        shadow-2xl
        before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent
        after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:to-black/20
      `}>
        {/* Robot Head */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/90 to-gray-100 shadow-inner">
          {/* Eyes */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
            <div className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${state === 'listening' ? 'bg-green-500 animate-ping' : ''}
              ${state === 'speaking' ? 'bg-blue-500 animate-pulse' : ''}
              ${state === 'processing' ? 'bg-yellow-500 animate-spin' : ''}
              ${state === 'idle' ? 'bg-gray-600' : ''}
            `} />
            <div className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${state === 'listening' ? 'bg-green-500 animate-ping' : ''}
              ${state === 'speaking' ? 'bg-blue-500 animate-pulse' : ''}
              ${state === 'processing' ? 'bg-yellow-500 animate-spin' : ''}
              ${state === 'idle' ? 'bg-gray-600' : ''}
            `} />
          </div>
          
          {/* Mouth */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <div className={`
              w-4 h-1 rounded-full transition-all duration-300
              ${state === 'speaking' ? 'bg-red-500 animate-pulse' : ''}
              ${state === 'listening' ? 'bg-green-500' : ''}
              ${state === 'processing' ? 'bg-yellow-500' : ''}
              ${state === 'idle' ? 'bg-gray-600' : ''}
            `} />
          </div>
        </div>

        {/* Antenna */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-4 bg-gradient-to-t from-[#651FFF] to-[#FF6B35] rounded-full">
            <div className={`
              w-2 h-2 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2
              ${state === 'listening' ? 'bg-green-400 animate-ping' : ''}
              ${state === 'speaking' ? 'bg-blue-400 animate-pulse' : ''}
              ${state === 'processing' ? 'bg-yellow-400 animate-spin' : ''}
              ${state === 'idle' ? 'bg-gray-500' : ''}
            `} />
          </div>
        </div>

        {/* Sound Waves */}
        {(state === 'listening' || state === 'speaking') && (
          <div className="absolute inset-0 -m-4">
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" style={{ animationDelay: '1s' }} />
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
            {state === 'listening' && 'Listening...'}
            {state === 'speaking' && 'Speaking...'}
            {state === 'processing' && 'Thinking...'}
            {state === 'idle' && 'Ready'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatRobot;
