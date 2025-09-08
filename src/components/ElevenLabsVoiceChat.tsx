'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ElevenLabsVoiceChatProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

const ElevenLabsVoiceChat: React.FC<ElevenLabsVoiceChatProps> = ({
  disabled = false,
  className = "",
  onTranscript,
  onResponse
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'sk_61908dfd38eb151e87df080ede12f8b12f03232fa79048c4';
  const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (default)
      const AGENT_ID = 'agent_6201k4mrpmh7fks9cqgq6qxcsdmb'; // Your ElevenLabs agent ID v2

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const setupAudioAnalysis = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
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

  const connectToElevenLabs = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      console.log('ElevenLabs: Starting connection...');
      console.log('ElevenLabs: API Key present:', !!ELEVENLABS_API_KEY);
      console.log('ElevenLabs: API Key length:', ELEVENLABS_API_KEY?.length);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('ElevenLabs: Microphone access granted');
      
      // Setup audio analysis for visualization
      await setupAudioAnalysis(stream);
      
      // Connect to ElevenLabs Conversational AI
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?key=${ELEVENLABS_API_KEY}&agent_id=${AGENT_ID}`;
      console.log('ElevenLabs: Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to ElevenLabs');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Send initial configuration - правильний формат для ElevenLabs
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_finalized',
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: language === 'uk' 
                  ? 'Ти корисний AI асистент. Відповідай природно українською та англійською мовою.'
                  : 'You are a helpful AI assistant. Respond naturally in Ukrainian and English.',
                temperature: 0.8
              },
              voice: {
                voice_id: VOICE_ID,
                stability: 0.5,
                similarity_boost: 0.8
              },
              language: language === 'uk' ? 'uk' : 'en'
            }
          }
        }));
        
        console.log('ElevenLabs: Initial configuration sent');
        
        // Автоматично починаємо слухати після підключення
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
            mediaRecorderRef.current.start(250);
            setIsListening(true);
            console.log('ElevenLabs: Auto-started listening');
            
            // Автоматичне привітання від AI
            setTimeout(() => {
              const greeting = language === 'uk' 
                ? 'Привіт! Я Cieden Assistant. Чим можу допомогти з вашим проєктом?'
                : 'Hello! I am Cieden Assistant. How can I help with your project?';
              
              if (onResponse) {
                onResponse(greeting);
              }
              
              // Озвучуємо привітання
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(greeting);
                utterance.lang = language === 'uk' ? 'uk-UA' : 'en-US';
                utterance.rate = 0.9;
                speechSynthesis.speak(utterance);
              }
            }, 2000);
          }
        }, 1000);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('ElevenLabs message:', data);
          
          switch (data.type) {
            case 'audio':
              // Play received audio
              console.log('ElevenLabs: Received audio data:', data);
              if (data.audio && data.audio.length > 0) {
                console.log('ElevenLabs: Playing audio, length:', data.audio.length);
                playAudio(data.audio);
              } else {
                console.log('ElevenLabs: Audio data is empty or missing');
              }
              break;
            case 'agent_response':
              // Handle text response
              if (data.response && onResponse) {
                onResponse(data.response);
              }
              break;
            case 'user_transcript':
              // Handle user transcript
              if (data.transcript && onTranscript) {
                onTranscript(data.transcript);
              }
              break;
            case 'conversation_initiation_server_finalized':
              console.log('ElevenLabs: Server configuration received');
              break;
            case 'error':
              console.error('ElevenLabs error:', data.error);
              setError(`ElevenLabs помилка: ${data.error}`);
              break;
            default:
              console.log('ElevenLabs: Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('ElevenLabs: Error parsing message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('ElevenLabs WebSocket error:', error);
        console.error('ElevenLabs: WebSocket URL was:', wsUrl);
        console.error('ElevenLabs: API Key present:', !!ELEVENLABS_API_KEY);
        setError('Помилка підключення до ElevenLabs. Перевірте API ключ та мережу.');
        setIsConnected(false);
      };
      
      ws.onclose = (event) => {
        console.log('ElevenLabs WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (event.code !== 1000) {
          setError(`З'єднання закрито з кодом: ${event.code}. ${event.reason || 'Невідома причина'}`);
        }
      };
      
      websocketRef.current = ws;
      
      // Setup MediaRecorder for sending audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result?.toString().split(',')[1];
            if (base64) {
              ws.send(JSON.stringify({
                type: 'audio',
                audio: base64
              }));
            }
          };
          reader.readAsDataURL(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
    } catch (error) {
      console.error('Error connecting to ElevenLabs:', error);
      setError('Не вдалося підключитися до ElevenLabs');
      setIsConnecting(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    try {
      console.log('ElevenLabs: playAudio called with data length:', base64Audio.length);
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      
      audio.onloadstart = () => console.log('ElevenLabs: Audio loading started');
      audio.oncanplay = () => console.log('ElevenLabs: Audio can play');
      audio.onplay = () => {
        console.log('ElevenLabs: Audio started playing');
        setIsSpeaking(true);
      };
      audio.onended = () => {
        console.log('ElevenLabs: Audio finished playing');
        setIsSpeaking(false);
      };
      audio.onerror = (e) => {
        console.error('ElevenLabs: Audio error:', e);
        setIsSpeaking(false);
      };
      
      audio.play().catch(e => {
        console.error('ElevenLabs: Error playing audio:', e);
        setIsSpeaking(false);
      });
    } catch (error) {
      console.error('ElevenLabs: Error in playAudio:', error);
      setIsSpeaking(false);
    }
  };

  const startVoiceChat = async () => {
    console.log('ElevenLabs: startVoiceChat called');
    console.log('ElevenLabs: disabled:', disabled);
    console.log('ElevenLabs: isConnected:', isConnected);
    
    if (disabled || isConnected) {
      console.log('ElevenLabs: Skipping - disabled or already connected');
      return;
    }
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs: No API key found');
      setError('API ключ ElevenLabs не знайдено. Перевірте змінні середовища.');
      return;
    }
    
    console.log('ElevenLabs: Starting voice chat...');
    try {
      await connectToElevenLabs();
    } catch (error) {
      console.error('ElevenLabs: Error starting voice chat:', error);
      setError('Не вдалося запустити голосовий чат');
    }
  };

  const stopVoiceChat = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    stopAudioAnalysis();
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    if (!isConnected || !mediaRecorderRef.current) return;
    
    if (isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    } else {
      mediaRecorderRef.current.start(100); // Send audio every 100ms
      setIsListening(true);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          console.log('ElevenLabs button clicked');
          console.log('ElevenLabs: isConnected:', isConnected);
          console.log('ElevenLabs: isListening:', isListening);
          if (isConnected) {
            toggleListening();
          } else {
            startVoiceChat();
          }
        }}
        disabled={disabled}
             className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
               isConnected
                 ? isListening
                   ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                   : 'bg-red-500 hover:bg-red-600 text-white'
                 : 'bg-purple-500 hover:bg-purple-600 text-white'
             } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isConnected
            ? isListening
              ? 'Зупинити прослуховування'
              : 'Почати прослуховування'
            : 'Підключитися до ElevenLabs'
        }
      >
        {isConnected ? (
          isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
              <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
          )
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 max-w-xs">
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      )}

      {/* Connecting status */}
      {isConnecting && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap z-50">
          • Connecting...
        </div>
      )}
    </div>
  );
};

export default ElevenLabsVoiceChat;
