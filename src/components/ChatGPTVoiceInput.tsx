'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatGPTVoiceInputProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
}

const ChatGPTVoiceInput: React.FC<ChatGPTVoiceInputProps> = ({ 
  disabled = false,
  className = "",
  onTranscript
}) => {
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'cancelled' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barsRef = useRef<number[]>(new Array(36).fill(0));
  const decayRef = useRef(0.92);

  // Функція для очищення ресурсів
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  // Функція для зміни розміру canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  // Функція для малювання кадру
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    // Очищаємо canvas
    ctx.clearRect(0, 0, width, height);
    
    // Малюємо фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Малюємо пунктирну лінію посередині
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Отримуємо дані аналізатора
    if (analyserRef.current && dataArrayRef.current && isRecording) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Оновлюємо бари з реальними даними
      const dataStep = Math.floor(dataArrayRef.current.length / 36);
      
      for (let i = 0; i < 36; i++) {
        const dataIndex = i * dataStep;
        const value = dataArrayRef.current[dataIndex] / 255;
        // Додаємо трохи випадковості для більш живої анімації
        const randomFactor = 0.8 + Math.random() * 0.4;
        barsRef.current[i] = Math.max(barsRef.current[i] * decayRef.current, value * randomFactor);
      }
    } else {
      // Затухання барів
      for (let i = 0; i < 36; i++) {
        barsRef.current[i] *= decayRef.current;
      }
    }
    
    // Малюємо бари
    const barWidth = width / 36;
    const maxBarHeight = 36;
    const minBarHeight = 2;
    
    for (let i = 0; i < 36; i++) {
      const barHeight = Math.max(minBarHeight, barsRef.current[i] * maxBarHeight);
      const x = i * barWidth + barWidth * 0.1;
      const y = (height - barHeight) / 2;
      
      // Градієнт для бару
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#8B5CF6'); // Purple
      gradient.addColorStop(1, '#3B82F6'); // Blue
      
      ctx.fillStyle = gradient;
      
      // Малюємо закруглений прямокутник
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth * 0.8, barHeight, 2);
      ctx.fill();
    }
    
    // Продовжуємо анімацію
    if (isRecording || barsRef.current.some(bar => bar > 0.01)) {
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    }
  }, [isRecording]);

  // Функція для початку прослуховування
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setStatus('listening');
      setIsRecording(true);
      
      // Отримуємо доступ до мікрофона
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Налаштовуємо AudioContext
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.85;
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      source.connect(analyserRef.current);
      
      // Починаємо анімацію
      drawFrame();
      
    } catch (error) {
      console.error('Error starting listening:', error);
      setError('Помилка доступу до мікрофона');
      setStatus('idle');
      setIsRecording(false);
    }
  }, [drawFrame]);

  // Функція для зупинки прослуховування
  const stopListening = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setStatus('idle');
  }, [cleanup]);

  // Функція для скасування
  const cancelRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setStatus('cancelled');
    setTimeout(() => setStatus('idle'), 2000);
  }, [cleanup]);

  // Функція для відправки
  const sendRecording = useCallback(async () => {
    cleanup();
    setIsRecording(false);
    setStatus('processing');
    setIsProcessing(true);
    
    // Імітуємо обробку
    setTimeout(() => {
      setStatus('sent');
      setIsProcessing(false);
      
      // Імітуємо відправку тексту
      if (onTranscript) {
        onTranscript('Тестовий текст з голосового вводу');
      }
      
      setTimeout(() => setStatus('idle'), 2000);
    }, 1000);
  }, [cleanup, onTranscript]);

  // Ефект для зміни розміру canvas
  useEffect(() => {
    resizeCanvas();
    
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [resizeCanvas, cleanup]);

  // Ефект для початкової анімації
  useEffect(() => {
    // Запускаємо початкову анімацію
    drawFrame();
  }, [drawFrame]);

  // Отримуємо текст статусу
  const getStatusText = () => {
    switch (status) {
      case 'listening': return 'Говоріть...';
      case 'processing': return 'Обробка...';
      case 'cancelled': return 'Скасовано';
      case 'sent': return 'Відправлено';
      default: return 'Натисніть + для голосового вводу';
    }
  };

  return (
    <div className={`w-full max-w-[880px] mx-auto ${className}`}>
      {/* Voice Input Pill */}
      <div className="relative bg-gray-800 rounded-full px-4 py-3 flex items-center justify-between min-h-[60px]">
        {/* Кнопка + */}
        <button
          onClick={isRecording ? stopListening : startListening}
          disabled={disabled || isProcessing}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gray-600 hover:bg-gray-500 text-white'
          } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isRecording ? 'Зупинити запис' : 'Почати запис'}
        >
          {isRecording ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
        </button>

        {/* Canvas для анімації хвилі */}
        <div className="flex-1 mx-4 h-12">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Кнопки X і ✓ */}
        <div className="flex items-center gap-2">
          <button
            onClick={cancelRecording}
            disabled={!isRecording && !isProcessing}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording || isProcessing
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Скасувати"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <button
            onClick={sendRecording}
            disabled={!isRecording && !isProcessing}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording || isProcessing
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Відправити"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Статус текст */}
      <div className="mt-2 text-center">
        <p className="text-sm text-gray-400" aria-live="polite">
          {getStatusText()}
        </p>
      </div>

      {/* Помилка */}
      {error && (
        <div className="mt-2 text-center">
          <p className="text-sm text-red-400" aria-live="assertive">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatGPTVoiceInput;
