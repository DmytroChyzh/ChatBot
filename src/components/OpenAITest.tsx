'use client';

import React, { useState } from 'react';

const OpenAITest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testOpenAIAPI = async () => {
    setIsTesting(true);
    setResult(null);
    setError(null);

    try {
      console.log('Testing OpenAI API access...');
      
      // Тестуємо звичайний API спочатку
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Привіт! Це тест API.'
            }
          ]
        }),
      });

      console.log('Regular API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Regular API works:', data);
        setResult('✅ Звичайний OpenAI API працює!');
        
        // Тепер тестуємо Realtime API
        await testRealtimeAPI();
      } else {
        const errorData = await response.json();
        console.error('Regular API error:', errorData);
        setError(`❌ Звичайний API не працює: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setError(`❌ Помилка тесту: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testRealtimeAPI = async () => {
    try {
      console.log('Testing Realtime API...');
      
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Realtime API response status:', response.status);
      console.log('Realtime API response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Realtime API works:', data);
        setResult(prev => prev + '\n✅ Realtime API працює!');
        
        // Тестуємо WebSocket
        await testWebSocket(data.id);
      } else {
        const errorData = await response.json();
        console.error('Realtime API error:', errorData);
        setError(prev => prev + `\n❌ Realtime API не працює: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error('Realtime API test error:', error);
      setError(prev => prev + `\n❌ Realtime API помилка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testWebSocket = async (sessionId: string) => {
    try {
      console.log('Testing WebSocket connection...');
      
      // Отримуємо WebSocket URL
      const wsResponse = await fetch(`/api/websocket?sessionId=${sessionId}`);
      if (!wsResponse.ok) {
        throw new Error('Failed to get WebSocket URL');
      }
      
      const { wsUrl, apiKey } = await wsResponse.json();
      console.log('WebSocket URL:', wsUrl);
      console.log('API Key present:', !!apiKey);
      
      // Тестуємо WebSocket підключення
      const ws = new WebSocket(`${wsUrl}&api_key=${apiKey}`);
      
      const timeout = setTimeout(() => {
        ws.close();
        setError(prev => prev + '\n❌ WebSocket timeout - не вдалося підключитися за 10 секунд');
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
        setError(prev => prev + '\n❌ WebSocket помилка - перевірте API ключ та мережу');
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log('WebSocket closed:', event.code, event.reason);
        if (event.code !== 1000 && event.code !== 1001) {
          setError(prev => prev + `\n❌ WebSocket закрито з кодом: ${event.code} - ${event.reason}`);
        }
      };

    } catch (error) {
      console.error('WebSocket test error:', error);
      setError(prev => prev + `\n❌ WebSocket тест помилка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
      <h3 className="text-orange-800 dark:text-orange-200 font-bold mb-4">Детальний тест OpenAI API</h3>
      
      <div className="space-y-4">
        <button
          onClick={testOpenAIAPI}
          disabled={isTesting}
          className={`px-4 py-2 rounded ${
            isTesting 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {isTesting ? 'Тестування...' : 'Тестувати всі API'}
        </button>

        {result && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 whitespace-pre-line">
            {result}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Цей тест перевіряє:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Звичайний OpenAI API (chat completions)</li>
            <li>Realtime API (створення сесії)</li>
            <li>WebSocket підключення</li>
            <li>Авторизацію та мережеві налаштування</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OpenAITest;
