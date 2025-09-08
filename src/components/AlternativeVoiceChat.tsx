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
  const [fullTranscript, setFullTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
      recognitionRef.current.continuous = true; // Безперервне розпізнавання
      recognitionRef.current.interimResults = true; // Показуємо проміжні результати
      recognitionRef.current.lang = language === 'uk' ? 'uk-UA' : 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Обробляємо всі результати
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Оновлюємо повний текст
        if (finalTranscript) {
          setFullTranscript(prev => prev + finalTranscript);
        }
        
        // Показуємо поточний текст (проміжний + фінальний)
        const currentText = fullTranscript + finalTranscript + interimTranscript;
        setTranscript(currentText);
        
        console.log('Speech recognized:', { finalTranscript, interimTranscript, currentText });
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
        setIsRecording(false);
        setShowRecordingUI(false);
        stopAudioAnalysis();
      };

      // Ініціалізуємо синтез мови
      synthesisRef.current = window.speechSynthesis;
      
    } catch (error) {
      console.error('Speech initialization error:', error);
      setError('Помилка ініціалізації голосових функцій');
    }
  };

  const startRecording = async () => {
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
      setFullTranscript('');
      setIsRecording(true);
      setShowRecordingUI(true);
      
      // Отримуємо доступ до мікрофона для аналізу аудіо
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await setupAudioAnalysis(stream);
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Не вдалося запустити розпізнавання мови');
      setIsRecording(false);
      setShowRecordingUI(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setShowRecordingUI(false);
      stopAudioAnalysis();
      
      // Відправляємо весь накопичений текст
      const finalText = fullTranscript + transcript;
      if (finalText.trim() && onTranscript) {
        onTranscript(finalText.trim());
        console.log('Final transcript sent to parent:', finalText.trim());
      }
    }
  };

  const cancelRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setShowRecordingUI(false);
      stopAudioAnalysis();
      setTranscript('');
      setFullTranscript('');
    }
  };

  const confirmRecording = () => {
    stopRecording();
  };

  const setupAudioAnalysis = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
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

  // Показуємо UI запису як в ChatGPT
  if (showRecordingUI) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
          {/* Заголовок */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Голосовий запис
            </h3>
          </div>

          {/* Хвилі звуку */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gray-300 dark:bg-gray-600 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(4, (audioLevel * 40) + Math.random() * 10)}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Текст розпізнавання */}
          {transcript && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Розпізнано:
              </div>
              <div className="text-gray-900 dark:text-white max-h-20 overflow-y-auto">
                {transcript}
              </div>
            </div>
          )}

          {/* Кнопки управління */}
          <div className="flex items-center justify-between">
            {/* Кнопка скасування */}
            <button
              onClick={cancelRecording}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="Скасувати запис"
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
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Кнопка зупинки/підтвердження */}
            <button
              onClick={confirmRecording}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Підтвердити запис"
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
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || isListening}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          'bg-blue-500 hover:bg-blue-600 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title="Натисніть щоб почати запис"
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
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
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

export default AlternativeVoiceChat;
