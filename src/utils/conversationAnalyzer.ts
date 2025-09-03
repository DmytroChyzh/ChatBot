import { ConversationType, Message } from '../types/chat';

// Ключові слова для визначення типу розмови
const PROJECT_KEYWORDS = [
  // Українська - слова про створення/розробку проекту
  'розробити', 'створити', 'зробити', 'побудувати', 'замовити',
  'новий проєкт', 'новий сайт', 'новий додаток', 'новий дизайн',
  'інтернет-магазин', 'лендінг', 'портал', 'система', 'платформа',
  'мобільний додаток', 'веб-додаток', 'електронна комерція',
  'редизайн', 'переробити', 'покращити', 'оновлювати',
  'автомобілі', 'продаж', 'апка', 'додаток',
  
  // English - слова про створення/розробку проекту
  'develop', 'create', 'build', 'make', 'order', 'new project',
  'new website', 'new app', 'new design', 'e-commerce', 
  'landing page', 'portal', 'system', 'platform',
  'mobile app', 'web application', 'online store',
  'redesign', 'rebuild', 'improve', 'update'
];

const ESTIMATE_KEYWORDS = [
  // Українська
  'скільки коштує', 'вартість', 'ціна', 'бюджет', 'естімейт',
  'розрахунок', 'оцінка', 'терміни', 'скільки часу',
  
  // English
  'how much', 'cost', 'price', 'budget', 'estimate',
  'calculation', 'timeline', 'how long', 'duration'
];

const GENERAL_KEYWORDS = [
  // Українська
  'команда', 'компанія', 'портфоліо', 'досвід', 'кейси',
  'технології', 'процеси', 'підхід', 'методологія',
  
  // English
  'team', 'company', 'portfolio', 'experience', 'cases',
  'technologies', 'processes', 'approach', 'methodology'
];

/**
 * Аналізує повідомлення та визначає тип розмови
 */
export function analyzeConversationType(messages: Message[]): ConversationType {
  if (!messages || messages.length === 0) {
    return 'general';
  }

  // Рахуємо ключові слова для кожного типу
  let projectScore = 0;
  let estimateScore = 0;
  let generalScore = 0;

  messages.forEach(message => {
    if (message.role === 'user') {
      const content = message.content.toLowerCase();
      
      // Перевіряємо ключові слова
      PROJECT_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword)) {
          projectScore += 3; // Більший вага для проєктних ключових слів
        }
      });
      
      ESTIMATE_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword)) {
          estimateScore += 2;
        }
      });
      
      GENERAL_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword)) {
          generalScore += 1;
        }
      });
    }
  });

  // СПРОЩЕНА ЛОГІКА: Якщо є проектні ключові слова - це проект
  if (projectScore > 0) {
    if (estimateScore > 0) {
      return 'estimate';
    } else {
      return 'project';
    }
  }

  // Якщо немає проектних намірів - загальна розмова
  return 'general';
}

/**
 * Визначає, чи потрібно показувати картку проєкту
 */
export function shouldShowProjectCard(conversationType: ConversationType): boolean {
  return conversationType === 'project' || conversationType === 'estimate';
}

/**
 * Визначає, чи потрібно показувати естімейт
 */
export function shouldShowEstimate(conversationType: ConversationType, estimateStep: number): boolean {
  if (conversationType === 'general') return false;
  if (conversationType === 'estimate') return true;
  if (conversationType === 'project' && estimateStep >= 2) return true;
  return false;
}

/**
 * Отримує наступний крок естімейту
 */
export function getNextEstimateStep(conversationType: ConversationType, currentStep: number): number {
  if (conversationType === 'general') return 0;
  if (conversationType === 'estimate') return currentStep + 1;
  if (conversationType === 'project') return currentStep + 1;
  return currentStep;
}
