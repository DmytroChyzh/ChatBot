import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SimpleVoiceDictationProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const SimpleVoiceDictation: React.FC<SimpleVoiceDictationProps> = ({ 
  onTextReceived, 
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Перевіряємо підтримку
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      console.log('Simple Voice Dictation - Support check:', hasRecognition);
      setIsSupported(hasRecognition);
      
      if (hasRecognition) {
        initializeRecognition();
      }
    };
    
    checkSupport();
  }, [language]);

  const initializeRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Налаштування
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'uk' ? 'uk-UA' : 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      // Обробники подій
      recognitionRef.current.onstart = () => {
        console.log('Simple Voice Dictation - Started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('Simple Voice Dictation - Result:', event);
        const transcript = event.results[0][0].transcript;
        console.log('Simple Voice Dictation - Transcript:', transcript);
        onTextReceived(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Simple Voice Dictation - Error:', event.error);
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
          case 'service-not-allowed':
            setError('Сервіс заблоковано. Спробуйте HTTPS.');
            break;
          default:
            setError(`Помилка: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Simple Voice Dictation - Ended');
        setIsListening(false);
      };

    } catch (error) {
      console.error('Simple Voice Dictation - Initialization error:', error);
      setError('Помилка ініціалізації');
    }
  };

  const startListening = () => {
    if (!isSupported) {
      setError('Розпізнавання мови не підтримується');
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
      console.log('Simple Voice Dictation - Starting...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Simple Voice Dictation - Start error:', error);
      setError('Не вдалося запустити диктовку');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 cursor-not-allowed ${className}`}
        title="Розпізнавання мови не підтримується"
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
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isListening 
            ? 'Зупинити диктовку' 
            : 'Почати диктовку'
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
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </button>

      {/* Показуємо помилку */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      )}
    </div>
  );
};

export default SimpleVoiceDictation;
