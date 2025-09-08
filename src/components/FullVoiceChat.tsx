'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FullVoiceChatProps {
  disabled?: boolean;
  className?: string;
  onSendMessage?: (message: string) => void;
}

const FullVoiceChat: React.FC<FullVoiceChatProps> = ({ 
  disabled = false,
  className = "",
  onSendMessage
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Перевіряємо підтримку браузера
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasSynthesis = 'speechSynthesis' in window;
      
      console.log('Full voice chat support check:', { hasRecognition, hasSynthesis });
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
        console.log('Full voice chat recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Full voice chat recognized:', transcript);
        setTranscript(transcript);
        
        // Автоматично відправляємо повідомлення
        if (transcript.trim() && onSendMessage) {
          setIsProcessing(true);
          onSendMessage(transcript.trim());
          
          // Озвучуємо підтвердження
          speakResponse(`Відправляю: ${transcript}`);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Full voice chat recognition error:', event.error);
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
        console.log('Full voice chat recognition ended');
        setIsListening(false);
        setIsProcessing(false);
      };

      // Ініціалізуємо синтез мови
      synthesisRef.current = window.speechSynthesis;
      
    } catch (error) {
      console.error('Full voice chat initialization error:', error);
      setError('Помилка ініціалізації голосових функцій');
    }
  };

  const startListening = () => {
    if (!isSupported) {
      setError('Голосові функції не підтримуються в цьому браузері');
      return;
    }
    
    if (disabled || isProcessing) {
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
      console.error('Error starting full voice chat:', error);
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
        disabled={disabled || isListening || isProcessing}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : isProcessing
            ? 'bg-yellow-500 text-white animate-pulse'
            : 'bg-green-500 hover:bg-green-600 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isListening
            ? 'Слухаю...'
            : isProcessing
            ? 'Обробляю...'
            : 'Повний голосовий чат (Web Speech API)'
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
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg z-50 max-w-xs">
          Розпізнано: {transcript}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
        </div>
      )}
    </div>
  );
};

export default FullVoiceChat;
