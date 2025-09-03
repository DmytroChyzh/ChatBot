import React from 'react';
import { ConversationType } from '../types/chat';
import { Target, CheckCircle, Clock } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  conversationType: ConversationType;
  isVisible: boolean;
}

export default function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  conversationType,
  isVisible 
}: ProgressIndicatorProps) {
  if (!isVisible) return null;

  // Показуємо тільки для проєктних розмов
  if (conversationType === 'general') return null;

  const progressPercentage = Math.min((currentStep / totalSteps) * 100, 100);
  const remainingSteps = Math.max(totalSteps - currentStep, 0);

  const getStepIcon = (step: number) => {
    if (step < currentStep) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (step === currentStep) {
      return <Target className="w-4 h-4 text-blue-500" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepText = (step: number) => {
    if (step < currentStep) {
      return 'Завершено';
    } else if (step === currentStep) {
      return 'Поточний крок';
    } else {
      return 'Очікує';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-4">
      {/* Заголовок прогресу */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Прогрес естімейту
          </h4>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Крок {currentStep} з {totalSteps}
        </div>
      </div>

      {/* Прогрес-бар */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Індикатор кроків */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
              index < currentStep 
                ? 'border-green-500 bg-green-100 dark:bg-green-900/20' 
                : index === currentStep 
                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
            }`}>
              {getStepIcon(index)}
            </div>
            <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Текст прогресу */}
      <div className="text-center">
        {remainingSteps > 0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Ще {remainingSteps} крок{remainingSteps === 1 ? '' : 'ів'}</span> до точнішого естімейту
          </div>
        ) : (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            🎉 Естімейт готовий!
          </div>
        )}
      </div>

      {/* Детальний опис поточного кроку */}
      {currentStep <= totalSteps && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
            Поточний крок:
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {currentStep === 1 && 'Визначення типу проєкту'}
            {currentStep === 2 && 'Опис функціональності'}
            {currentStep === 3 && 'Цільова аудиторія та бюджет'}
            {currentStep === 4 && 'Технічні вимоги'}
            {currentStep === 5 && 'Фінальне уточнення'}
          </div>
        </div>
      )}
    </div>
  );
}
