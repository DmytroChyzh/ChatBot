import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  DollarSign, 
  Clock, 
  Users, 
  TrendingDown, 
  CheckCircle,
  ArrowRight,
  Target,
  Search,
  Palette,
  Zap,
  Layers,
  Smartphone,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp
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
      'ux-research': string;
      'ui-design': string;
      'prototyping': string;
      'design-system': string;
      'mobile-adaptive': string;
    };
    phaseDescriptions?: {
      'ux-research': string;
      'ui-design': string;
      'prototyping': string;
      'design-system': string;
      'mobile-adaptive': string;
    };
  };
  estimateStep: number;
  conversationType: 'general' | 'project' | 'estimate';
  onContactManager: () => void;
  isVisible: boolean;
  hideHeader?: boolean; // New prop to hide header in modal
}

const EstimateCard: React.FC<EstimateCardProps> = ({ 
  estimate, 
  estimateStep,
  conversationType,
  onContactManager, 
  isVisible,
  hideHeader = false
}) => {
  const { t, language } = useLanguage();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedComplexity, setSelectedComplexity] = useState<string>('medium');

  // Функція для отримання описів фаз дизайну
  const getPhaseDescription = (phaseKey: string): string => {
    const descriptions: { [key: string]: string } = {
      'ux-research': language === 'uk' 
        ? 'Дослідження користувачів, аналіз потреб та створення user personas'
        : 'User research, needs analysis and user personas creation',
      'ui-design': language === 'uk'
        ? 'Створення візуального дизайну, макетів та інтерфейсів'
        : 'Visual design creation, layouts and interfaces',
      'prototyping': language === 'uk'
        ? 'Прототипування інтерактивності та тестування користувацького досвіду'
        : 'Interactive prototyping and user experience testing',
      'design-system': language === 'uk'
        ? 'Розробка дизайн-системи та компонентів для масштабування'
        : 'Design system and components development for scaling',
      'mobile-adaptive': language === 'uk'
        ? 'Адаптація дизайну для мобільних пристроїв та responsive версій'
        : 'Mobile device adaptation and responsive design versions'
    };
    return descriptions[phaseKey] || (language === 'uk'
      ? 'Детальний опис етапу буде надано під час роботи над проектом.'
      : 'Detailed stage description will be provided during project work.'
    );
  };

  // Функція для отримання іконок фаз
  const getPhaseIcon = (phaseKey: string) => {
    const icons = {
      'ux-research': Search,
      'ui-design': Palette,
      'prototyping': Zap,
      'design-system': Layers,
      'mobile-adaptive': Smartphone
    };
    return icons[phaseKey as keyof typeof icons] || Target;
  };

  // Функція для отримання кольорів фаз
  const getPhaseColor = (phaseKey: string) => {
    const colors = {
      'ux-research': 'from-blue-500 to-blue-600',
      'ui-design': 'from-purple-500 to-purple-600',
      'prototyping': 'from-yellow-500 to-orange-500',
      'design-system': 'from-green-500 to-green-600',
      'mobile-adaptive': 'from-pink-500 to-pink-600'
    };
    return colors[phaseKey as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  // Функція для отримання пріоритету фази
  const getPhasePriority = (phaseKey: string) => {
    const priorities = {
      'ux-research': 'high',
      'ui-design': 'high',
      'prototyping': 'medium',
      'design-system': 'medium',
      'mobile-adaptive': 'high'
    };
    return priorities[phaseKey as keyof typeof priorities] || 'medium';
  };

  // Функція для отримання термінів фаз
  const getPhaseTimeline = (phaseKey: string) => {
    const timelines = {
      'ux-research': language === 'uk' ? '1-2 тижні' : '1-2 weeks',
      'ui-design': language === 'uk' ? '2-4 тижні' : '2-4 weeks',
      'prototyping': language === 'uk' ? '1-2 тижні' : '1-2 weeks',
      'design-system': language === 'uk' ? '1-2 тижні' : '1-2 weeks',
      'mobile-adaptive': language === 'uk' ? '1-3 тижні' : '1-3 weeks'
    };
    return timelines[phaseKey as keyof typeof timelines] || (language === 'uk' ? '1-2 тижні' : '1-2 weeks');
  };

  // Функція для перемикання розгортання фази
  const togglePhaseExpansion = (phaseKey: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseKey)) {
      newExpanded.delete(phaseKey);
    } else {
      newExpanded.add(phaseKey);
    }
    setExpandedPhases(newExpanded);
  };

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
  const narrowingPercentage = initialRange > 0 ? Math.max(0, Math.min(100, ((initialRange - currentRange) / initialRange) * 100)) : 0;

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
    <div className="w-full max-w-md bg-white dark:bg-gray-800 cosmic-bg rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col estimate-card-scrollbar relative z-10 lg:max-w-md max-w-none">
      {/* Заголовок */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-bold text-white">
                {language === 'uk' ? 'Естімейт UI/UX Дизайну' : 'UI/UX Design Estimate'}
              </h3>
              <p className="text-xs lg:text-sm text-white/80">
                {language === 'uk' ? 'Розрахунок вартості дизайн-послуг' : 'Design services cost calculation'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Основна інформація */}
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 flex-1 overflow-y-auto">
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
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
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
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
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
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
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

        {/* Фази проекту з покращеннями */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'uk' ? 'Етапи дизайн-процесу' : 'Design Process Stages'}
              </h4>
              {/* Загальний прогрес проекту */}
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000" style={{ width: '75%' }} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">75%</span>
              </div>
            </div>
            {/* Селектор складності */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'uk' ? 'Складність:' : 'Complexity:'}
              </span>
              <select
                value={selectedComplexity}
                onChange={(e) => setSelectedComplexity(e.target.value)}
                className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <option value="simple">{language === 'uk' ? 'Простий' : 'Simple'}</option>
                <option value="medium">{language === 'uk' ? 'Середній' : 'Medium'}</option>
                <option value="complex">{language === 'uk' ? 'Складний' : 'Complex'}</option>
                <option value="enterprise">{language === 'uk' ? 'Enterprise' : 'Enterprise'}</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(estimate.phases).map(([phaseKey, description]) => {
              // Мапінг назв фаз для відображення
              const getPhaseDisplayName = (key: string) => {
                const phaseNames: { [key: string]: string } = {
                  'ux-research': language === 'uk' ? 'UX Дослідження' : 'UX Research',
                  'ui-design': language === 'uk' ? 'UI Дизайн' : 'UI Design',
                  'prototyping': language === 'uk' ? 'Прототипування' : 'Prototyping',
                  'design-system': language === 'uk' ? 'Дизайн-система' : 'Design System',
                  'mobile-adaptive': language === 'uk' ? 'Мобільна адаптація' : 'Mobile Adaptive'
                };
                return phaseNames[key] || description;
              };

              const PhaseIcon = getPhaseIcon(phaseKey);
              const phaseColor = getPhaseColor(phaseKey);
              const priority = getPhasePriority(phaseKey);
              const timeline = getPhaseTimeline(phaseKey);
              const isExpanded = expandedPhases.has(phaseKey);

              // Розрахунок прогрес-бару (симуляція)
              const progressPercentage = Math.floor(Math.random() * 40) + 60; // 60-100%

              return (
                <div key={phaseKey} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
                  <button
                    onClick={() => togglePhaseExpansion(phaseKey)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Іконка фази з кольоровим градієнтом */}
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${phaseColor} text-white`}>
                        <PhaseIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getPhaseDisplayName(phaseKey)}
                          </span>
                          {/* Пріоритет */}
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            priority === 'high' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {priority === 'high' ? '🔥' : priority === 'medium' ? '⭐' : '✅'} {priority}
                          </div>
                        </div>
                        
                        {/* Прогрес-бар з анімацією */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${phaseColor} transition-all duration-1000 ease-out animate-pulse`}
                            style={{ 
                              width: `${progressPercentage}%`,
                              animationDelay: `${Math.random() * 0.5}s`
                            }}
                          />
                        </div>
                        
                        {/* Мета-інформація */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {timeline}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {progressPercentage}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Кнопка розгортання */}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 transition-transform" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 transition-transform" />
                    )}
                  </button>
                  
                  {/* Розгорнутий контент */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <div className="pt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {estimate.phaseDescriptions?.[phaseKey as keyof typeof estimate.phaseDescriptions] || 
                            getPhaseDescription(phaseKey)
                          }
                        </p>
                        
                        {/* Додаткові деталі фази */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {language === 'uk' ? 'Статус' : 'Status'}
                            </div>
                            <div className="text-green-600 dark:text-green-400">
                              {language === 'uk' ? 'В процесі' : 'In Progress'}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {language === 'uk' ? 'Команда' : 'Team'}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400">
                              {priority === 'high' ? '2-3 дизайнери' : '1-2 дизайнери'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* CTA кнопка та пояснення - завжди внизу */}
        <div className="p-4 lg:p-6 pt-0 space-y-3 lg:space-y-4">
          <button
            onClick={() => {
              console.log('Contact manager button clicked!');
              onContactManager();
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 lg:py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm lg:text-base"
          >
            <span className="hidden sm:inline">{language === 'uk' ? 'Зв\'язатися з менеджером' : 'Contact Manager'}</span>
            <span className="sm:hidden">{language === 'uk' ? 'Зв\'язатися' : 'Contact'}</span>
          </button>

          {/* Пояснення */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {language === 'uk' 
              ? 'Це приблизний естімейт дизайн-послуг. Для точного розрахунку зв\'яжіться з нашим менеджером.'
              : 'This is an approximate design services estimate. For accurate calculation, contact our manager.'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateCard;
