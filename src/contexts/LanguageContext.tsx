
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'uk';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  en: {
    // Header
    'header.title': 'Cieden Assistant',
    'header.clearSession': 'Clear session',
    'header.lightTheme': 'Light theme',
    'header.darkTheme': 'Dark theme',
    
    // Contact Form
    'contact.title': 'Assistant',
    'contact.subtitle': 'Tell us about your project',
    'contact.namePlaceholder': 'Your name',
    'contact.emailPlaceholder': 'Email',
    'contact.startButton': 'Start Conversation',
    
    // Chat
    'chat.welcome': 'Hello, {name}! 👋',
    'chat.subtitle': 'Tell us about your project or choose one of the options below',
    'chat.inputPlaceholder': 'Ask anything about your project...',
    'chat.projectCompleted': 'Project completed!',
    'chat.projectCompletedMessage': 'Thank you for the information! Our team will analyze your project and contact you soon.',
    
    // Quick Prompts
    'prompts.newProject.title': 'New Project',
    'prompts.newProject.desc': 'Start from scratch',
    'prompts.redesign.title': 'Redesign',
    'prompts.redesign.desc': 'Improve an existing product',
    'prompts.consultation.title': 'Consultation',
    'prompts.consultation.desc': 'Get expert advice',
    'prompts.estimate.title': 'Project Estimate',
    'prompts.estimate.desc': 'Find out cost and timeline',
    'prompts.team.title': 'Team',
    'prompts.team.desc': 'Learn about Cieden',
    'prompts.portfolio.title': 'Portfolio',
    'prompts.portfolio.desc': 'See work examples',
    
    // Project Card
    'projectCard.title': 'Project',
    'projectCard.subtitle': 'Live Project Card',
    'projectCard.completion': 'Completion',
    'projectCard.projectName': 'Project Name',
    'projectCard.projectType': 'Project Type',
    'projectCard.description': 'Description',
    'projectCard.targetAudience': 'Target Audience',
    'projectCard.features': 'Features',
    'projectCard.budget': 'Budget',
    'projectCard.timeline': 'Timeline',
    'projectCard.competitors': 'Competitors',
    'projectCard.website': 'Website',
    'projectCard.waitingForInfo': 'Waiting for information...',
    'projectCard.draft': 'Draft',
    'projectCard.confirmed': 'Confirmed',
    'projectCard.confirm': 'Confirm',
    'projectCard.reject': 'Reject',
    'projectCard.edit': 'Edit',
    'projectCard.save': 'Save',
    'projectCard.cancel': 'Cancel',
    'projectCard.editPlaceholder': 'Edit this field...',
    'projectCard.completionMessage': 'Project Card Complete! 🎉',
    'projectCard.completionDescription': 'Your project information is ready. Click the button below to send it to our team.',
    'projectCard.sendProject': 'Send Project',
    'projectCard.saveSuccessMessage': 'Thank you for completing your project card! 🎉 Our team has received your information and will contact you soon to discuss the next steps.',
    
    // Chat Messages
    'chat.client': 'Client',
    'chat.assistant': 'Assistant',
    'chat.copyMessage': 'Copy message',
    
    // Language Switcher
    'language.en': 'EN',
    'language.uk': 'UK',
    voice: {
      active: 'Voice active',
      inactive: 'Voice inactive',
      startRecording: 'Start voice recording',
      stopRecording: 'Stop voice recording',
      listening: 'Listening...',
      speak: 'Speak text',
      stopSpeaking: 'Stop speaking',
      enable: 'Enable voice',
      disable: 'Disable voice',
      aiSpeak: 'AI Speak',
      aiStop: 'AI Stop',
      notSupported: 'Voice features not supported in this browser'
    }
  },
  uk: {
    // Header
    'header.title': 'Асистент',
    'header.clearSession': 'Очистити сесію',
    'header.lightTheme': 'Світла тема',
    'header.darkTheme': 'Темна тема',
    
    // Contact Form
    'contact.title': 'Асистент',
    'contact.subtitle': 'Розкажіть нам про ваш проєкт',
    'contact.namePlaceholder': 'Ваше ім\'я',
    'contact.emailPlaceholder': 'Email',
    'contact.startButton': 'Розпочати діалог',
    
    // Chat
    'chat.welcome': 'Привіт, {name}! 👋',
    'chat.subtitle': 'Розкажіть нам про ваш проєкт або оберіть один з варіантів нижче',
    'chat.inputPlaceholder': 'Запитайте щось про ваш проєкт...',
    'chat.projectCompleted': 'Проєкт завершено!',
    'chat.projectCompletedMessage': 'Дякуємо за інформацію! Наша команда проаналізує ваш проєкт та зв\'яжеться з вами найближчим часом.',
    
    // Quick Prompts
    'prompts.newProject.title': 'Новий проєкт',
    'prompts.newProject.desc': 'Почати з нуля',
    'prompts.redesign.title': 'Редизайн',
    'prompts.redesign.desc': 'Покращити існуючий продукт',
    'prompts.consultation.title': 'Консультація',
    'prompts.consultation.desc': 'Отримати експертну пораду',
    'prompts.estimate.title': 'Оцінка проєкту',
    'prompts.estimate.desc': 'Дізнатися вартість та терміни',
    'prompts.team.title': 'Команда',
    'prompts.team.desc': 'Дізнатися про Cieden',
    'prompts.portfolio.title': 'Портфоліо',
    'prompts.portfolio.desc': 'Побачити приклади робіт',
    
    // Project Card
    'projectCard.title': 'Проєкт',
    'projectCard.subtitle': 'Жива картка проєкту',
    'projectCard.completion': 'Завершення',
    'projectCard.projectName': 'Назва проєкту',
    'projectCard.projectType': 'Тип проєкту',
    'projectCard.description': 'Опис',
    'projectCard.targetAudience': 'Цільова аудиторія',
    'projectCard.features': 'Функції',
    'projectCard.budget': 'Бюджет',
    'projectCard.timeline': 'Терміни',
    'projectCard.competitors': 'Конкуренти',
    'projectCard.website': 'Веб-сайт',
    'projectCard.waitingForInfo': 'Очікуємо інформацію...',
    'projectCard.draft': 'Чернетка',
    'projectCard.confirmed': 'Підтверджено',
    'projectCard.confirm': 'Підтвердити',
    'projectCard.reject': 'Відхилити',
    'projectCard.edit': 'Редагувати',
    'projectCard.save': 'Зберегти',
    'projectCard.cancel': 'Скасувати',
    'projectCard.editPlaceholder': 'Редагувати це поле...',
    'projectCard.completionMessage': 'Картка проєкту завершена! 🎉',
    'projectCard.completionDescription': 'Інформація про ваш проєкт готова. Натисніть кнопку нижче, щоб надіслати її нашій команді.',
    'projectCard.sendProject': 'Надіслати проєкт',
    'projectCard.saveSuccessMessage': 'Дякуємо за завершення картки проєкту! 🎉 Наша команда отримала вашу інформацію та зв\'яжеться з вами найближчим часом для обговорення наступних кроків.',
    
    // Chat Messages
    'chat.client': 'Клієнт',
    'chat.assistant': 'Асистент',
    'chat.copyMessage': 'Копіювати повідомлення',
    
    // Language Switcher
    'language.en': 'EN',
    'language.uk': 'UK',
    
    // Voice Features
    'voice.active': 'Voice active',
    'voice.inactive': 'Voice inactive',
    'voice.startRecording': 'Start voice recording',
    'voice.stopRecording': 'Stop voice recording',
    'voice.listening': 'Listening...',
    'voice.speak': 'Speak text',
    'voice.stopSpeaking': 'Stop speaking',
    'voice.enable': 'Enable voice',
    'voice.disable': 'Disable voice',
    'voice.notSupported': 'Voice features not supported in this browser'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'uk')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Force re-render by triggering a state update
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 