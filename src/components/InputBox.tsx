import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import VoiceDictationButton from './VoiceDictationButton';
import DictationMode from './DictationMode';
import VoiceChatButton from './VoiceChatButton';

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

  // Show dictation mode if active
  if (isDictating) {
    return (
      <div className="w-full max-w-[900px] mx-auto my-6">
        <DictationMode
          onConfirm={handleDictationConfirm}
          onCancel={handleDictationCancel}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto my-6">
      
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
        {onStartVoiceChat && (
          <VoiceChatButton 
            onClick={onStartVoiceChat}
            disabled={loading || disabled}
          />
        )}

        </div>
      </div>
    </div>
  );
};

export default InputBox; 