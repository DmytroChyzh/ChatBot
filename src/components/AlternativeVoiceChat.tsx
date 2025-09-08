'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AlternativeVoiceChatProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
}

const AlternativeVoiceChat: React.FC<AlternativeVoiceChatProps> = ({ 
  disabled = false,
  className = "",
  onTranscript
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Перевіряємо підтримку браузера
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasSynthesis = 'speechSynthesis' in window;
      
      console.log('Speech support check:', { hasRecognition, hasSynthesis });
      setIsSupported(hasRecognition && hasSynthesis);
      
      if (hasRecognition && hasSynthesis) {
        initializeSpeech();
      }
    };
    
    checkSupport();
  }, [language]);

  const initializeSpeech = () => {
    try {
      // Ініціалізуємо розпізнавання мови
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'uk' ? 'uk-UA' : 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        setTranscript(transcript);
        
        // Передаємо розпізнаний текст в батьківський компонент
        if (transcript.trim() && onTranscript) {
          onTranscript(transcript);
          console.log('Transcript sent to parent:', transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'no-speech':
            setError('Не чути мови. Спробуйте ще раз.');
            break;
          case 'audio-capture':
            setError('Помилка доступу до мікрофона.');
            break;
          case 'not-allowed':
            setError('Дозвіл на мікрофон не надано.');
            break;
          default:
            setError(`Помилка розпізнавання: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      // Ініціалізуємо синтез мови
      synthesisRef.current = window.speechSynthesis;
      
    } catch (error) {
      console.error('Speech initialization error:', error);
      setError('Помилка ініціалізації голосових функцій');
    }
  };

  const startListening = () => {
    if (!isSupported) {
      setError('Голосові функції не підтримуються в цьому браузері');
      return;
    }
    
    if (disabled) {
      return;
    }
    
    if (!recognitionRef.current) {
      setError('Розпізнавання мови не ініціалізовано');
      return;
    }
    
    try {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Не вдалося запустити розпізнавання мови');
    }
  };

  const speakResponse = (text: string) => {
    if (!synthesisRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'uk' ? 'uk-UA' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    synthesisRef.current.speak(utterance);
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 cursor-not-allowed ${className}`}
        title="Голосові функції не підтримуються"
      >
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
        >
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={startListening}
        disabled={disabled || isListening}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isListening
            ? 'Слухаю...'
            : 'Альтернативний голосовий чат'
        }
      >
        {isListening ? (
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
          >
            <rect x="6" y="4" width="12" height="12" rx="2" ry="2"/>
            <line x1="12" y1="16" x2="12" y2="20"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
          </svg>
        ) : (
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
          >
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
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

      {/* Показуємо розпізнаний текст */}
      {transcript && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 max-w-xs">
          Розпізнано: {transcript}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
        </div>
      )}
    </div>
  );
};

export default AlternativeVoiceChat;
