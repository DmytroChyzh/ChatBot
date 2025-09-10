'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface HybridVoiceChatProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  sessionId?: string | null;
  onAddMessage?: (message: { role: 'user' | 'assistant', content: string, timestamp: Date }) => Promise<void>;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

const HybridVoiceChat: React.FC<HybridVoiceChatProps> = ({
  disabled = false,
  className = "",
  onTranscript,
  onResponse,
  sessionId,
  onAddMessage,
  onListeningChange,
  onSpeakingChange
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Notify parent components of state changes
  useEffect(() => {
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

  useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(isSpeaking);
    }
  }, [isSpeaking, onSpeakingChange]);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'sk_61908dfd38eb151e87df080ede12f8b12f03232fa79048c4';
  const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'uk' ? 'uk-UA' : 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('HybridVoiceChat: Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = async (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('HybridVoiceChat: Final transcript:', finalTranscript);
          setTranscript(finalTranscript);
          if (onTranscript) {
            onTranscript(finalTranscript);
          }
          
          // Add user message to chat
          if (onAddMessage) {
            try {
              await onAddMessage({
                role: 'user',
                content: finalTranscript,
                timestamp: new Date()
              });
            } catch (error) {
              console.error('HybridVoiceChat: Error adding user message:', error);
            }
          }
          
          // Clear the input field after sending message
          if (onTranscript) {
            onTranscript(''); // Clear the input
          }
          
          // Process with OpenAI
          processWithOpenAI(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('HybridVoiceChat: Speech recognition error:', event.error);
        setError(`Помилка розпізнавання мови: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('HybridVoiceChat: Speech recognition ended');
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioAnalysis();
    };
  }, [language, onTranscript]);

  const setupAudioAnalysis = async (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    const source = audioContext.createMediaStreamSource(stream);
    analyserRef.current = audioContext.createAnalyser();
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyserRef.current);

    const updateAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        setAudioLevel(average / 255);
      }
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.error('Error closing audio context:', e));
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const processWithOpenAI = async (text: string) => {
    try {
      setIsProcessing(true);
      console.log('HybridVoiceChat: Processing with OpenAI:', text);

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: [],
          sessionId: 'hybrid-voice-chat'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('HybridVoiceChat: OpenAI response:', data);

      if (data.content) {
        // Add assistant message to chat
        if (onAddMessage) {
          try {
            await onAddMessage({
              role: 'assistant',
              content: data.content,
              timestamp: new Date()
            });
          } catch (error) {
            console.error('HybridVoiceChat: Error adding assistant message:', error);
          }
        }

        // Send response to parent component
        if (onResponse) {
          onResponse(data.content);
        }

        // Convert to speech using ElevenLabs
        await convertToSpeech(data.content);
      }
    } catch (error) {
      console.error('HybridVoiceChat: Error processing with OpenAI:', error);
      setError('Помилка обробки запиту');
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToSpeech = async (text: string) => {
    try {
      console.log('HybridVoiceChat: Converting to speech:', text);
      setIsSpeaking(true);

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onplay = () => {
        console.log('HybridVoiceChat: Audio started playing');
      };

      audio.onended = () => {
        console.log('HybridVoiceChat: Audio finished playing');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('HybridVoiceChat: Audio error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('HybridVoiceChat: Error converting to speech:', error);
      setError('Помилка озвучування');
      setIsSpeaking(false);
    }
  };

  const startListening = async () => {
    if (disabled || isListening || isProcessing) return;

    try {
      setError(null);
      console.log('HybridVoiceChat: Starting listening...');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('HybridVoiceChat: Microphone access granted');

      // Setup audio analysis for visualization
      await setupAudioAnalysis(stream);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('HybridVoiceChat: Error starting listening:', error);
      setError('Не вдалося отримати доступ до мікрофона');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioAnalysis();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled || isProcessing}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : isProcessing
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
            : isSpeaking
            ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isListening
            ? 'Натисніть щоб зупинити'
            : isProcessing
            ? 'Обробка запиту...'
            : isSpeaking
            ? 'Озвучування відповіді...'
            : 'Натисніть для голосового чату'
        }
      >
        {isListening ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : isProcessing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-6.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-6.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
          </svg>
        ) : isSpeaking ? (
          <div className="flex items-center gap-0.5">
            <div className="w-0.5 h-2 bg-white rounded-full animate-wave-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-0.5 h-3 bg-white rounded-full animate-wave-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-0.5 h-4 bg-white rounded-full animate-wave-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-0.5 h-3 bg-white rounded-full animate-wave-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-0.5 h-2 bg-white rounded-full animate-wave-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <circle cx="12" cy="16" r="1"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <path d="M12 1v3"/>
            <path d="M6 3l1.5 1.5"/>
            <path d="M17.5 4.5L19 3"/>
          </svg>
        )}
      </button>

      {/* Audio level visualization */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-75 ease-out"
            style={{ width: `${audioLevel * 100}%` }}
          ></div>
        </div>
      )}

      {/* Status indicators */}
      {isProcessing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-yellow-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap z-50">
          • Processing...
        </div>
      )}

      {isSpeaking && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap z-50">
          • Speaking...
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

export default HybridVoiceChat;
