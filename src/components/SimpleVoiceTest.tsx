'use client';

import React, { useState } from 'react';

const SimpleVoiceTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testOpenAIAPI = async () => {
    setIsTesting(true);
    setResult(null);
    setError(null);

    try {
      // Тестуємо створення сесії
      console.log('Testing OpenAI API...');
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Session data:', data);
        setResult(`✅ API працює! Сесія: ${data.id}`);
        
        // Тепер тестуємо WebSocket підключення
        await testWebSocket(data.id);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError(`❌ API помилка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setError(`❌ Помилка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testWebSocket = async (sessionId: string) => {
    try {
      console.log('Testing WebSocket connection...');
      
      // Спробуємо підключитися до WebSocket
      const ws = new WebSocket(`wss://api.openai.com/v1/realtime/sessions/${sessionId}?model=gpt-4o-realtime-preview`);
      
      const timeout = setTimeout(() => {
        ws.close();
        setError('❌ WebSocket timeout - не вдалося підключитися за 10 секунд');
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('WebSocket connected successfully!');
        setResult(prev => prev + '\n✅ WebSocket підключення працює!');
        ws.close();
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        setError('❌ WebSocket помилка - перевірте API ключ та мережу');
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log('WebSocket closed:', event.code, event.reason);
        if (event.code !== 1000) {
          setError(`❌ WebSocket закрито з кодом: ${event.code} - ${event.reason}`);
        }
      };

    } catch (error) {
      console.error('WebSocket test error:', error);
      setError(`❌ WebSocket тест помилка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
      <h3 className="text-purple-800 dark:text-purple-200 font-bold mb-4">Детальний тест OpenAI API</h3>
      
      <div className="space-y-4">
        <button
          onClick={testOpenAIAPI}
          disabled={isTesting}
          className={`px-4 py-2 rounded ${
            isTesting 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {isTesting ? 'Тестування...' : 'Тестувати API + WebSocket'}
        </button>

        {result && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 whitespace-pre-line">
            {result}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Цей тест перевіряє:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Створення сесії через наш API</li>
            <li>Підключення до WebSocket OpenAI</li>
            <li>Авторизацію та мережеві налаштування</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleVoiceTest;
