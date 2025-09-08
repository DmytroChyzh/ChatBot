import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AnnyangVoiceDictationProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const AnnyangVoiceDictation: React.FC<AnnyangVoiceDictationProps> = ({ 
  onTextReceived, 
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Перевіряємо чи є annyang
    const checkAnnyang = () => {
      if (typeof window !== 'undefined' && (window as any).annyang) {
        console.log('Annyang Voice Dictation - Annyang found');
        setIsSupported(true);
        initializeAnnyang();
      } else {
        console.log('Annyang Voice Dictation - Annyang not found');
        setIsSupported(false);
      }
    };

    // Завантажуємо annyang якщо його немає
    if (typeof window !== 'undefined' && !(window as any).annyang) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/annyang/2.6.1/annyang.min.js';
      script.onload = () => {
        console.log('Annyang Voice Dictation - Script loaded');
        checkAnnyang();
      };
      script.onerror = () => {
        console.error('Annyang Voice Dictation - Script failed to load');
        setIsSupported(false);
      };
      document.head.appendChild(script);
    } else {
      checkAnnyang();
    }
  }, []);

  const initializeAnnyang = () => {
    if (typeof window === 'undefined' || !(window as any).annyang) {
      return;
    }

    const annyang = (window as any).annyang;
    
    // Налаштування мови
    annyang.setLanguage(language === 'uk' ? 'uk-UA' : 'en-US');

    // Команда для розпізнавання будь-якого тексту
    const commands = {
      '*text': (text: string) => {
        console.log('Annyang Voice Dictation - Recognized:', text);
        onTextReceived(text);
        setIsListening(false);
      }
    };

    annyang.addCommands(commands);

    // Обробники подій
    annyang.addCallback('start', () => {
      console.log('Annyang Voice Dictation - Started');
      setIsListening(true);
      setError(null);
    });

    annyang.addCallback('error', (error: any) => {
      console.error('Annyang Voice Dictation - Error:', error);
      setIsListening(false);
      
      switch (error.error) {
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
          setError(`Помилка: ${error.error}`);
      }
    });

    annyang.addCallback('end', () => {
      console.log('Annyang Voice Dictation - Ended');
      setIsListening(false);
    });
  };

  const startListening = () => {
    if (!isSupported) {
      setError('Розпізнавання мови не підтримується');
      return;
    }
    
    if (disabled) {
      return;
    }
    
    if (typeof window === 'undefined' || !(window as any).annyang) {
      setError('Annyang не завантажено');
      return;
    }
    
    try {
      setError(null);
      console.log('Annyang Voice Dictation - Starting...');
      (window as any).annyang.start();
    } catch (error) {
      console.error('Annyang Voice Dictation - Start error:', error);
      setError('Не вдалося запустити диктовку');
    }
  };

  const stopListening = () => {
    if (typeof window !== 'undefined' && (window as any).annyang) {
      (window as any).annyang.abort();
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
            : 'Почати диктовку (Annyang)'
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

export default AnnyangVoiceDictation;
