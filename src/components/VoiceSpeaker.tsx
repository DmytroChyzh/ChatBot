'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceSpeakerProps {
  text: string;
  disabled?: boolean;
  className?: string;
}

const VoiceSpeaker: React.FC<VoiceSpeakerProps> = ({ 
  text,
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Перевіряємо підтримку браузера
    const checkSupport = () => {
      const hasSynthesis = 'speechSynthesis' in window;
      console.log('VoiceSpeaker: Speech synthesis support:', hasSynthesis);
      setIsSupported(hasSynthesis);
      
      if (hasSynthesis) {
        synthesisRef.current = window.speechSynthesis;
        console.log('VoiceSpeaker: Speech synthesis initialized');
      }
    };
    
    checkSupport();
  }, []);

  const speakText = () => {
    if (!isSupported || !synthesisRef.current || !text.trim()) {
      setError('Озвучування не підтримується або текст порожній');
      return;
    }
    
    if (disabled) {
      return;
    }
    
    try {
      setError(null);
      console.log('Starting speech synthesis for text:', text.substring(0, 50) + '...');
      
      // Зупиняємо поточне озвучування
      if (isSpeaking) {
        synthesisRef.current.cancel();
        setIsSpeaking(false);
        return;
      }
      
      // Очищуємо попередні озвучування
      synthesisRef.current.cancel();
      
      // Створюємо нове озвучування
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'uk' ? 'uk-UA' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        console.log('Speech synthesis started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('Speech synthesis ended');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setError(`Помилка озвучування: ${event.error}`);
        setIsSpeaking(false);
      };
      
      utteranceRef.current = utterance;
      
      // Додаємо невелику затримку для стабільності
      setTimeout(() => {
        synthesisRef.current.speak(utterance);
      }, 100);
      
    } catch (error) {
      console.error('Error speaking text:', error);
      setError('Не вдалося озвучити текст');
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={speakText}
        disabled={disabled || !text.trim()}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          isSpeaking
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-green-500 hover:bg-green-600 text-white'
        } ${disabled || !text.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isSpeaking
            ? 'Зупинити озвучування'
            : 'Озвучити відповідь'
        }
      >
        {isSpeaking ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>

      {/* Показуємо помилку */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 max-w-xs">
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      )}
    </div>
  );
};

export default VoiceSpeaker;
