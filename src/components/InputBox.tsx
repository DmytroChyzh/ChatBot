import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import VoiceDictationButton from './VoiceDictationButton';
import DictationMode from './DictationMode';
import VoiceChatButton from './VoiceChatButton';
import VoiceChatRobot from './VoiceChatRobot';
import VoiceWaveIndicator from './VoiceWaveIndicator';

interface InputBoxProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
  disabled?: boolean;
  projectComplete?: boolean;
  sessionId?: string | null;
  onAddMessage?: (message: { role: 'user' | 'assistant', content: string, timestamp: Date }) => Promise<void>;
  onStartVoiceChat?: () => void;
}

const InputBox: React.FC<InputBoxProps> = ({ 
  value, 
  onChange, 
  onSend, 
  loading, 
  disabled, 
  projectComplete,
  sessionId,
  onAddMessage,
  onStartVoiceChat
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();
  const [isDictating, setIsDictating] = useState(false);
  
  // Voice Chat states
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Voice Chat refs
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle dictation start
  const handleStartDictation = () => {
    setIsDictating(true);
  };

  // Handle dictation confirm
  const handleDictationConfirm = (text: string) => {
    onChange(text);
    setIsDictating(false);
  };

  // Handle dictation cancel
  const handleDictationCancel = () => {
    setIsDictating(false);
  };

  // Voice Chat handlers
  const handleStartVoiceChat = async () => {
    if (isVoiceChatActive) {
      // Stop voice chat
      stopVoiceChat();
    } else {
      // Start voice chat
      await startVoiceChat();
    }
  };

  const startVoiceChat = async () => {
    try {
      setIsVoiceChatActive(true);
      setIsListening(true);
      
      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'auto';

      recognitionRef.current.onstart = () => {
        console.log('Voice chat started');
        setIsListening(true);
      };

      recognitionRef.current.onresult = async (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('Voice chat transcript:', finalTranscript);
          
          // Add user message
          if (onAddMessage) {
            await onAddMessage({
              role: 'user',
              content: finalTranscript.trim(),
              timestamp: new Date()
            });
          }
          
          // Process with AI
          await processWithAI(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice chat error:', event.error);
        if (event.error !== 'aborted') {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Start listening
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('Error starting voice chat:', error);
      setIsVoiceChatActive(false);
      setIsListening(false);
    }
  };

  const stopVoiceChat = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceChatActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
  };

  const processWithAI = async (text: string) => {
    try {
      setIsProcessing(true);
      setIsListening(false);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: [],
          sessionId: sessionId || 'voice-chat'
        }),
      });

      if (!response.ok) {
        throw new Error('AI API error');
      }

      const result = await response.json();
      
      if (result.content) {
        // Add assistant message
        if (onAddMessage) {
          await onAddMessage({
            role: 'assistant',
            content: result.content,
            timestamp: new Date()
          });
        }
        
        // Convert to speech
        await convertToSpeech(result.content);
      }
      
    } catch (error) {
      console.error('Error processing with AI:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'en'
        }),
      });

      if (!response.ok) {
        throw new Error('TTS API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        // Restart listening
        if (isVoiceChatActive) {
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 500);
        }
      };

      await audio.play();
    } catch (error) {
      console.error('Error converting to speech:', error);
      setIsSpeaking(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 220) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading && !disabled) onSend();
    }
  };

  // If project is completed, show message instead of input
  if (projectComplete) {
    return (
      <>
        {/* Voice Chat Robot */}
        <VoiceChatRobot
          isActive={isVoiceChatActive}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
        />
        
        <div className="w-full max-w-[900px] mx-auto my-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-3xl px-8 py-6 transition-colors duration-300 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">{t('chat.projectCompleted')}</h3>
          </div>
          <p className="text-green-700 dark:text-green-300">
            {t('chat.projectCompletedMessage')}
          </p>
        </div>
      </>
    );
  }

  // Show dictation mode if active
  if (isDictating) {
    return (
      <>
        {/* Voice Chat Robot */}
        <VoiceChatRobot
          isActive={isVoiceChatActive}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
        />
        
        <div className="w-full max-w-[900px] mx-auto my-6">
          <DictationMode
            onConfirm={handleDictationConfirm}
            onCancel={handleDictationCancel}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Voice Chat Robot */}
      <VoiceChatRobot
        isActive={isVoiceChatActive}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
      />
      
      <div className="w-full max-w-[900px] mx-auto my-6">
        {/* Voice Wave Indicator */}
        <VoiceWaveIndicator
          isActive={isVoiceChatActive}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          audioLevel={audioLevel}
        />
        
        <div
          className="w-full bg-[hsl(var(--input-bg))] border-2 border-accent rounded-3xl px-8 py-0 flex flex-col justify-between min-h-[128px] transition-colors duration-300 shadow-md focus-within:ring-2 focus-within:ring-accent"
          style={{ position: 'relative' }}
        >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={t('chat.inputPlaceholder')}
        rows={1}
        className="bg-transparent border-none outline-none resize-none text-base text-foreground min-h-[48px] max-h-[220px] leading-[1.5] pt-5 pb-0 px-0 w-full box-border placeholder-muted-foreground transition-colors duration-300"
        disabled={loading || disabled}
        autoComplete="off"
      />
      <div
        className="flex flex-row-reverse items-end gap-2 pb-4 w-full"
      >
        {/* Літачок */}
        <button
          type="button"
          onClick={() => value.trim() && !loading && !disabled && onSend()}
          disabled={loading || disabled}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted/80 transition-colors duration-300 opacity-100 pointer-events-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8B8B93"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 transition-colors duration-300"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>

        {/* Voice Dictation Button */}
        <VoiceDictationButton 
          disabled={loading || disabled}
          onTranscript={onChange}
          onStartDictation={handleStartDictation}
          isDictating={isDictating}
        />

        {/* Voice Chat Button */}
        <VoiceChatButton 
          onClick={handleStartVoiceChat}
          disabled={loading || disabled}
        />

      </div>
    </div>
    </>
  );
};

export default InputBox; 