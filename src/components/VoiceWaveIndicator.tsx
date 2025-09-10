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
            <div className="flex items-center gap-0.5">
              <div className="w-0.5 h-3 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-0.5 h-4 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-0.5 h-5 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-0.5 h-4 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-0.5 h-3 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ),
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20'
        };
      case 'speaking':
        return {
          icon: (
            <div className="flex items-center gap-0.5">
              <div className="w-0.5 h-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-0.5 h-3 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-0.5 h-4 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-0.5 h-3 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-0.5 h-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-wave-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
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
