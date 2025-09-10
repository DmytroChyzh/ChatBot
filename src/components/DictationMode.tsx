'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DictationModeProps {
  onConfirm: (text: string) => void;
  onCancel: () => void;
  className?: string;
}

const DictationMode: React.FC<DictationModeProps> = ({ 
  onConfirm, 
  onCancel,
  className = ""
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentLang, setCurrentLang] = useState(language);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSpeech();
    return () => {
      cleanup();
    };
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSpeech = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Безперервне розпізнавання
      recognitionRef.current.interimResults = true; // Проміжні результати
      // Визначаємо мову на основі налаштувань користувача
      const detectedLang = currentLang === 'uk' ? 'uk-UA' : 'en-US';
      recognitionRef.current.lang = detectedLang;
      console.log('Dictation language set to:', detectedLang);
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('Dictation started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
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
        
        console.log('Dictation result:', { finalTranscript, interimTranscript, currentText });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Dictation error:', event.error);
        
        switch (event.error) {
          case 'aborted':
            console.log('Dictation was aborted - normal behavior');
            break;
          case 'no-speech':
            setError('Не чути мови. Спробуйте ще раз.');
            break;
          case 'audio-capture':
            setError('Помилка доступу до мікрофона.');
            break;
          case 'not-allowed':
            setError('Дозвіл на мікрофон не надано.');
            break;
          case 'network':
            setError('Помилка мережі. Перевірте підключення.');
            break;
          default:
            setError(`Помилка диктування: ${event.error}`);
        }
        
        setIsListening(false);
        stopAudioAnalysis();
      };

      recognitionRef.current.onend = () => {
        console.log('Dictation ended');
        setIsListening(false);
        stopAudioAnalysis();
      };
      
      setIsSupported(true);
    } catch (error) {
      console.error('Dictation initialization error:', error);
      setError('Помилка ініціалізації диктування');
      setIsSupported(false);
    }
  };

  const startListening = async () => {
    if (!isSupported || isListening) {
      return;
    }
    
    try {
      setError(null);
      setTranscript('');
      setFullTranscript('');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      await setupAudioAnalysis(stream);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting dictation:', error);
      setError('Не вдалося запустити диктування');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
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
        if (analyserRef.current && isListening) {
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

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioAnalysis();
  };

  const handleConfirm = () => {
    const finalText = fullTranscript + transcript;
    if (finalText.trim()) {
      onConfirm(finalText.trim());
    }
    cleanup();
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  // Auto-start listening when component mounts
  useEffect(() => {
    if (isSupported && !isListening) {
      startListening();
    }
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div className={`w-full bg-[hsl(var(--input-bg))] border-2 border-accent rounded-3xl px-8 py-6 flex flex-col items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Диктування не підтримується</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Ваш браузер не підтримує голосове диктування</p>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-2xl transition-colors duration-200"
          >
            Повернутися
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-[hsl(var(--input-bg))] border-2 border-accent rounded-3xl px-8 py-6 flex flex-col min-h-[200px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening 
              ? 'bg-gradient-to-r from-[#651FFF] to-[#FF6B35] animate-pulse' 
              : 'bg-gradient-to-r from-[#651FFF] to-[#FF6B35]'
          }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isListening ? 'Диктування...' : 'Готовий до диктування'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isListening ? `Говоріть ${currentLang === 'uk' ? 'українською' : 'англійською'}, я слухаю` : 'Натисніть щоб почати'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => {
              const newLang = currentLang === 'uk' ? 'en' : 'uk';
              setCurrentLang(newLang);
              // Restart recognition with new language
              if (isListening) {
                stopListening();
                setTimeout(() => {
                  initializeSpeech();
                  startListening();
                }, 100);
              }
            }}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors duration-200"
            title="Переключити мову"
          >
            {currentLang === 'uk' ? '🇺🇦 UK' : '🇺🇸 EN'}
          </button>
          
          <button
            onClick={handleCancel}
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
            title="Скасувати"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!transcript.trim()}
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Підтвердити"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Voice Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-1 h-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-[#651FFF] to-[#FF6B35] rounded-full transition-all duration-150"
              style={{
                height: `${Math.max(4, (audioLevel * 20) + Math.random() * 8)}px`,
                animationDelay: `${i * 50}ms`,
                animation: isListening ? 'wave-pulse 1.2s ease-in-out infinite' : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Transcript Area */}
      <div className="flex-1 min-h-[100px] max-h-[200px] overflow-y-auto">
        {transcript ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 min-h-[100px]">
            <p className="text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
            <div ref={transcriptEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[100px] text-gray-500 dark:text-gray-400">
            <p className="text-center">
              {isListening ? 'Говоріть, щоб побачити текст...' : 'Натисніть щоб почати диктування'}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 px-4 py-2 bg-red-500 text-white text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default DictationMode;
