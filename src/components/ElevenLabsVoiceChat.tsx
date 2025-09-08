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
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const ELEVENLABS_API_KEY = 'sk_61908dfd38eb151e87df080ede12f8b12f03232fa79048c4';
  const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (default)

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
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      // Setup audio analysis for visualization
      await setupAudioAnalysis(stream);
      
      // Create WebSocket connection to ElevenLabs
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?key=${ELEVENLABS_API_KEY}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to ElevenLabs');
        setIsConnected(true);
        
        // Send initial configuration
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
              }
            }
          }
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('ElevenLabs message:', data);
        
        switch (data.type) {
          case 'audio':
            // Play received audio
            playAudio(data.audio);
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
        }
      };
      
      ws.onerror = (error) => {
        console.error('ElevenLabs WebSocket error:', error);
        setError('Помилка підключення до ElevenLabs');
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('ElevenLabs WebSocket closed');
        setIsConnected(false);
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
    }
  };

  const playAudio = (base64Audio: string) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const startVoiceChat = async () => {
    if (disabled || isConnected) return;
    
    try {
      await connectToElevenLabs();
    } catch (error) {
      console.error('Error starting voice chat:', error);
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
        onClick={isConnected ? toggleListening : startVoiceChat}
        disabled={disabled}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isConnected
            ? isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
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
    </div>
  );
};

export default ElevenLabsVoiceChat;
