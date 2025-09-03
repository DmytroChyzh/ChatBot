import React, { useState } from 'react';
import { QuickEstimate, ConversationType } from '../types/chat';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronDown, ChevronRight, Target, Clock, DollarSign } from 'lucide-react';

interface EstimatePanelProps {
  estimate: QuickEstimate;
  isVisible: boolean;
  conversationType: ConversationType;
  onBookCall: () => void;
  onContinueRefinement?: () => void;
}

export default function EstimatePanel({ 
  estimate, 
  isVisible, 
  conversationType,
  onBookCall, 
  onContinueRefinement 
}: EstimatePanelProps) {
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const { t } = useLanguage();

  if (!isVisible) return null;

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'Висока точність';
      case 'medium': return 'Середня точність';
      case 'low': return 'Низька точність';
      default: return 'Невизначена точність';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 animate-in slide-in-from-top-2 duration-300">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Швидкий естімейт проєкту
          </h3>
        </div>
        <div className={`text-sm font-medium ${getConfidenceColor(estimate.confidence)}`}>
          {getConfidenceText(estimate.confidence)}
        </div>
      </div>

      {/* Загальний діапазон */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Загальна вартість
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${estimate.totalRange.min.toLocaleString()} - ${estimate.totalRange.max.toLocaleString()}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {estimate.currency} • Оновлено {estimate.estimatedAt.toLocaleDateString()}
        </div>
      </div>

      {/* Розбивка по фазах */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Розбивка по фазах
        </h4>
        
        {Object.entries(estimate.phases).map(([phaseKey, phase]) => (
          <div key={phaseKey} className="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => togglePhase(phaseKey)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedPhases.includes(phaseKey) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {phaseKey === 'discovery' && 'Дослідження'}
                  {phaseKey === 'design' && 'Дизайн'}
                  {phaseKey === 'development' && 'Розробка'}
                  {phaseKey === 'testing' && 'Тестування'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ${phase.min.toLocaleString()} - ${phase.max.toLocaleString()}
              </div>
            </button>
            
            {expandedPhases.includes(phaseKey) && (
              <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {phase.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA кнопки */}
      <div className="space-y-3">
        <button
          onClick={onBookCall}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Забронювати дзвінок з менеджером
        </button>
        
        {onContinueRefinement && conversationType === 'project' && (
          <button
            onClick={onContinueRefinement}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Продовжити уточнення
          </button>
        )}
      </div>

      {/* Прогрес точності */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Точність естімейту</span>
          <span className="font-medium">
            {estimate.confidence === 'high' ? '95%' : 
             estimate.confidence === 'medium' ? '75%' : '50%'}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              estimate.confidence === 'high' ? 'bg-green-500' :
              estimate.confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ 
              width: estimate.confidence === 'high' ? '95%' : 
                     estimate.confidence === 'medium' ? '75%' : '50%' 
            }}
          />
        </div>
      </div>
    </div>
  );
}
