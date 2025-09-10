"use client";

import React from 'react';

interface VoiceWaveIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel?: number;
  className?: string;
}

const VoiceWaveIndicator: React.FC<VoiceWaveIndicatorProps> = ({
  isListening,
  isSpeaking,
  audioLevel = 0,
  className = ""
}) => {
  // Визначаємо стан
  const getState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    return 'listening'; // Default to listening when component is shown
  };

  const state = getState();

  // Отримуємо іконку та колір
  const getIconAndColor = () => {
    switch (state) {
      case 'listening':
        return {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4"/>
              <path d="M5.5 21a7.5 7.5 0 0 1 13 0"/>
            </svg>
          ),
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20'
        };
      case 'speaking':
        return {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="4"/>
              <circle cx="7.5" cy="16" r="1.5"/>
              <circle cx="16.5" cy="16" r="1.5"/>
              <path d="M12 2v4m-6 4V6m12 4V6"/>
            </svg>
          ),
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/20'
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  // Генеруємо хвилі
  const generateWaves = () => {
    const waves = [];
    const waveCount = 5;
    
    for (let i = 0; i < waveCount; i++) {
      const height = state === 'listening' ? 8 + Math.sin(Date.now() * 0.01 + i) * 4 :
                    state === 'speaking' ? 12 + Math.sin(Date.now() * 0.008 + i) * 6 : 8;
      
      waves.push(
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${color.replace('text-', 'bg-')}`}
          style={{
            height: `${height}px`,
            animationDelay: `${i * 0.1}s`,
            animation: 'wave-pulse 1.5s ease-in-out infinite'
          }}
        />
      );
    }
    return waves;
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${bgColor} ${className}`}>
      {/* Іконка */}
      <div className={`${color} flex-shrink-0`}>
        {icon}
      </div>
      
      {/* Хвилі */}
      <div className="flex items-center gap-1">
        {generateWaves()}
      </div>
      
      {/* Текст статусу */}
      <div className={`text-sm font-medium ${color}`}>
        {state === 'listening' && 'Ви говорите...'}
        {state === 'speaking' && 'Асистент відповідає...'}
      </div>
    </div>
  );
};

export default VoiceWaveIndicator;
