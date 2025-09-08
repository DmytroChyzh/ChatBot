'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceChatProps {
  disabled?: boolean;
  className?: string;
}

interface SessionData {
  id: string;
  expires_at: number;
  model: string;
  voice: string;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ 
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Очищення ресурсів при розмонтуванні
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  };

  const createSession = async (): Promise<SessionData> => {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Session creation error:', errorData);
      
      if (response.status === 500 && errorData.error?.includes('OPENAI_API_KEY')) {
        throw new Error('API ключ не налаштований. Додайте OPENAI_API_KEY в .env.local');
      }
      
      throw new Error(errorData.error || `Failed to create session: ${response.status}`);
    }

    return await response.json();
  };

  const setupPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && websocketRef.current) {
        websocketRef.current.send(JSON.stringify({
          type: 'webrtc.ice_candidate',
          candidate: event.candidate
        }));
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      if (event.streams[0] && audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const setupWebSocket = async (sessionId: string): Promise<WebSocket> => {
    // Спробуємо підключитися безпосередньо до OpenAI WebSocket
    // Оскільки API proxy не працює на Vercel, використаємо прямий підхід
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_OPENAI_API_KEY not found');
    }
    
    // Створюємо WebSocket URL з API ключем
    const wsUrl = `wss://api.openai.com/v1/realtime/sessions/${sessionId}?model=gpt-4o-realtime-preview&api_key=${apiKey}`;
    console.log('Connecting directly to WebSocket:', wsUrl);
    console.log('API Key present:', !!apiKey);
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Відправляємо спрощене початкове повідомлення
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant. Respond naturally and conversationally in Ukrainian and English.',
            voice: 'verse',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16'
          }
        }));
        
        setIsConnecting(false);
        setIsConnected(true);
        setError(null);
        resolve(ws);
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        switch (data.type) {
          case 'webrtc.answer':
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(data.sdp);
            }
            break;
            
          case 'webrtc.ice_candidate':
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(data.candidate);
            }
            break;
            
          case 'error':
            console.error('WebSocket error:', data.error);
            setError(data.error.message || 'WebSocket error');
            break;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL was:', wsUrl);
        console.error('API Key present:', !!apiKey);
        setError('OpenAI Realtime API недоступний. Можливо, ваш API ключ не має доступу до Realtime API або API ще в beta. Використовуйте синю кнопку для голосового чату.');
        setIsConnecting(false);
        reject(error);
      };

      websocketRef.current = ws;
    });
  };

  const startVoiceChat = async () => {
    if (disabled || isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // 1. Створюємо сесію
      console.log('Creating session...');
      const session = await createSession();
      setSessionData(session);
      console.log('Session created:', session.id);

      // 2. Отримуємо доступ до мікрофона
      console.log('Getting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = stream;

      // 3. Налаштовуємо WebRTC
      console.log('Setting up WebRTC...');
      const peerConnection = setupPeerConnection();
      
      // Додаємо локальний потік
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // 4. Налаштовуємо WebSocket і чекаємо на підключення
      console.log('Setting up WebSocket...');
      await setupWebSocket(session.id);

      // 5. Створюємо offer
      console.log('Creating offer...');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Відправляємо offer через WebSocket (тепер він точно підключений)
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'webrtc.offer',
          sdp: offer
        }));
        console.log('Offer sent successfully');
      } else {
        throw new Error('WebSocket not ready');
      }

    } catch (error) {
      console.error('Error starting voice chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to start voice chat');
      setIsConnecting(false);
      cleanup();
    }
  };

  const stopVoiceChat = () => {
    cleanup();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isConnected ? stopVoiceChat : startVoiceChat}
        disabled={disabled || isConnecting}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
          isConnected
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : isConnecting
            ? 'bg-yellow-500 text-white animate-pulse'
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={
          isConnected
            ? 'Зупинити голосовий чат'
            : isConnecting
            ? 'Підключення...'
            : 'OpenAI Realtime API (може не працювати)'
        }
      >
        {isConnected ? (
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
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        )}
      </button>

      {/* Аудіо елемент для відтворення відповідей */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />

      {/* Показуємо помилку */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 max-w-xs">
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      )}

      {/* Показуємо статус */}
      {isConnecting && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
          Підключення...
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-500"></div>
        </div>
      )}

      {isConnected && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
          Голосовий чат активний
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
