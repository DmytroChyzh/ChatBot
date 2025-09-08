import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoicePermissionHelperProps {
  isVisible: boolean;
  onClose: () => void;
}

const VoicePermissionHelper: React.FC<VoicePermissionHelperProps> = ({ isVisible, onClose }) => {
  const { language } = useLanguage();
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');

  useEffect(() => {
    if (isVisible && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setPermissionState(result.state);
      }).catch(() => {
        setPermissionState('unknown');
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'uk' ? 'Налаштування мікрофона' : 'Microphone Setup'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {language === 'uk' ? 'Дозвіл на мікрофон' : 'Microphone Permission'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'uk' 
                  ? 'Браузер потребує дозволу на використання мікрофона'
                  : 'Browser needs permission to use microphone'
                }
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 className="font-medium text-yellow-800 dark:text-yellow-200">
                  {language === 'uk' ? 'Як надати дозвіл:' : 'How to grant permission:'}
                </h5>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  <li>1. {language === 'uk' ? 'Натисніть на іконку замка в адресному рядку' : 'Click the lock icon in the address bar'}</li>
                  <li>2. {language === 'uk' ? 'Виберіть "Дозволити" для мікрофона' : 'Select "Allow" for microphone'}</li>
                  <li>3. {language === 'uk' ? 'Перезавантажте сторінку' : 'Reload the page'}</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h5 className="font-medium text-blue-800 dark:text-blue-200">
                  {language === 'uk' ? 'Підтримувані браузери:' : 'Supported browsers:'}
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {language === 'uk' 
                    ? 'Chrome, Edge, Safari (на macOS/iOS), Firefox (обмежена підтримка)'
                    : 'Chrome, Edge, Safari (on macOS/iOS), Firefox (limited support)'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {language === 'uk' ? 'Зрозуміло' : 'Got it'}
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {language === 'uk' ? 'Перезавантажити' : 'Reload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePermissionHelper;
