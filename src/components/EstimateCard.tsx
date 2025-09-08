import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  DollarSign, 
  Clock, 
  Users, 
  Phone, 
  TrendingDown, 
  CheckCircle,
  ArrowRight,
  Target
} from 'lucide-react';

interface EstimateCardProps {
  estimate: {
    currentRange: { min: number; max: number };
    initialRange: { min: number; max: number };
    currency: string;
    confidence: 'low' | 'medium' | 'high';
    estimatedAt: Date;
    timeline: string;
    team: {
      designers: string[];
      contactPerson: string;
      contactEmail: string;
    };
    phases: {
      research: string;
      wireframing: string;
      design: string;
      prototyping: string;
      testing: string;
    };
    phaseDescriptions?: {
      research: string;
      wireframing: string;
      design: string;
      prototyping: string;
      testing: string;
    };
  };
  estimateStep: number;
  conversationType: 'general' | 'project' | 'estimate';
  onContactManager: () => void;
  isVisible: boolean;
}

const EstimateCard: React.FC<EstimateCardProps> = ({ 
  estimate, 
  estimateStep,
  conversationType,
  onContactManager, 
  isVisible 
}) => {
  const { t, language } = useLanguage();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Додаємо логування для дебагу
  console.log('EstimateCard render:', {
    estimate,
    estimateStep,
    conversationType,
    isVisible,
    currentRange: estimate.currentRange,
    timeline: estimate.timeline
  });

  if (!isVisible) return null;

  // Розраховуємо відсоток звуження діапазону
  const initialRange = estimate.initialRange.max - estimate.initialRange.min;
  const currentRange = estimate.currentRange.max - estimate.currentRange.min;
  const narrowingPercentage = ((initialRange - currentRange) / initialRange) * 100;

  // Отримуємо колір впевненості
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Отримуємо текст впевненості
  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high': return language === 'uk' ? 'Висока точність' : 'High accuracy';
      case 'medium': return language === 'uk' ? 'Середня точність' : 'Medium accuracy';
      case 'low': return language === 'uk' ? 'Низька точність' : 'Low accuracy';
      default: return language === 'uk' ? 'Невизначена точність' : 'Unknown accuracy';
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 cosmic:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 cosmic:border-gray-700 overflow-hidden flex flex-col estimate-card-scrollbar">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {language === 'uk' ? 'Естімейт Проекту' : 'Project Estimate'}
            </h3>
            <p className="text-sm text-white/80">
              {language === 'uk' ? 'Живий розрахунок вартості' : 'Live cost calculation'}
            </p>
          </div>
        </div>
      </div>

      {/* Основна інформація */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Діапазон цін */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'uk' ? 'Діапазон вартості' : 'Cost Range'}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 transition-all duration-500">
            {estimate.currentRange.min === 0 && estimate.currentRange.max === 0 ? (
              <span className="text-gray-500">{language === 'uk' ? 'Визначається...' : 'Determining...'}</span>
            ) : (
              <span className="animate-pulse">
                ${estimate.currentRange.min.toLocaleString()} - ${estimate.currentRange.max.toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {estimate.currency} • {estimate.estimatedAt.toLocaleDateString()}
          </div>
        </div>

        {/* Індикатор звуження */}
        {estimate.currentRange.min > 0 && estimate.currentRange.max > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'uk' ? 'Точність естімейту' : 'Estimate Accuracy'}
              </span>
              <span className="text-sm font-bold text-purple-600">
                {narrowingPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${narrowingPercentage}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <TrendingDown className="w-4 h-4" />
              <span>
                {language === 'uk' 
                  ? `Діапазон звужено з ${estimate.initialRange.min.toLocaleString()} - ${estimate.initialRange.max.toLocaleString()} годин`
                  : `Range narrowed from ${estimate.initialRange.min.toLocaleString()} - ${estimate.initialRange.max.toLocaleString()} hours`
                }
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'uk' 
                ? 'Очікуємо деталі проєкту для розрахунку часу роботи...'
                : 'Waiting for project details to calculate work hours...'
              }
            </div>
          </div>
        )}

        {/* Час та команда */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {language === 'uk' ? 'Час виконання' : 'Timeline'}
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {estimate.timeline === 'Визначається...' ? (
                <span className="text-gray-500">{language === 'uk' ? 'Визначається...' : 'Determining...'}</span>
              ) : (
                estimate.timeline
              )}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {language === 'uk' ? 'Команда' : 'Team'}
              </span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              {estimate.team.designers.length === 0 ? (
                <span className="text-gray-500">{language === 'uk' ? 'Визначається...' : 'Determining...'}</span>
              ) : (
                `${estimate.team.designers.length} ${language === 'uk' ? 'дизайнерів' : 'designers'}`
              )}
            </div>
          </div>
        </div>

        {/* Години роботи */}
        {estimate.initialRange && estimate.initialRange.min > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                {language === 'uk' ? 'Години роботи' : 'Work Hours'}
              </span>
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              {estimate.initialRange.min} - {estimate.initialRange.max} {language === 'uk' ? 'годин' : 'hours'}
            </div>
          </div>
        )}

        {/* Фази проекту */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {language === 'uk' ? 'План робіт' : 'Work Plan'}
          </h4>
          <div className="space-y-2">
            {Object.entries(estimate.phases).map(([phaseKey, description]) => (
              <div key={phaseKey} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === phaseKey ? null : phaseKey)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {description}
                    </span>
                  </div>
                  <ArrowRight 
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      expandedPhase === phaseKey ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                
                {expandedPhase === phaseKey && (
                  <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {estimate.phaseDescriptions?.[phaseKey as keyof typeof estimate.phaseDescriptions] || 
                        (language === 'uk' 
                          ? 'Детальний опис етапу буде надано під час роботи над проектом.'
                          : 'Detailed stage description will be provided during project work.'
                        )
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Контактна особа */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              {language === 'uk' ? 'Контактна особа' : 'Contact Person'}
            </span>
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">
            <div className="font-medium">{estimate.team.contactPerson}</div>
            <div className="text-purple-600 dark:text-purple-400">{estimate.team.contactEmail}</div>
          </div>
          <div className="text-xs text-purple-500 dark:text-purple-300 mt-2">
            {language === 'uk' ? 'Ваш менеджер проекту' : 'Your project manager'}
          </div>
        </div>

        {/* CTA кнопка та пояснення - завжди внизу */}
        <div className="p-6 pt-0 space-y-4">
          <button
            onClick={() => {
              console.log('Contact manager button clicked!');
              onContactManager();
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Phone className="w-4 h-4" />
            {language === 'uk' ? 'Зв\'язатися з менеджером' : 'Contact Manager'}
          </button>

          {/* Пояснення */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {language === 'uk' 
              ? 'Це приблизний естімейт. Для точного розрахунку зв\'яжіться з нашим менеджером.'
              : 'This is an approximate estimate. For accurate calculation, contact our manager.'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateCard;
