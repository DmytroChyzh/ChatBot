import { ConversationType, Message } from '../types/chat';

// Ключові слова для визначення типу розмови
const PROJECT_KEYWORDS = [
  // Українська - тільки слова, що означають створення НОВОГО проєкту
  'розробити', 'створити', 'зробити', 'побудувати', 'замовити',
  'новий проєкт', 'новий сайт', 'новий додаток', 'новий дизайн',
  'інтернет-магазин', 'лендінг', 'портал', 'система', 'платформа',
  'мобільний додаток', 'веб-додаток', 'електронна комерція',
  
  // English - тільки слова, що означають створення НОВОГО проєкту
  'develop', 'create', 'build', 'make', 'order', 'new project',
  'new website', 'new app', 'new design', 'e-commerce', 
  'landing page', 'portal', 'system', 'platform',
  'mobile app', 'web application', 'online store'
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
          projectScore += 2; // Більший вага для проєктних ключових слів
        }
      });
      
      ESTIMATE_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword)) {
          estimateScore += 1.5;
        }
      });
      
      GENERAL_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword)) {
          generalScore += 1;
        }
      });
    }
  });

  // РОЗУМНА ЛОГІКА: Перевіряємо контекст
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (lastUserMessage) {
    const content = lastUserMessage.content.toLowerCase();
    
    // Якщо це загальне питання про команду/досвід - НЕ проєкт
    if (content.includes('команда') || content.includes('досвід') || 
        content.includes('портфоліо') || content.includes('кейси') ||
        content.includes('team') || content.includes('experience') ||
        content.includes('portfolio') || content.includes('cases')) {
      
      // Перевіряємо, чи НЕ містить це проєктні наміри
      const hasProjectIntent = content.includes('розробити') || 
                              content.includes('створити') || 
                              content.includes('зробити') ||
                              content.includes('develop') || 
                              content.includes('create') || 
                              content.includes('build');
      
      if (!hasProjectIntent) {
        return 'general'; // Примусово загальна розмова
      }
    }
  }

  // Визначаємо тип на основі балів
  if (projectScore > 0 && estimateScore > 0) {
    return 'estimate';
  } else if (projectScore > 0) {
    return 'project';
  } else {
    return 'general';
  }
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
  if (conversationType === 'project' && estimateStep >= 4) return true;
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
