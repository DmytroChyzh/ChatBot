'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, ProjectEstimate, ProjectCardState } from '../../types/chat';
import { 
  createChatSession, 
  addMessageToSession, 
  subscribeToSession,
  getChatSession
} from '../../lib/firestore';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import InputBox from '../../components/InputBox';
import Header from '../../components/Header';
import EstimateCard from '../../components/EstimateCard';
import ChatWindow from '../../components/ChatWindow';
import CosmicBackground from '../../components/CosmicBackground';

import { analyzeConversationType, shouldShowProjectCard } from '../../utils/conversationAnalyzer';


interface ContactInfo {
  name: string;
  email: string;
}

const quickPrompts = [
  {
    title: 'newProject',
    desc: 'Start from scratch',
    valueEn: 'I want to start a new project. What information do you need from me to begin?',
    valueUk: 'Я хочу почати новий проєкт. Яку інформацію вам потрібно від мене для початку?'
  },
  {
    title: 'redesign',
    desc: 'Improve an existing product',
    valueEn: 'I have an existing product that needs a redesign. How can we start?',
    valueUk: 'У мене є існуючий продукт, який потребує редизайну. Як ми можемо почати?'
  },
  {
    title: 'consultation',
    desc: 'Get expert advice',
    valueEn: 'I need a consultation about the UX/UI of my product. What questions would you like to discuss?',
    valueUk: 'Мені потрібна консультація щодо UX/UI мого продукту. Які питання ви хотіли б обговорити?'
  },
  {
    title: 'estimate',
    desc: 'Find out cost and timeline',
    valueEn: 'I want a detailed estimate for my project. What information do you need for the calculation?',
    valueUk: 'Я хочу детальну оцінку для мого проєкту. Яку інформацію вам потрібно для розрахунку?'
  },
  {
    title: 'team',
    desc: 'Learn about Cieden',
    valueEn: 'Tell me about your team and experience in similar projects.',
    valueUk: 'Розкажіть мені про вашу команду та досвід у подібних проєктах.'
  },
  {
    title: 'portfolio',
    desc: 'See work examples',
    valueEn: 'Please show examples of your successful projects in my field.',
    valueUk: 'Будь ласка, покажіть приклади ваших успішних проєктів у моїй галузі.'
  }
];

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contact, setContact] = useState<ContactInfo>({ name: '', email: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    const savedContact = localStorage.getItem('chatContact');
    
    if (savedSessionId && savedContact) {
      try {
        const contactData = JSON.parse(savedContact);
        setContact(contactData);
        setContactSubmitted(true);
        setSessionId(savedSessionId);
      } catch (error) {
        console.error('Error parsing saved contact:', error);
      }
    }
  }, []);
  const [isProjectComplete, setIsProjectComplete] = useState(false);
  const [conversationType, setConversationType] = useState<'general' | 'project' | 'estimate'>('general');
  const [estimateStep, setEstimateStep] = useState(0);
  const [projectEstimate, setProjectEstimate] = useState<ProjectEstimate | null>(null);
  const [showMobileEstimate, setShowMobileEstimate] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileEstimate) {
        setShowMobileEstimate(false);
      }
    };

    if (showMobileEstimate) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileEstimate]);

  
  
  // Get last AI response for speech synthesis
  const getLastAIResponse = () => {
    if (session?.messages) {
      const aiMessages = session.messages.filter(msg => msg.role === 'assistant');
      if (aiMessages.length > 0) {
        return aiMessages[aiMessages.length - 1].content;
      }
    }
    return null;
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, mounted } = useTheme();
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Підписка на оновлення сесії в реальному часі
  useEffect(() => {
    if (sessionId) {
      const unsubscribe = subscribeToSession(sessionId, (updatedSession) => {
        setSession(updatedSession);
        
        // Аналізуємо тип розмови
        if (updatedSession?.messages) {
          const newType = analyzeConversationType(updatedSession.messages);
          setConversationType(newType);
          
          // Оновлюємо крок естімейту
          if (newType === 'project' || newType === 'estimate') {
            setEstimateStep(Math.min(updatedSession.messages.length / 2, 5));
          }
        }
      });
      return unsubscribe;
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.name.trim() && contact.email.trim()) {
      try {
        // Створюємо нову сесію
        const newSessionId = await createChatSession(contact.name, contact.email);
        setSessionId(newSessionId);
        setContactSubmitted(true);
        
        // Save to localStorage
        localStorage.setItem('chatSessionId', newSessionId);
        localStorage.setItem('chatContact', JSON.stringify(contact));
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
  };

  const sendToAI = async (message: string) => {
    const conversationHistory = session?.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message,
        conversationHistory,
        sessionId,
        language
      }),
    });
    const data = await res.json();
    return data;
  };

  // Видалено зайві воркери - тепер простий чатбот

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !contactSubmitted || isProjectComplete || !sessionId) return;
    setIsLoading(true);
    
    // Автоматично аналізуємо тип розмови для нових повідомлень
    const newType = analyzeConversationType([...session?.messages || [], { role: 'user', content: input, timestamp: new Date() } as Message]);
    if (newType !== conversationType) {
      setConversationType(newType);
    }
    
    // Видалено обробку питань про команду

    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    try {
      await addMessageToSession(sessionId, userMessage);
      const response = await sendToAI(input);
      // НЕ додаємо зайве нагадування в повідомлення
      let finalContent = response.content;

      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
        suggestedAnswers: response.suggestedAnswers || undefined,
      };
      await addMessageToSession(sessionId, assistantMessage);
      // Видалено triggerWorkers
      if (response.completionStatus === 'complete') {
        setIsProjectComplete(true);
      }
      setInput('');
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (value: string) => {
    if (!contactSubmitted || isProjectComplete || !sessionId) return;
    setIsLoading(true);
    
    // Автоматично встановлюємо тип розмови для проектних запитів
    if (value.includes('new project') || value.includes('новий проєкт') || 
        value.includes('redesign') || value.includes('редизайн') ||
        value.includes('estimate') || value.includes('естімейт') ||
        value.includes('consultation') || value.includes('консультація')) {
      console.log('Setting conversationType to project for:', value);
      setConversationType('project');
    }
    
    // Видалено обробку питань про команду

    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: value,
      timestamp: new Date(),
    };
    (async () => {
      try {
        await addMessageToSession(sessionId, userMessage);
        const response = await sendToAI(value);
        const assistantMessage: Omit<Message, 'id'> = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          suggestedAnswers: response.suggestedAnswers || undefined,
        };
        await addMessageToSession(sessionId, assistantMessage);
        if (response.shouldTriggerWorkers) {
          // Видалено triggerWorkers
        }
        if (response.completionStatus === 'complete') {
          setIsProjectComplete(true);
        }
        setInput('');
      } catch (error) {
        console.error('Error in chat:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleProjectComplete = () => {
    setIsProjectComplete(true);
    // Clear localStorage when project is completed
    localStorage.removeItem('chatSessionId');
    localStorage.removeItem('chatContact');
  };

  const handleClearSession = () => {
    // Clear localStorage and reset state
    localStorage.removeItem('chatSessionId');
    localStorage.removeItem('chatContact');
    setSessionId(null);
    setSession(null);
    setContactSubmitted(false);
    setContact({ name: '', email: '' });
    setIsProjectComplete(false);
  };

  const handleStartOver = async () => {
    // Очищуємо стару сесію
    localStorage.removeItem('chatSessionId');
    setSessionId(null);
    setSession(null);
    setIsProjectComplete(false);
    setConversationType('general');
    setEstimateStep(0);
    
    // Створюємо нову сесію з тими самими кредами
    try {
      const newSessionId = await createChatSession(contact.name, contact.email);
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
      
      // Створюємо новий об'єкт сесії
      const newSession: ChatSession = {
        id: newSessionId,
        metadata: {
          sessionId: newSessionId,
          userId: contact.email,
          userName: contact.name,
          userEmail: contact.email,
          status: 'active',
          startedAt: new Date(),
          totalMessages: 0,
          lastActivity: new Date()
        },
        messages: [],
        projectCard: {
          workerStatus: {
            summarizer: 'idle',
            estimator: 'idle',
            researcher: 'idle'
          }
        } as ProjectCardState,
        conversationType: 'general',
        estimateStep: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSession(newSession);
      
      console.log('New session created:', newSessionId);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };





  // Функція для показу fallback email інформації
  const showEmailFallback = (contactEmail: string, subject: string, body: string, isUkrainian: boolean) => {
    const emailText = `${contactEmail}\n\n${decodeURIComponent(subject)}\n\n${decodeURIComponent(body)}`;
    
    // Копіюємо в буфер обміну
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailText).then(() => {
        // Показуємо модальне вікно з кнопками
        const userChoice = confirm(isUkrainian 
          ? `📧 Email скопійовано в буфер обміну!\n\nКонтактна особа: ${contactEmail}\n\nНатисніть "OK" щоб відкрити Gmail, або "Скасувати" щоб залишитися тут.`
          : `📧 Email copied to clipboard!\n\nContact person: ${contactEmail}\n\nClick "OK" to open Gmail, or "Cancel" to stay here.`
        );
        
        if (userChoice) {
          // Даємо користувачу вибір поштового сервісу
          const emailService = prompt(isUkrainian 
            ? `Виберіть поштовий сервіс:\n1 - Gmail\n2 - Outlook\n3 - Yahoo\n4 - Інший\n\nВведіть номер (1-4):`
            : `Choose email service:\n1 - Gmail\n2 - Outlook\n3 - Yahoo\n4 - Other\n\nEnter number (1-4):`
          );
          
          let emailUrl = '';
          switch(emailService) {
            case '1':
              emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${contactEmail}&su=${encodeURIComponent(decodeURIComponent(subject))}&body=${encodeURIComponent(decodeURIComponent(body))}`;
              break;
            case '2':
              emailUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${contactEmail}&subject=${encodeURIComponent(decodeURIComponent(subject))}&body=${encodeURIComponent(decodeURIComponent(body))}`;
              break;
            case '3':
              emailUrl = `https://compose.mail.yahoo.com/?to=${contactEmail}&subject=${encodeURIComponent(decodeURIComponent(subject))}&body=${encodeURIComponent(decodeURIComponent(body))}`;
              break;
            default:
              // За замовчуванням Gmail
              emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${contactEmail}&su=${encodeURIComponent(decodeURIComponent(subject))}&body=${encodeURIComponent(decodeURIComponent(body))}`;
          }
          
          if (emailUrl) {
            window.open(emailUrl, '_blank');
          }
        }
      }).catch(() => {
        // Якщо clipboard не працює, показуємо модальне вікно
        const userChoice = confirm(isUkrainian 
          ? `📧 Email менеджера: ${contactEmail}\n\nНатисніть "OK" щоб відкрити Gmail, або "Скасувати" щоб залишитися тут.\n\nТема: ${decodeURIComponent(subject)}`
          : `📧 Manager email: ${contactEmail}\n\nClick "OK" to open Gmail, or "Cancel" to stay here.\n\nSubject: ${decodeURIComponent(subject)}`
        );
        
        if (userChoice) {
          // За замовчуванням відкриваємо Gmail
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${contactEmail}&su=${encodeURIComponent(decodeURIComponent(subject))}&body=${encodeURIComponent(decodeURIComponent(body))}`;
          window.open(gmailUrl, '_blank');
        }
      });
    } else {
      const userChoice = confirm(isUkrainian 
        ? `📧 Email менеджера: ${contactEmail}\n\nНатисніть "OK" щоб відкрити Gmail, або "Скасувати" щоб залишитися тут.\n\nТема: ${decodeURIComponent(subject)}`
        : `📧 Manager email: ${contactEmail}\n\nClick "OK" to open Gmail, or "Cancel" to stay here.\n\nSubject: ${decodeURIComponent(subject)}`
      );
      
      if (userChoice) {
        // За замовчуванням відкриваємо Gmail
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${contactEmail}&su=${encodeURIComponent(decodeURIComponent(subject))}&body=${encodeURIComponent(decodeURIComponent(body))}`;
        window.open(gmailUrl, '_blank');
      }
    }
  };

  // Handle contact manager
  const handleContactManager = () => {
    console.log('Contacting manager...');
    console.log('Current projectEstimate:', projectEstimate);
    console.log('Current contact:', contact);
    
    // Отримуємо контактну особу та email з поточного естімейту
    const contactPerson = projectEstimate?.team?.contactPerson || 'Kateryna Zavertailo';
    const contactEmail = projectEstimate?.team?.contactEmail || 'kateryna.zavertailo@cieden.com';
    
    console.log('Selected contact person:', contactPerson);
    console.log('Selected contact email:', contactEmail);
    
    // Створюємо тему та тіло email'у залежно від мови
    const isUkrainian = language === 'uk';
    
    const subject = encodeURIComponent(
      isUkrainian 
        ? 'Запит на консультацію щодо проекту' 
        : 'Project Consultation Request'
    );
    
    const body = encodeURIComponent(
      isUkrainian 
        ? `Доброго дня, ${contactPerson}!

Мене цікавить консультація щодо мого проекту. 

Деталі проекту:
- Діапазон вартості: $${projectEstimate?.currentRange?.min || 0} - $${projectEstimate?.currentRange?.max || 0}
- Термін виконання: ${projectEstimate?.timeline || 'Визначається'}
- Команда: ${projectEstimate?.team?.designers?.join(', ') || 'Визначається'}

Буду вдячний за можливість обговорити деталі та отримати більш точну оцінку.

З повагою,
${contact.name || 'Клієнт'}
${contact.email ? `\nEmail: ${contact.email}` : ''}`
        : `Hello ${contactPerson}!

I'm interested in a consultation about my project.

Project details:
- Cost range: $${projectEstimate?.currentRange?.min || 0} - $${projectEstimate?.currentRange?.max || 0}
- Timeline: ${projectEstimate?.timeline || 'To be determined'}
- Team: ${projectEstimate?.team?.designers?.join(', ') || 'To be determined'}

I would appreciate the opportunity to discuss the details and get a more accurate estimate.

Best regards,
${contact.name || 'Client'}
${contact.email ? `\nEmail: ${contact.email}` : ''}`
    );
    
    // Відкриваємо поштовий клієнт
    const mailtoLink = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    console.log('Mailto link:', mailtoLink);
    
    // Спробуємо відкрити email клієнт
    try {
      window.open(mailtoLink, '_blank');
      console.log('Attempted to open email client');
    } catch (error) {
      console.error('Failed to open email client:', error);
    }
    
    // Завжди показуємо fallback через 1 секунду для надійності
    setTimeout(() => {
      showEmailFallback(contactEmail, subject, body, isUkrainian);
    }, 1000);
  };



  // Видалено функції для команди



  // Функції для визначення команди та контактів (тепер імпортуються з teamUtils.ts)
  
  // Функція для генерації детального плану робіт для дизайн компанії
  const generateDetailedPhases = (projectType: string, complexity: string, minHours: number, maxHours: number, minPrice: number, maxPrice: number) => {
    const isUkrainian = language === 'uk';
    
    console.log('generateDetailedPhases called with:', { projectType, complexity, minHours, maxHours, minPrice, maxPrice });
    
    // Використовуємо середнє значення з діапазону
    const avgHours = Math.round((minHours + maxHours) / 2);
    const avgPrice = Math.round((minPrice + maxPrice) / 2);
    console.log('Average hours and price calculated:', { avgHours, avgPrice });
    
    // Розподіляємо години по етапах
    const hoursDistribution = {
      research: Math.round(avgHours * 0.15), // 15%
      wireframing: Math.round(avgHours * 0.20), // 20%
      design: Math.round(avgHours * 0.35), // 35%
      prototyping: Math.round(avgHours * 0.15), // 15%
      testing: Math.round(avgHours * 0.15) // 15%
    };
    
    // Розподіляємо вартість по етапах (не за годинами, а за відсотками від загальної вартості)
    const priceDistribution = {
      research: Math.round(avgPrice * 0.15), // 15%
      wireframing: Math.round(avgPrice * 0.20), // 20%
      design: Math.round(avgPrice * 0.35), // 35%
      prototyping: Math.round(avgPrice * 0.15), // 15%
      testing: Math.round(avgPrice * 0.15) // 15%
    };
    
    const phases = {
      'ux-research': isUkrainian 
        ? `🔍 UX Дослідження (${hoursDistribution.research} год, $${priceDistribution.research})`
        : `🔍 UX Research (${hoursDistribution.research}h, $${priceDistribution.research})`,
      
      'ui-design': isUkrainian 
        ? `🎨 UI Дизайн (${hoursDistribution.design} год, $${priceDistribution.design})`
        : `🎨 UI Design (${hoursDistribution.design}h, $${priceDistribution.design})`,
      
      'prototyping': isUkrainian 
        ? `⚡ Прототипування (${hoursDistribution.prototyping} год, $${priceDistribution.prototyping})`
        : `⚡ Prototyping (${hoursDistribution.prototyping}h, $${priceDistribution.prototyping})`,
      
      'design-system': isUkrainian 
        ? `📐 Дизайн-система (${hoursDistribution.wireframing} год, $${priceDistribution.wireframing})`
        : `📐 Design System (${hoursDistribution.wireframing}h, $${priceDistribution.wireframing})`,
      
      'mobile-adaptive': isUkrainian 
        ? `📱 Мобільна адаптація (${hoursDistribution.testing} год, $${priceDistribution.testing})`
        : `📱 Mobile Adaptive (${hoursDistribution.testing}h, $${priceDistribution.testing})`
    };
    
    return phases;
  };


  // Generate project estimate based on conversation
  const generateProjectEstimate = async (messages: Message[]) => {
    console.log('generateProjectEstimate called with estimateStep:', estimateStep);
    try {
      // На початку показуємо нульовий естімейт
      if (estimateStep <= 1) {
        const initialEstimate: ProjectEstimate = {
          currentRange: { min: 0, max: 0 },
          initialRange: { min: 0, max: 0 },
          currency: 'USD',
          confidence: 'low',
          estimatedAt: new Date(),
          timeline: 'Визначається...',
          team: {
            designers: ['Andrii Prokopyshyn (Senior)'],
            contactPerson: 'Kateryna Zavertailo',
            contactEmail: 'kateryna.zavertailo@cieden.com'
          },
          phases: {
            'ux-research': language === 'uk' ? '🔍 UX Дослідження (0 год, $0)' : '🔍 UX Research (0h, $0)',
            'ui-design': language === 'uk' ? '🎨 UI Дизайн (0 год, $0)' : '🎨 UI Design (0h, $0)',
            'prototyping': language === 'uk' ? '⚡ Прототипування (0 год, $0)' : '⚡ Prototyping (0h, $0)',
            'design-system': language === 'uk' ? '📐 Дизайн-система (0 год, $0)' : '📐 Design System (0h, $0)',
            'mobile-adaptive': language === 'uk' ? '📱 Мобільна адаптація (0 год, $0)' : '📱 Mobile Adaptive (0h, $0)'
          },
          phaseDescriptions: {
            'ux-research': language === 'uk' ? 'Очікуємо інформацію про ваш проект...' : 'Waiting for information about your project...',
            'ui-design': language === 'uk' ? 'Очікуємо інформацію про ваш проект...' : 'Waiting for information about your project...',
            'prototyping': language === 'uk' ? 'Очікуємо інформацію про ваш проект...' : 'Waiting for information about your project...',
            'design-system': language === 'uk' ? 'Очікуємо інформацію про ваш проект...' : 'Waiting for information about your project...',
            'mobile-adaptive': language === 'uk' ? 'Очікуємо інформацію про ваш проект...' : 'Waiting for information about your project...'
          }
        };
        console.log('Setting initial estimate:', initialEstimate);
        setProjectEstimate(initialEstimate);
        return;
      }

      // Простий естімейт
      if (estimateStep >= 1) {
        // Простий естімейт без складної логіки
        console.log(`Simple estimate: step ${estimateStep}`);
        // Простий фіксований естімейт
        const simpleEstimate: ProjectEstimate = {
          currentRange: { min: 8000, max: 15000 },
          initialRange: { min: 80, max: 120 },
          currency: 'USD',
          confidence: 'medium',
          estimatedAt: new Date(),
          timeline: '4-8 тижнів',
          team: {
            designers: ['UI/UX Designer', 'UX Researcher'],
            contactPerson: 'Project Manager',
            contactEmail: 'hello@cieden.com'
          },
          phases: {
            'ux-research': language === 'uk' ? 'Дослідження користувачів' : 'User Research',
            'ui-design': language === 'uk' ? 'UI дизайн' : 'UI Design',
            'prototyping': language === 'uk' ? 'Прототипування' : 'Prototyping',
            'design-system': language === 'uk' ? 'Дизайн-система' : 'Design System',
            'mobile-adaptive': language === 'uk' ? 'Мобільна адаптація' : 'Mobile Adaptation'
          },
          phaseDescriptions: {
            'ux-research': language === 'uk' ? 'Дослідження користувачів' : 'User Research',
            'ui-design': language === 'uk' ? 'UI дизайн' : 'UI Design',
            'prototyping': language === 'uk' ? 'Прототипування' : 'Prototyping',
            'design-system': language === 'uk' ? 'Дизайн-система' : 'Design System',
            'mobile-adaptive': language === 'uk' ? 'Мобільна адаптація' : 'Mobile Adaptation'
          },
          accuracyPercentage: 80
        };
        
        setProjectEstimate(simpleEstimate);
        console.log('Generated simple estimate:', simpleEstimate);

        // Видалено складну логіку
      }
    } catch (error) {
      console.error('Error generating estimate:', error);
    }
  };



  // Update estimate step and generate estimate when needed
  useEffect(() => {
    if (session?.messages && (conversationType === 'project' || conversationType === 'estimate')) {
      const newStep = Math.min(Math.ceil(session.messages.length / 2), 5);
      setEstimateStep(newStep);
    }
  }, [session?.messages, conversationType]);

  // Generate estimate when conversation type changes
  useEffect(() => {
    console.log('conversationType changed to:', conversationType);
    if (session?.messages && (conversationType === 'project' || conversationType === 'estimate')) {
      console.log('Setting initial estimate state...');
      // Тільки встановлюємо початковий стан, не генеруємо реальний естімейт
      if (estimateStep <= 1) {
        generateProjectEstimate(session.messages);
      }
    }
  }, [conversationType]);

  // Update estimate when estimateStep changes
  useEffect(() => {
    if (session?.messages && (conversationType === 'project' || conversationType === 'estimate') && estimateStep >= 1) {
      console.log('Updating estimate for step:', estimateStep);
      generateProjectEstimate(session.messages);
    }
  }, [estimateStep, conversationType]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  // Обгортка для InputBox, щоб не передавати подію
  const handleSendMessage = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    setInput(''); // Очищуємо інпут одразу після відправки
  };

  // Show contact form if not yet filled
  if (!contactSubmitted) {
    return (
      <div className="h-screen w-full bg-background font-sans overflow-hidden">
        {theme === 'cosmic' && <CosmicBackground />}
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          mounted={mounted} 
          className=""
        />
        <div className="flex items-center justify-center h-full" style={{ marginTop: '64px' }}>
        <div className="w-full max-w-md mx-4 relative z-10">
          <div className="text-center mb-8">

              <h1 className="text-2xl font-bold text-foreground mb-2">{t('contact.title')}</h1>
              <p className="text-muted-foreground">{t('contact.subtitle')}</p>
          </div>
          
          <form onSubmit={handleContactSubmit} className="space-y-4 relative z-10">
            <div>
              <input
                type="text"
                  placeholder={t('contact.namePlaceholder')}
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                className="w-full px-4 py-3 bg-muted border border-muted rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition"
                required
              />
            </div>
            <div>
              <input
                type="email"
                  placeholder={t('contact.emailPlaceholder')}
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="w-full px-4 py-3 bg-muted border border-muted rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition"
                required
              />
            </div>
            <button
              type="submit"
                className="w-full px-4 py-3 bg-[#651FFF] text-white rounded-lg font-medium hover:bg-[#5a1ee0] transition-colors duration-300 shadow-lg"
            >
                {t('contact.startButton')}
            </button>
          </form>
          </div>
        </div>
      </div>
    );
  }

  // Determine whether to show card: only for project-related conversations
  const showProjectSidebar = session && shouldShowProjectCard(conversationType) && estimateStep >= 1;
  
  // Додаємо логування для дебагу
  console.log('Debug EstimateCard:', {
    session: !!session,
    conversationType,
    shouldShowProjectCard: shouldShowProjectCard(conversationType),
    showProjectSidebar,
    projectEstimate: !!projectEstimate,
    estimateStep
  });

  return (
    <div className="h-screen w-full bg-background font-sans overflow-hidden">
      {theme === 'cosmic' && <CosmicBackground />}
      {/* Header - на всю ширину екрану */}
          <Header 
            theme={theme} 
            toggleTheme={toggleTheme} 
            mounted={mounted} 
        small={false}
        className="w-full"
        onClearSession={handleClearSession}
        onStartOver={handleStartOver}
      />
      
       
      
      {/* Main Content Area - під хедером */}
      <div className="flex w-full h-full" style={{ marginTop: '96px', height: 'calc(100vh - 96px)' }}> 
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 relative h-full">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center custom-sidebar-scrollbar" style={{ minHeight: 0 }}>
              <ChatWindow
                session={session || { messages: [], projectCard: null }}
                contact={contact}
                isLoading={isLoading}
                quickPrompts={quickPrompts}
                handleQuickPrompt={handleQuickPrompt}
                messagesEndRef={messagesEndRef}
                conversationType={conversationType}
                estimateStep={estimateStep}
              />
            </div>
            <div className="w-full flex justify-center px-4 lg:px-0">
              <div style={{ width: '100%', maxWidth: 900 }}>
                {/* Mobile Estimate Toggle Button */}
                {showProjectSidebar && projectEstimate && estimateStep >= 1 && (
                  <div className="lg:hidden flex justify-center mb-4">
                    <button
                      onClick={() => setShowMobileEstimate(!showMobileEstimate)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      {showMobileEstimate ? t('estimate.hide') : t('estimate.show')}
                    </button>
                  </div>
                )}
                
                
                <InputBox
                  value={input}
                  onChange={setInput}
                  onSend={handleSendMessage}
                  loading={isLoading}
                  disabled={isProjectComplete}
                  projectComplete={isProjectComplete}
                  sessionId={sessionId}
                  onAddMessage={async (message) => {
                    if (sessionId) {
                      await addMessageToSession(sessionId, message);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Estimate Card Sidebar - Desktop only */}
        {showProjectSidebar && projectEstimate && estimateStep >= 1 && (
          <div className="hidden lg:flex flex-col flex-shrink-0 w-[28rem] pr-8 pt-8 pb-8 relative">
            <EstimateCard
              estimate={projectEstimate}
              estimateStep={estimateStep}
              conversationType={conversationType}
              onContactManager={handleContactManager}
              isVisible={true}
            />
          </div>
        )}
      </div>

      {/* Mobile Estimate Modal - Full screen popup */}
      {showProjectSidebar && projectEstimate && estimateStep >= 1 && showMobileEstimate && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMobileEstimate(false)}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div 
              className="w-full max-w-md bg-background rounded-xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  {language === 'uk' ? 'Естімейт Проекту' : 'Project Estimate'}
                </h3>
                <button
                  onClick={() => setShowMobileEstimate(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <EstimateCard
                  estimate={projectEstimate}
                  estimateStep={estimateStep}
                  conversationType={conversationType}
                  onContactManager={handleContactManager}
                  isVisible={true}
                  hideHeader={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
} 