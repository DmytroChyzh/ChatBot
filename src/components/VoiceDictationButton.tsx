'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceDictationButtonProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
}

const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({ 
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    // Check browser support
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      console.log('Voice dictation support check:', { hasRecognition });
      setIsSupported(hasRecognition);
      
      if (hasRecognition) {
        initializeSpeech();
      }
    };
    
    checkSupport();
  }, [language]);

  const initializeSpeech = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        
        const currentText = finalTranscript + interimTranscript;
        setTranscript(currentText);
        
        console.log('Voice dictation result:', { finalTranscript, interimTranscript });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice dictation error:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'aborted':
            console.log('Voice dictation was aborted - normal behavior');
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
          default:
            setError(`Помилка диктування: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Voice dictation ended');
        setIsListening(false);
        stopAudioAnalysis();
        
        // Send final transcript
        if (transcript.trim() && onTranscript) {
          onTranscript(transcript.trim());
          setTranscript('');
        }
      };
      
    } catch (error) {
      console.error('Voice dictation initialization error:', error);
      setError('Помилка ініціалізації диктування');
    }
  };

  const startListening = async () => {
    if (!isSupported || disabled || isListening) {
      return;
    }
    
    try {
      setError(null);
      setTranscript('');
      
      // Get microphone access for audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await setupAudioAnalysis(stream);
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting voice dictation:', error);
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

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 cursor-not-allowed ${className}`}
        title="Диктування не підтримується"
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
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-gradient-to-r from-[#651FFF] to-[#FF6B35] hover:from-[#5A1AE6] hover:to-[#E55A2B] text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        title={
          isListening
            ? 'Натисніть щоб зупинити диктування'
            : 'Натисніть для диктування тексту'
        }
      >
        {isListening ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
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

      {/* Audio level visualization */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#651FFF] to-[#FF6B35] transition-all duration-75 ease-out"
            style={{ width: `${audioLevel * 100}%` }}
          ></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 max-w-xs">
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      )}
    </div>
  );
};

export default VoiceDictationButton;
