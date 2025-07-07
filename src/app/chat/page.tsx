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
import InputBox from '../../components/InputBox';
import Header from '../../components/Header';
import ProjectSidebar from '../../components/ProjectSidebar';
import ChatWindow from '../../components/ChatWindow';
import { parseProjectInfoFromText } from '../../utils/parseProjectInfo';

interface ContactInfo {
  name: string;
  email: string;
}

const quickPrompts = [
  {
    title: 'Новий проєкт',
    desc: 'Розпочати з нуля',
    value: 'Я хочу створити новий проєкт. Розкажіть, яку інформацію вам потрібно від мене для початку?'
  },
  {
    title: 'Редизайн',
    desc: 'Покращити існуючий продукт',
    value: 'У мене є існуючий продукт, який потребує редизайну. Як ми можемо почати?'
  },
  {
    title: 'Консультація',
    desc: 'Отримати експертну пораду',
    value: 'Мені потрібна консультація щодо UX/UI мого продукту. Які питання ви б хотіли обговорити?'
  },
  {
    title: 'Оцінка проєкту',
    desc: 'Дізнатись вартість та терміни',
    value: 'Я хочу отримати детальну оцінку мого проєкту. Яку інформацію вам потрібно для розрахунку?'
  },
  {
    title: 'Команда',
    desc: 'Дізнатись про Cieden',
    value: 'Розкажіть про вашу команду та досвід у подібних проєктах.'
  },
  {
    title: 'Кейси',
    desc: 'Подивитись приклади робіт',
    value: 'Покажіть, будь ласка, приклади ваших успішних проєктів у моїй сфері.'
  }
];

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contact, setContact] = useState<ContactInfo>({ name: '', email: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isProjectComplete, setIsProjectComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, mounted } = useTheme();
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
      // Оновлюємо картку лише якщо є нові draft-дані
      const projectInfo = parseProjectInfoFromText(input);
      const prevCard: ProjectCardState | undefined = session?.projectCard;
      const updates: Partial<ProjectCardState> = {};
      for (const key in projectInfo) {
        const prev = prevCard?.[key];
        if (!prev || prev.status !== 'final') {
          updates[key] = projectInfo[key];
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
        const projectInfo = parseProjectInfoFromText(value);
        const prevCard: ProjectCardState | undefined = session?.projectCard;
        const updates: Partial<ProjectCardState> = {};
        for (const key in projectInfo) {
          const prev = prevCard?.[key];
          if (!prev || prev.status !== 'final') {
            updates[key] = projectInfo[key];
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

  // Показуємо форму контактів, якщо ще не заповнена
  if (!contactSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#18181C] font-sans px-2">
        <div className="w-full max-w-md mx-auto bg-[#23232B] rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in border border-[#23232B]">
          {/* Logo/Header */}
          <div className="flex flex-col items-center justify-center pt-10 pb-4 px-8">
            <div className="w-14 h-14 rounded-2xl bg-[#393949] flex items-center justify-center text-3xl font-extrabold text-white shadow mb-4">C</div>
            <h1 className="text-2xl font-bold text-white mb-1">Cieden Асистент</h1>
            <p className="text-[#A1A1AA] text-base mb-2">Розкажіть про свій проєкт</p>
          </div>
          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <input
                  type="text"
                  placeholder="Ваше ім'я"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="block w-full bg-[#18181C] border border-[#393949] px-4 py-3 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] text-base transition"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="block w-full bg-[#18181C] border border-[#393949] px-4 py-3 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] text-base transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="block w-full px-4 py-3 bg-[#393949] text-white rounded-lg font-semibold text-lg transition hover:bg-[#23232B] focus:outline-none"
              >
                Почати діалог
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Визначаємо, чи показувати картку: є хоча б одне повідомлення від асистента
  const showProjectSidebar = session?.messages?.some(m => m.role === 'assistant');

  return (
    <div className="h-screen w-full bg-[#F7F8F9] font-sans">
      <div className={`flex w-full h-full ${showProjectSidebar ? '' : 'flex-col'}`}> 
        {/* Main Chat Area (Header + ChatWindow + InputBox) */}
        <div className={showProjectSidebar ? 'flex flex-col flex-1 relative h-full' : 'w-full h-full flex flex-col'}>
          <Header 
            theme={theme} 
            toggleTheme={toggleTheme} 
            mounted={mounted} 
            small={showProjectSidebar} 
            className={showProjectSidebar ? 'max-w-[calc(100vw-440px)]' : ''}
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
              workerStatus={session.projectCard.workerStatus}
              onComplete={handleProjectComplete}
              wide
            />
          </div>
        )}
      </div>
    </div>
  );
} 