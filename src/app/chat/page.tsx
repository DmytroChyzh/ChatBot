'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, ProjectCardState } from '../../types/chat';
import { 
  createChatSession, 
  addMessageToSession, 
  subscribeToSession,
  updateProjectCard,
  getChatSession
} from '../../lib/firestore';
import ChatMessage from '../../components/ChatMessage';
import ProjectCard from '../../components/ProjectCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Image from 'next/image';
import InputBox from '../../components/InputBox';
import Header from '../../components/Header';
import ProjectSidebar from '../../components/ProjectSidebar';
import ChatWindow from '../../components/ChatWindow';
import { parseProjectInfoFromText, enhanceProjectInfoWithGPT } from '../../utils/parseProjectInfo';

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
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    try {
      await addMessageToSession(sessionId, userMessage);
      // Update card only if there are new draft data
      const projectInfo = await parseProjectInfoFromText(input);
      const prevCard: ProjectCardState | undefined = session?.projectCard;
      const updates: Partial<ProjectCardState> = {};
      
      // If there are new data, enhance them through GPT
      if (Object.keys(projectInfo).length > 0) {
        const enhancedInfo = await enhanceProjectInfoWithGPT(projectInfo, input);
        for (const key in enhancedInfo) {
          const prev = prevCard?.[key];
          if (!prev || prev.status !== 'final') {
            updates[key] = enhancedInfo[key];
          }
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await updateProjectCard(sessionId, updates);
      }
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
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: value,
      timestamp: new Date(),
    };
    (async () => {
      try {
        await addMessageToSession(sessionId, userMessage);
        const projectInfo = await parseProjectInfoFromText(value);
        const prevCard: ProjectCardState | undefined = session?.projectCard;
        const updates: Partial<ProjectCardState> = {};
        
        // If there are new data, enhance them through GPT
        if (Object.keys(projectInfo).length > 0) {
          const enhancedInfo = await enhanceProjectInfoWithGPT(projectInfo, value);
          for (const key in enhancedInfo) {
            const prev = prevCard?.[key];
            if (!prev || prev.status !== 'final') {
              updates[key] = enhancedInfo[key];
            }
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await updateProjectCard(sessionId, updates);
        }
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

  // Determine whether to show card: there is at least one message from assistant
  const showProjectSidebar = session?.messages?.some(m => m.role === 'assistant');

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
                session={session}
                contact={contact}
                isLoading={isLoading}
                quickPrompts={quickPrompts}
                handleQuickPrompt={handleQuickPrompt}
                messagesEndRef={messagesEndRef}
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
                />
              </div>
            </div>
          </div>
        </div>
        {/* Project Card Sidebar */}
        {showProjectSidebar && (
          <div className="h-full flex flex-col">
            <ProjectSidebar
              projectData={session.projectCard}
              onComplete={handleProjectComplete}
              wide
            />
          </div>
        )}
      </div>
    </div>
  );
} 