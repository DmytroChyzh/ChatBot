import React, { useState } from 'react';
import SimpleVoiceDictation from './SimpleVoiceDictation';
import AnnyangVoiceDictation from './AnnyangVoiceDictation';

interface VoiceDictationSelectorProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceDictationSelector: React.FC<VoiceDictationSelectorProps> = ({ 
  onTextReceived, 
  disabled = false,
  className = ""
}) => {
  const [method, setMethod] = useState<'simple' | 'annyang'>('simple');

  return (
    <div className="relative">
      {/* Перемикач методів */}
      <div className="absolute -top-8 left-0 flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setMethod('simple')}
          className={`px-2 py-1 text-xs rounded ${
            method === 'simple' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
          title="Простий метод"
        >
          Simple
        </button>
        <button
          onClick={() => setMethod('annyang')}
          className={`px-2 py-1 text-xs rounded ${
            method === 'annyang' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
          title="Annyang метод"
        >
          Annyang
        </button>
      </div>

      {/* Компонент диктовки */}
      {method === 'simple' ? (
        <SimpleVoiceDictation 
          onTextReceived={onTextReceived}
          disabled={disabled}
          className={className}
        />
      ) : (
        <AnnyangVoiceDictation 
          onTextReceived={onTextReceived}
          disabled={disabled}
          className={className}
        />
      )}
    </div>
  );
};

export default VoiceDictationSelector;
