import React, { useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface InputBoxProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
  disabled?: boolean;
  projectComplete?: boolean;
  // Voice props
  isVoiceActive?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  onVoiceInput?: (text: string) => void;
  onToggleVoice?: () => void;
}

const InputBox: React.FC<InputBoxProps> = ({ 
  value, 
  onChange, 
  onSend, 
  loading, 
  disabled, 
  projectComplete,
  isVoiceActive = false,
  isListening: externalIsListening = false,
  isSpeaking = false,
  onVoiceInput,
  onToggleVoice
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();
  const [localIsListening, setLocalIsListening] = useState(false);
  
  // Використовуємо зовнішній стан або локальний
  const isListening = externalIsListening || localIsListening;

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
    <div
      className="w-full max-w-[900px] mx-auto my-6 bg-[hsl(var(--input-bg))] border-2 border-accent rounded-3xl px-8 py-0 flex flex-col justify-between min-h-[128px] transition-colors duration-300 shadow-md focus-within:ring-2 focus-within:ring-accent"
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
        {/* Голосова кнопка */}
        {onToggleVoice && (
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={loading || disabled}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
              isVoiceActive 
                ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
            }`}
            title={isVoiceActive ? t('voice.disable') : t('voice.enable')}
          >
            {isVoiceActive ? (
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
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
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
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            )}
          </button>
        )}
        
        {/* Кнопка запису голосу */}
        {onVoiceInput && isVoiceActive && (
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                // Зупинити запис
                setLocalIsListening(false);
              } else {
                // Почати запис
                setLocalIsListening(true);
                // Тут буде логіка запису голосу
              }
            }}
            disabled={loading || disabled}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isListening ? t('voice.stopRecording') : t('voice.startRecording')}
          >
            {isListening ? (
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
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputBox; 