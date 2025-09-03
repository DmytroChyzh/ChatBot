'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, ProjectEstimate } from '../../types/chat';
import { 
  createChatSession, 
  addMessageToSession, 
  subscribeToSession,
  getChatSession
} from '../../lib/firestore';
import ChatMessage from '../../components/ChatMessage';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Image from 'next/image';
import InputBox from '../../components/InputBox';
import Header from '../../components/Header';
import EstimateCard from '../../components/EstimateCard';
import ChatWindow from '../../components/ChatWindow';

import { analyzeConversationType, shouldShowProjectCard, shouldShowEstimate } from '../../utils/conversationAnalyzer';
import { searchTeam, getTeamMember, getAllTeamMembers } from '../../utils/teamSearch';

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
  
  // Voice states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
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
  const { t } = useLanguage();
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
        sessionId
      }),
    });
    const data = await res.json();
    return data;
  };

  const triggerWorkers = async () => {
    if (!sessionId) return;

    try {
      // Запускаємо всіх воркерів паралельно
      const workerPromises = [
        fetch('/api/workers/summarizer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        }),
        fetch('/api/workers/estimator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        }),
        fetch('/api/workers/researcher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })
      ];

      await Promise.allSettled(workerPromises);
    } catch (error) {
      console.error('Error triggering workers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !contactSubmitted || isProjectComplete || !sessionId) return;
    setIsLoading(true);
    
    // Перевіряємо чи питання про команду
    if (isTeamQuestion(input)) {
      const teamAnswer = handleTeamQuestion(input);
      
      // Додаємо відповідь про команду
      const teamMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: teamAnswer,
        timestamp: new Date(),
      };

      try {
        await addMessageToSession(sessionId, teamMessage);
        setInput('');
      } catch (error) {
        console.error('Error adding team message:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    try {
      await addMessageToSession(sessionId, userMessage);
      const response = await sendToAI(input);
      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestedAnswers: response.suggestedAnswers || undefined,
      };
      await addMessageToSession(sessionId, assistantMessage);
      if (response.shouldTriggerWorkers) {
        triggerWorkers();
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
  };

  const handleQuickPrompt = (value: string) => {
    if (!contactSubmitted || isProjectComplete || !sessionId) return;
    setIsLoading(true);
    
    // Перевіряємо чи питання про команду
    if (isTeamQuestion(value)) {
      const teamAnswer = handleTeamQuestion(value);
      
      // Додаємо відповідь про команду
      const teamMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: teamAnswer,
        timestamp: new Date(),
      };

      (async () => {
        try {
          await addMessageToSession(sessionId, teamMessage);
        } catch (error) {
          console.error('Error adding team message:', error);
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

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
          triggerWorkers();
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





  // Handle contact manager
  const handleContactManager = () => {
    console.log('Contacting manager...');
    // Тут можна додати логіку для відкриття модального вікна або переходу на сторінку контактів
  };

  // Функція для обробки питань про команду
  const handleTeamQuestion = (question: string): string => {
    const searchResult = searchTeam({ query: question });
    
    if (searchResult.members.length === 0) {
      return 'Вибачте, не знайшов інформації про цю особу або відділ. Спробуйте переформулювати питання.';
    }

    if (searchResult.members.length === 1) {
      const member = searchResult.members[0];
      return `**${member.fullName}** - ${member.role} в відділі ${member.department}
      
**Досвід:** ${member.totalExperience} (в Cieden: ${member.inCieden})
**Рівень:** ${member.seniority}
**Англійська:** ${member.englishLevel}
**Галузі:** ${member.industries.join(', ')}

**Контакти:** ${member.email}
${member.linkedin ? `LinkedIn: ${member.linkedin}` : ''}`;
    }

    // Якщо знайдено кілька людей
    const memberList = searchResult.members.map(m => 
      `• **${m.fullName}** - ${m.role} (${m.seniority})`
    ).join('\n');

    return `Знайшов ${searchResult.members.length} людей:\n\n${memberList}\n\nЗадайте більш конкретне питання для детальної інформації.`;
  };

  // Перевіряємо чи питання про команду
  const isTeamQuestion = (question: string): boolean => {
    const teamKeywords = [
      'хто', 'дизайнер', 'менеджер', 'продукт', 'команда', 'ceo', 'керівник',
      'андрій', 'деміан', 'дмитро', 'ілля', 'роман', 'марта', 'владислав', 'володимир',
      'design', 'product', 'management', 'lead', 'senior', 'middle'
    ];
    
    const lowerQuestion = question.toLowerCase();
    return teamKeywords.some(keyword => lowerQuestion.includes(keyword));
  };

  // Voice functions
  const handleVoiceInput = (text: string) => {
    setInput(text);
    // Автоматично надсилаємо голосове повідомлення
    if (text.trim()) {
      // Використовуємо handleSubmit замість handleSendMessage
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      setInput(''); // Очищуємо інпут одразу після відправки
    }
  };

  const handleToggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    if (isVoiceActive) {
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  // Функції для визначення команди та контактів
  const getDesignersForProject = (complexity: string, projectType: string): string[] => {
    if (complexity === 'high') {
      return ['Volodymyr Merlenko (Lead)', 'Andrii Prokopyshyn (Senior)', 'Marta Kacharaba (UX Research)'];
    } else if (complexity === 'medium') {
      return ['Volodymyr Merlenko (Lead)', 'Andrii Prokopyshyn (Senior)'];
    } else {
      return ['Andrii Prokopyshyn (Senior)'];
    }
  };

  const getContactPersonForProject = (projectType: string): string => {
    if (projectType === 'e-commerce' || projectType === 'mobile-app') {
      return 'Vladyslav Pianov';
    } else if (projectType === 'redesign' || projectType === 'landing') {
      return 'Volodymyr Merlenko';
    } else if (projectType === 'healthcare' || projectType === 'fintech') {
      return 'Andrii Prokopyshyn';
    } else {
      return 'Roman Kaminechny';
    }
  };

  const getContactEmailForProject = (projectType: string): string => {
    if (projectType === 'e-commerce' || projectType === 'mobile-app') {
      return 'vladyslav@cieden.com';
    } else if (projectType === 'redesign' || projectType === 'landing') {
      return 'volodymyr@cieden.com';
    } else if (projectType === 'healthcare' || projectType === 'fintech') {
      return 'andrii@cieden.com';
    } else {
      return 'roman@cieden.com';
    }
  };

  // Generate project estimate based on conversation
  const generateProjectEstimate = async (messages: Message[]) => {
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
            designers: [],
            contactPerson: 'Roman Kaminechny',
            contactEmail: 'roman@cieden.com'
          },
          phases: {
            discovery: 'Очікуємо деталі проєкту...',
            design: 'Очікуємо деталі проєкту...',
            development: 'Очікуємо деталі проєкту...',
            testing: 'Очікуємо деталі проєкту...'
          }
        };
        setProjectEstimate(initialEstimate);
        return;
      }

      // Створюємо базовий естімейт на основі контексту після збору інформації
      const projectContext = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' ');

      // Аналізуємо тип проєкту на основі контексту
      let projectType = 'website';
      let complexity = 'medium';
      let features = [];
      
      const context = projectContext.toLowerCase();
      
      // Визначаємо тип проекту
      if (context.includes('e-commerce') || context.includes('інтернет-магазин') || 
          context.includes('продаж') || context.includes('автомобілі')) {
        projectType = 'e-commerce';
        complexity = 'high';
        features.push('Система продажів', 'Каталог товарів', 'Корзина та оплата');
      } else if (context.includes('mobile') || context.includes('мобільний') || 
                 context.includes('апка') || context.includes('додаток')) {
        projectType = 'mobile-app';
        complexity = 'high';
        features.push('Мобільний інтерфейс', 'Push-повідомлення', 'Офлайн режим');
      } else if (context.includes('landing') || context.includes('лендінг')) {
        projectType = 'landing';
        complexity = 'low';
        features.push('Односторінковий сайт', 'Форма зворотного зв\'язку');
      } else if (context.includes('редизайн') || context.includes('переробити')) {
        projectType = 'redesign';
        complexity = 'medium';
        features.push('Новий дизайн', 'Покращення UX', 'Адаптивність');
      }

      // Додаємо AI функції якщо згадується
      if (context.includes('ai') || context.includes('аі') || context.includes('асистент')) {
        features.push('AI асистент', 'Розумний пошук', 'Персоналізація');
        complexity = complexity === 'low' ? 'medium' : 'high';
      }

      // Базові ціни залежно від типу та складності
      const basePrices = {
        'landing': { min: 2000, max: 8000 },
        'website': { min: 5000, max: 25000 },
        'e-commerce': { min: 15000, max: 60000 },
        'mobile-app': { min: 20000, max: 80000 },
        'redesign': { min: 8000, max: 35000 }
      };

      const base = basePrices[projectType as keyof typeof basePrices] || basePrices.website;
      const complexityMultiplier = complexity === 'high' ? 1.5 : complexity === 'medium' ? 1.0 : 0.7;
      const featuresMultiplier = 1 + (features.length * 0.1); // +10% за кожну функцію

      const initialRange = {
        min: Math.round(base.min * complexityMultiplier * featuresMultiplier),
        max: Math.round(base.max * complexityMultiplier * featuresMultiplier)
      };

      // Поточний діапазон (звужений на основі кроків)
      const narrowingFactor = Math.min((estimateStep - 1) / 4, 0.9); // Максимум 90% звуження
      
      // Більш точне звуження з кожною відповіддю
      const rangeWidth = initialRange.max - initialRange.min;
      const currentRange = {
        min: Math.round(initialRange.min + (rangeWidth * narrowingFactor * 0.15)), // +15% від початку
        max: Math.round(initialRange.max - (rangeWidth * narrowingFactor * 0.85))  // -85% від кінця
      };

      // Визначаємо термін на основі складності
      let timeline = '8-16 тижнів';
      if (complexity === 'high') {
        timeline = estimateStep >= 4 ? '12-20 тижнів' : '16-24 тижні';
      } else if (complexity === 'medium') {
        timeline = estimateStep >= 4 ? '8-12 тижнів' : '10-16 тижнів';
      } else {
        timeline = estimateStep >= 4 ? '4-8 тижнів' : '6-10 тижнів';
      }

      const estimate: ProjectEstimate = {
        currentRange,
        initialRange,
        currency: 'USD',
        confidence: estimateStep >= 5 ? 'high' : estimateStep >= 3 ? 'medium' : 'low',
        estimatedAt: new Date(),
        timeline,
        team: {
          designers: this.getDesignersForProject(complexity, projectType),
          contactPerson: this.getContactPersonForProject(projectType),
          contactEmail: this.getContactEmailForProject(projectType)
        },
        phases: {
          discovery: 'Аналіз вимог, дослідження ринку, планування архітектури проєкту',
          design: 'UI/UX дизайн, прототипування, створення дизайн-системи',
          development: 'Програмування, інтеграція, налаштування та тестування функцій',
          testing: 'Комплексне тестування, виправлення помилок, оптимізація продуктивності'
        }
      };

      setProjectEstimate(estimate);
    } catch (error) {
      console.error('Error generating project estimate:', error);
    }
  };



  // Update estimate step and generate estimate when needed
  useEffect(() => {
    if (session?.messages && (conversationType === 'project' || conversationType === 'estimate')) {
      const newStep = Math.min(Math.ceil(session.messages.length / 2), 5);
      setEstimateStep(newStep);
      

      
              // Генеруємо проектний естімейт після 1-2 кроків (швидше показуємо)
        if (newStep >= 1) {
          generateProjectEstimate(session.messages);
        }
    }
  }, [session?.messages, conversationType, projectEstimate]);

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
      <div className="h-screen w-full bg-background font-sans">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          mounted={mounted} 
          className=""
        />
        <div className="flex items-center justify-center h-full" style={{ marginTop: '64px' }}>
        <div className="w-full max-w-md mx-4">
          <div className="text-center mb-8">

              <h1 className="text-2xl font-bold text-foreground mb-2">{t('contact.title')}</h1>
              <p className="text-muted-foreground">{t('contact.subtitle')}</p>
          </div>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
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
  const showProjectSidebar = session && shouldShowProjectCard(conversationType);

  return (
    <div className="h-screen w-full bg-background font-sans">
      <div className={`flex w-full h-full ${showProjectSidebar ? '' : 'flex-col'}`}> 
        {/* Main Chat Area (Header + ChatWindow + InputBox) */}
        <div className={showProjectSidebar ? 'flex flex-col flex-1 relative h-full' : 'w-full h-full flex flex-col'}>
          <Header 
            theme={theme} 
            toggleTheme={toggleTheme} 
            mounted={mounted} 
            small={showProjectSidebar} 
            className={showProjectSidebar ? 'max-w-[calc(100vw-440px)]' : ''}
            onClearSession={handleClearSession}
          />
          <div className="flex-1 flex flex-col" style={{ marginTop: showProjectSidebar ? (showProjectSidebar ? '48px' : '64px') : '64px', minHeight: 0 }}>
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center" style={{ minHeight: 0 }}>
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
            <div className="w-full flex justify-center">
              <div style={{ width: '100%', maxWidth: 900 }}>
                <InputBox
                  value={input}
                  onChange={setInput}
                  onSend={handleSendMessage}
                  loading={isLoading}
                  disabled={isProjectComplete}
                  projectComplete={isProjectComplete}
                  isVoiceActive={isVoiceActive}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onVoiceInput={handleVoiceInput}
                  onToggleVoice={handleToggleVoice}
                  lastAIResponse={getLastAIResponse()}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Estimate Card Sidebar */}
        {showProjectSidebar && projectEstimate && (
          <div className="h-full flex flex-col">
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
    </div>
  );
} 