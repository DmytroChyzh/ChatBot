import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ChatGPTVoiceInput from './ChatGPTVoiceInput';
import HybridVoiceChat from './HybridVoiceChat';
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
}

const InputBox: React.FC<InputBoxProps> = ({ 
  value, 
  onChange, 
  onSend, 
  loading, 
  disabled, 
  projectComplete,
  sessionId,
  onAddMessage
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceInputVisible, setIsVoiceInputVisible] = useState(false);

  // Track voice activity
  useEffect(() => {
    if (isListening || isSpeaking) {
      setIsVoiceActive(true);
    } else {
      // Hide after a delay when both listening and speaking stop
      const timer = setTimeout(() => {
        setIsVoiceActive(false);
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isListening, isSpeaking]);


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
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto my-6">
      {/* Voice Wave Indicator - Only show when voice is active */}
      {isVoiceActive && (
        <VoiceWaveIndicator 
          isListening={isListening}
          isSpeaking={isSpeaking}
          className="mb-3"
        />
      )}
      
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

        {/* Голосовий чат (кнопка мікрофона) */}
        <button
          type="button"
          onClick={() => setIsVoiceInputVisible(!isVoiceInputVisible)}
          disabled={loading || disabled}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-200"
          title="Голосовий ввід"
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

          {/* Hybrid Voice Chat (ElevenLabs + OpenAI) */}
          <HybridVoiceChat 
            disabled={loading || disabled}
            onTranscript={onChange}
            onResponse={(text) => {
              // Handle AI response
              console.log('Hybrid AI Response:', text);
              setIsSpeaking(false);
            }}
            sessionId={sessionId}
            onAddMessage={onAddMessage}
            onListeningChange={setIsListening}
            onSpeakingChange={setIsSpeaking}
          />
        </div>
      </div>
      
      {/* Voice Input - всередині input box */}
      {isVoiceInputVisible && (
        <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50">
          <ChatGPTVoiceInput 
            disabled={loading || disabled}
            onTranscript={(text) => {
              onChange(text);
              setIsVoiceInputVisible(false); // Ховаємо voice input після відправки
            }}
            onClose={() => setIsVoiceInputVisible(false)}
          />
        </div>
      )}
    </div>
  );
};

export default InputBox; 