'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    totalMembers: number;
    uploadedMembers: number;
    errors: number;
    errorDetails: any[];
  };
}

const TeamUploader = () => {
  const { language } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleUpload = async () => {
    setIsUploading(true);
    setResult(null);

    try {
      const response = await fetch('/api/team/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: UploadResult = await response.json();
      setResult(result);

      if (result.success) {
        console.log('✅ Team data uploaded successfully!');
      } else {
        console.error('❌ Upload failed:', result);
      }
    } catch (error) {
      console.error('❌ Error during upload:', error);
      setResult({
        success: false,
        message: 'Upload failed due to network error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckInfo = async () => {
    try {
      const response = await fetch('/api/team/upload');
      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('❌ Error checking team info:', error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {language === 'uk' ? 'Завантаження команди в Firebase' : 'Upload Team to Firebase'}
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {language === 'uk' ? 'Завантаження...' : 'Uploading...'}
              </>
            ) : (
              <>
                🚀 {language === 'uk' ? 'Завантажити команду' : 'Upload Team'}
              </>
            )}
          </button>
          
          <button
            onClick={handleCheckInfo}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            ℹ️ {language === 'uk' ? 'Інформація' : 'Info'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className={`font-medium ${
              result.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {result.message}
            </div>
            
            {result.data && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div>📊 {language === 'uk' ? 'Всього учасників' : 'Total members'}: {result.data.totalMembers}</div>
                <div>✅ {language === 'uk' ? 'Завантажено' : 'Uploaded'}: {result.data.uploadedMembers}</div>
                {result.data.errors > 0 && (
                  <div>❌ {language === 'uk' ? 'Помилки' : 'Errors'}: {result.data.errors}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamUploader;
