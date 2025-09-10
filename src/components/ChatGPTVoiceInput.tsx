'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatGPTVoiceInputProps {
  disabled?: boolean;
  className?: string;
  onTranscript?: (text: string) => void;
  onClose?: () => void;
}

const ChatGPTVoiceInput: React.FC<ChatGPTVoiceInputProps> = ({ 
  disabled = false,
  className = "",
  onTranscript,
  onClose
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
    if (!streamRef.current) return;
    
    setIsRecording(false);
    setStatus('processing');
    setIsProcessing(true);
    
    try {
      // Створюємо MediaRecorder для запису
      const mediaRecorder = new MediaRecorder(streamRef.current);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      // Записуємо аудіо
      mediaRecorder.start();
      
      // Зупиняємо через 3 секунди (або можна додати кнопку зупинки)
      setTimeout(() => {
        mediaRecorder.stop();
      }, 3000);
      
      mediaRecorder.onstop = async () => {
        try {
          // Створюємо Blob з аудіо даних
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          if (audioBlob.size < 1000) {
            setError('Запис занадто короткий');
            setIsProcessing(false);
            return;
          }
          
          // Створюємо FormData для відправки
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('language', language);
          
          // Відправляємо на Whisper API
          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Помилка розпізнавання мови');
          }
          
          const result = await response.json();
          
          if (result.text && result.text.trim()) {
            setStatus('sent');
            
            // Відправляємо результат
            if (onTranscript) {
              onTranscript(result.text);
            }
          } else {
            setError('Не вдалося розпізнати мову');
          }
          
        } catch (error) {
          console.error('Error processing audio:', error);
          setError('Помилка обробки аудіо');
        } finally {
          setIsProcessing(false);
          cleanup();
        }
      };
      
    } catch (error) {
      console.error('Error sending recording:', error);
      setError('Помилка відправки');
      setIsProcessing(false);
      cleanup();
    }
  }, [cleanup, onTranscript, language]);

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

  // Ефект для початкової анімації та автоматичного старту
  useEffect(() => {
    // Запускаємо початкову анімацію
    drawFrame();
    
    // Автоматично починаємо запис при монтуванні
    if (!disabled) {
      startListening();
    }
  }, [drawFrame, disabled, startListening]);

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
    <div className={`w-full h-full flex items-center justify-between px-4 ${className}`}>
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
  );
};

export default ChatGPTVoiceInput;
