import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  onToggleVoice: () => void;
  isVoiceActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onVoiceInput,
  onToggleVoice,
  isVoiceActive,
  isListening,
  isSpeaking
}) => {
  const { t, language } = useLanguage();
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Перевіряємо підтримку браузера
  useEffect(() => {
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasSynthesis = 'speechSynthesis' in window;
      setIsSupported(hasRecognition && hasSynthesis);
    };
    checkSupport();
  }, []);

  // Ініціалізуємо розпізнавання мови
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'uk' ? 'uk-UA' : 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Voice recognition started');
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          onVoiceInput(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        console.log('Voice recognition ended');
      };
    }

    synthesisRef.current = window.speechSynthesis;
  }, [isSupported, language, onVoiceInput]);

  // Почати запис голосу
  const startListening = () => {
    if (recognitionRef.current && isVoiceActive) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
      }
    }
  };

  // Зупинити запис голосу
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Озвучити текст
  const speakText = (text: string) => {
    if (synthesisRef.current && isVoiceActive) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'uk' ? 'uk-UA' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthesisRef.current.speak(utterance);
    }
  };

  // Зупинити озвучування
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4 text-sm text-gray-500">
        {t('voice.notSupported')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      {/* Голосова активність */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          isVoiceActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className="text-xs text-muted-foreground">
          {isVoiceActive ? t('voice.active') : t('voice.inactive')}
        </span>
      </div>

      {/* Кнопка запису голосу */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!isVoiceActive}
        className={`p-2 rounded-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : isVoiceActive 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={isListening ? t('voice.stopRecording') : t('voice.startRecording')}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Кнопка озвучування */}
      <button
        onClick={isSpeaking ? stopSpeaking : () => speakText(transcript)}
        disabled={!isVoiceActive || !transcript}
        className={`p-2 rounded-full transition-all duration-200 ${
          isSpeaking 
            ? 'bg-orange-500 text-white animate-pulse' 
            : isVoiceActive && transcript
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={isSpeaking ? t('voice.stopSpeaking') : t('voice.speak')}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Кнопка перемикача голосу */}
      <button
        onClick={onToggleVoice}
        className={`p-2 rounded-full transition-all duration-200 ${
          isVoiceActive 
            ? 'bg-purple-500 hover:bg-purple-600 text-white' 
            : 'bg-gray-500 hover:bg-gray-600 text-white'
        }`}
        title={isVoiceActive ? t('voice.disable') : t('voice.enable')}
      >
        {isVoiceActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
      </button>

      {/* Індикатор запису */}
      {isListening && (
        <div className="flex items-center gap-1">
          <div className="flex space-x-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
          </div>
          <span className="text-xs text-red-500 font-medium">
            {t('voice.listening')}
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
