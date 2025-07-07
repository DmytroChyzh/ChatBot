import React, { useRef } from 'react';

interface InputBoxProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
  disabled?: boolean;
  projectComplete?: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ value, onChange, onSend, loading, disabled, projectComplete }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Якщо проєкт завершено, показуємо повідомлення замість input
  if (projectComplete) {
    return (
      <div className="w-full max-w-[900px] mx-auto my-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-3xl px-8 py-6 transition-colors duration-300 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Проєкт завершено!</h3>
        </div>
        <p className="text-green-700 dark:text-green-300">
          Дякуємо за інформацію! Наша команда проаналізує ваш проєкт та зв'яжеться з вами найближчим часом.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[900px] mx-auto my-6 bg-[#F7F8F9] dark:bg-[#18181C] border-2 border-[#8B5CF6] rounded-3xl px-8 py-0 flex flex-col justify-between min-h-[128px] transition-colors duration-300 shadow-lg focus-within:ring-2 focus-within:ring-[#8B5CF6]"
      style={{ position: 'relative' }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Запитайте будь-що"
        rows={1}
        className="block w-full mb-3 resize-none min-h-[48px] max-h-[220px] shadow-sm transition-all duration-200"
        disabled={loading || disabled}
        autoComplete="off"
      />
      <div className="flex flex-row-reverse items-end gap-3 pb-2 w-full">
        {/* Літачок */}
        <button
          type="button"
          onClick={() => value.trim() && !loading && !disabled && onSend()}
          disabled={loading || disabled}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6030FE] text-white shadow-lg text-xl font-bold hover:from-[#7C4DFF] hover:to-[#5E35B1] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
        {/* Мікрофон */}
        <button
          type="button"
          disabled
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#F7F8F9] text-[#8B5CF6] shadow border border-[#E5E7EB] cursor-not-allowed opacity-60"
          tabIndex={-1}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#8B5CF6]"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InputBox; 