import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceDictationProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceDictation: React.FC<VoiceDictationProps> = ({ 
  onTextReceived, 
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Перевіряємо підтримку браузера
  useEffect(() => {
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(hasRecognition);
    };
    checkSupport();
  }, []);

  // Ініціалізуємо розпізнавання мови
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'uk' ? 'uk-UA' : 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Voice dictation started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTextReceived(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice dictation error:', event.error);
        setIsListening(false);
        
        // Обробка різних типів помилок
        switch (event.error) {
          case 'no-speech':
            setError(language === 'uk' ? 'Не чути мови. Спробуйте ще раз.' : 'No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setError(language === 'uk' ? 'Помилка доступу до мікрофона.' : 'Microphone access error.');
            break;
          case 'not-allowed':
            setError(language === 'uk' ? 'Дозвіл на мікрофон не надано.' : 'Microphone permission denied.');
            break;
          default:
            setError(language === 'uk' ? 'Помилка розпізнавання мови.' : 'Speech recognition error.');
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Voice dictation ended');
        setIsListening(false);
      };
    }
  }, [isSupported, language, onTextReceived]);

  // Почати запис голосу
  const startListening = () => {
    if (recognitionRef.current && !disabled) {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice dictation:', error);
        setError(language === 'uk' ? 'Не вдалося запустити диктовку.' : 'Failed to start dictation.');
      }
    }
  };

  // Зупинити запис голосу
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Якщо браузер не підтримує розпізнавання мови
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 cursor-not-allowed ${className}`}
        title={language === 'uk' ? 'Диктовка не підтримується в цьому браузері' : 'Dictation not supported in this browser'}
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
        onClick={() => {
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }}
        disabled={disabled}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isListening 
            ? (language === 'uk' ? 'Зупинити диктовку' : 'Stop dictation')
            : (language === 'uk' ? 'Почати диктовку' : 'Start dictation')
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

export default VoiceDictation;
