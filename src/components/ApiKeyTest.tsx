'use client';

import React, { useState } from 'react';

const ApiKeyTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testApiKey = async () => {
    setIsTesting(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ API ключ працює! Сесія створена: ${data.id}`);
      } else {
        const errorData = await response.json();
        setError(`❌ Помилка: ${errorData.error}`);
      }
    } catch (error) {
      setError(`❌ Помилка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-blue-800 dark:text-blue-200 font-bold mb-4">Тест API ключа OpenAI</h3>
      
      <div className="space-y-4">
        <button
          onClick={testApiKey}
          disabled={isTesting}
          className={`px-4 py-2 rounded ${
            isTesting 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isTesting ? 'Тестування...' : 'Тестувати API ключ'}
        </button>

        {result && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200">
            {result}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Як налаштувати:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Створіть файл <code>.env.local</code> в корені проекту</li>
            <li>Додайте обидва ключі:</li>
            <li><code>OPENAI_API_KEY=your_key_here</code></li>
            <li><code>NEXT_PUBLIC_OPENAI_API_KEY=your_key_here</code></li>
            <li>Перезапустіть сервер: <code>npm run dev</code></li>
            <li>Натисніть кнопку вище для тестування</li>
          </ol>
          <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Обидва ключі повинні мати однакове значення
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyTest;
