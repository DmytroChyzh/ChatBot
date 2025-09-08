import React, { useState, useRef, useEffect } from 'react';

const VoiceTest: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Перевіряємо підтримку
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    console.log('Speech recognition support:', hasRecognition);
    setIsSupported(hasRecognition);

    if (hasRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'uk-UA';

      recognitionRef.current.onstart = () => {
        console.log('Voice test started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('Voice test result:', event);
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice test error:', event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Voice test ended');
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice test:', error);
        setError('Помилка запуску');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
        <h3 className="text-red-800 font-bold">Розпізнавання мови не підтримується</h3>
        <p className="text-red-600">Ваш браузер не підтримує розпізнавання мови</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-400 rounded-lg">
      <h3 className="text-blue-800 font-bold mb-4">Тест диктовки</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-4 py-2 rounded ${
              isListening 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {isListening ? 'Зупинити' : 'Почати'} диктовку
          </button>
        </div>

        {error && (
          <div className="p-2 bg-red-200 border border-red-400 rounded text-red-800">
            Помилка: {error}
          </div>
        )}

        {isListening && (
          <div className="p-2 bg-yellow-200 border border-yellow-400 rounded text-yellow-800">
            Слухаю... Говоріть!
          </div>
        )}

        {transcript && (
          <div className="p-2 bg-green-200 border border-green-400 rounded text-green-800">
            <strong>Розпізнано:</strong> {transcript}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTest;
