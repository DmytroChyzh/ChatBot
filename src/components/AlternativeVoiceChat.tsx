'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AlternativeVoiceChatProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
  onSpeak?: (text: string) => void;
}

const AlternativeVoiceChat: React.FC<AlternativeVoiceChatProps> = ({ 
  disabled = false,
  className = "",
  onTranscript,
  onSpeak
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [testMode, setTestMode] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Функція для встановлення помилки з автоматичним очищенням
  const setErrorWithTimeout = (errorMessage: string) => {
    // Очищаємо попередній таймер
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    
    setError(errorMessage);
    
    // Встановлюємо новий таймер для очищення помилки через 5 секунд
    const timeout = setTimeout(() => {
      setError(null);
      setErrorTimeout(null);
    }, 5000);
    
    setErrorTimeout(timeout);
  };
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Перевіряємо підтримку MediaRecorder
    const checkSupport = () => {
      const hasMediaRecorder = 'MediaRecorder' in window;
      const hasGetUserMedia = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      
      console.log('MediaRecorder support check:', { hasMediaRecorder, hasGetUserMedia });
      setIsSupported(hasMediaRecorder && hasGetUserMedia);
    };
    
    checkSupport();
    
    // Очищаємо таймер при розмонтуванні
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [language]);

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const testMicrophone = async () => {
    try {
      console.log('Testing microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone test successful:', {
        audioTracks: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings()
      });
      
      // Зупиняємо тест
      stream.getTracks().forEach(track => track.stop());
      setErrorWithTimeout('Мікрофон працює! Спробуйте голосовий чат.');
    } catch (error) {
      console.error('Microphone test failed:', error);
      setErrorWithTimeout('Помилка доступу до мікрофона');
    }
  };

  const startRecording = async () => {
    if (!isSupported) {
      setErrorWithTimeout('Голосові функції не підтримуються в цьому браузері');
      return;
    }
    
    if (disabled || isProcessing) {
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setFullTranscript('');
      setFinalTranscript('');
      setIsRecording(true);
      setShowRecordingUI(true);
      
      // Отримуємо доступ до мікрофона
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      console.log('Microphone access granted:', {
        audioTracks: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings()
      });

      // Налаштовуємо аналіз аудіо для візуалізації
      await setupAudioAnalysis(stream);

      // Налаштовуємо MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
      };

      // Починаємо запис
      mediaRecorder.start(100); // Збираємо дані кожні 100мс
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorWithTimeout('Не вдалося запустити запис');
      setIsRecording(false);
      setShowRecordingUI(false);
      stopAudioAnalysis();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowRecordingUI(false);
      stopAudioAnalysis();
    }
  };

  const processAudio = async () => {
    console.log('Processing audio...', {
      chunksCount: audioChunksRef.current.length,
      totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
    });

    if (audioChunksRef.current.length === 0) {
      console.error('No audio chunks to process');
      setErrorWithTimeout('Немає аудіо даних для обробки');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Створюємо Blob з аудіо даних
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Created audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Перевіряємо мінімальний розмір аудіо
      if (audioBlob.size < 1000) { // Менше 1KB
        console.error('Audio too short:', audioBlob.size, 'bytes');
        setErrorWithTimeout('Запис занадто короткий. Спробуйте говорити довше.');
        return;
      }
      
      // Створюємо FormData для відправки
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      console.log('Sending audio to Whisper API...', {
        audioSize: audioBlob.size,
        language: language
      });

      // Відправляємо на наш API endpoint
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      console.log('Whisper API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Whisper API error:', errorData);
        
        // Fallback на Web Speech API якщо Whisper не працює
        console.log('Falling back to Web Speech API...');
        await fallbackToWebSpeech();
        return;
      }

      const result = await response.json();
      console.log('Whisper API result:', result);
      
      if (result.text && result.text.trim()) {
        setTranscript(result.text);
        setFinalTranscript(result.text);
      } else {
        setErrorWithTimeout('Не вдалося розпізнати мову');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      console.log('Falling back to Web Speech API...');
      await fallbackToWebSpeech();
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const fallbackToWebSpeech = async () => {
    try {
      console.log('Using Web Speech API fallback...');
      
      // Використовуємо Web Speech API як fallback
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorWithTimeout('Голосові функції не підтримуються в цьому браузері');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'uk' ? 'uk-UA' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          setTranscript(transcript);
          setFinalTranscript(transcript);
        } else {
          setErrorWithTimeout('Не вдалося розпізнати мову');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech API error:', event.error);
        setErrorWithTimeout(`Помилка розпізнавання: ${event.error}`);
      };

      // Запускаємо розпізнавання
      recognition.start();
      
    } catch (error) {
      console.error('Web Speech API fallback error:', error);
      setErrorWithTimeout('Помилка обробки аудіо');
    }
  };

  const confirmRecording = () => {
    if (transcript.trim() && onTranscript) {
      onTranscript(transcript.trim());
    }
    setShowRecordingUI(false);
    setIsRecording(false);
    stopAudioAnalysis();
    setTranscript('');
    setFullTranscript('');
    setFinalTranscript('');
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setShowRecordingUI(false);
    stopAudioAnalysis();
    setTranscript('');
    setFullTranscript('');
    setFinalTranscript('');
    audioChunksRef.current = [];
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

  const speakText = (text: string) => {
    if (onSpeak) {
      onSpeak(text);
    } else {
      speakResponse(text);
    }
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



  // Показуємо UI запису прямо в input (як в ChatGPT)
  if (showRecordingUI) {
    return (
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50">
        <div className="w-full h-full flex items-center justify-between px-4">
          {/* Ліва частина - Voice лінії (менші) */}
          <div className="flex items-center">
            <div className="flex items-center space-x-0.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(4, (audioLevel * 15) + Math.random() * 8)}px`,
                    animationDelay: `${i * 100}ms`,
                    animation: 'wave-pulse 1.2s ease-in-out infinite'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Центральна частина - Текст або статус */}
          <div className="flex-1 mx-4">
            {isProcessing ? (
              <div className="text-sm text-foreground text-center">
                Обробка...
              </div>
            ) : transcript ? (
              <div className="text-sm text-foreground text-center">
                {transcript}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center">
                Говоріть...
              </div>
            )}
          </div>

          {/* Права частина - Кнопки управління */}
          <div className="flex items-center gap-2">
            {/* Кнопка скасування */}
            <button
              onClick={cancelRecording}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
              title="Скасувати запис"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Кнопка підтвердження */}
            <button
              onClick={confirmRecording}
              disabled={isProcessing || !transcript}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Підтвердити запис"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      {/* Тестова кнопка для debugging */}
      {process.env.NODE_ENV === 'development' && (
        <button
          type="button"
          onClick={testMicrophone}
          className="absolute -top-12 left-0 w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-xs"
          title="Тест мікрофона"
        >
          T
        </button>
      )}
      
      <button
        type="button"
        onClick={toggleRecording}
        disabled={disabled}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : isProcessing
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isRecording
            ? 'Натисніть щоб зупинити'
            : isProcessing
            ? 'Обробка аудіо...'
            : 'Натисніть для голосового чату (Whisper)'
        }
      >
        {isRecording ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : isProcessing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-6.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-6.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
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
    </div>
  );
};

export default AlternativeVoiceChat;
