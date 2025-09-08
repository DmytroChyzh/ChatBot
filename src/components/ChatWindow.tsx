import React, { RefObject } from 'react';
import Image from 'next/image';
import ChatMessage from './ChatMessage';
import VoiceChat from './VoiceChat';

import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface ChatWindowProps {
  session: any;
  contact: { name: string; email: string };
  isLoading: boolean;
  quickPrompts: any[];
  handleQuickPrompt: (value: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  paddingBottom?: number;
  conversationType: 'general' | 'project' | 'estimate';
  estimateStep: number;
  // Voice chat props
  onVoiceMessage?: (text: string) => void;
  lastAIResponse?: string;
  isVoiceChatActive?: boolean;
}

const MESSAGE_CONTAINER_PADDING = 32; // padding like in InputBox
const MAX_WIDTH = 900;

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  session, 
  contact, 
  isLoading, 
  quickPrompts, 
  handleQuickPrompt, 
  messagesEndRef, 
  paddingBottom,
  conversationType,
  estimateStep,
  onVoiceMessage,
  lastAIResponse,
  isVoiceChatActive = false
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  
  return (
  <div
    className="flex-1 overflow-y-auto w-full px-0 py-8 transition-colors duration-300 relative"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
    }}
  >
    {/* Voice Chat Button - Fixed position in top right - only show when voice chat is active */}
    {onVoiceMessage && isVoiceChatActive && (
      <div className="fixed top-4 right-4 z-50">
        <VoiceChat 
          onVoiceMessage={onVoiceMessage}
          lastAIResponse={lastAIResponse}
          disabled={isLoading}
        />
      </div>
    )}
    <div style={{ width: '100%', maxWidth: MAX_WIDTH, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {session?.messages.length === 0 && (
        <div className="text-center py-12 w-full">

          <h2 className="text-xl font-semibold text-foreground mb-2">{t('chat.welcome').replace('{name}', contact.name)}</h2>
          <p className="text-muted-foreground mb-6">{t('chat.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(language === 'uk' ? prompt.valueUk : prompt.valueEn)}
                className="p-4 bg-muted rounded-lg text-left hover:bg-accent/10 transition-colors duration-300 group"
              >
                <h3 className="font-medium text-foreground mb-1 group-hover:text-foreground transition-colors duration-300">
                  {t(`prompts.${prompt.title}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">{t(`prompts.${prompt.title}.desc`)}</p>
              </button>
            ))}
          </div>
        </div>
              )}







        {session?.messages && session.messages.length > 0 && session.messages.map((message: any) => (
          <div key={message.id} style={{ width: '100%', maxWidth: MAX_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
            <ChatMessage message={message} handleQuickPrompt={handleQuickPrompt} userName={contact.name} />
          </div>
        ))}
      {isLoading && (
        <div style={{ width: '100%', maxWidth: MAX_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
          <div className="relative max-w-2xl items-start">
            {/* Label */}
            <div className="flex items-center mb-1 text-xs text-muted-foreground justify-start transition-colors duration-300" style={{ minHeight: 18 }}>
              <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="4"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M12 2v4m-6 4V6m12 4V6"/></svg>
              <span>{t('chat.assistant')}</span>
            </div>
            <div className="rounded-3xl px-5 py-4 shadow-md bg-card text-foreground flex items-center justify-center gap-2 transition-colors duration-300" style={{ minHeight: 40 }}>
              <div className="flex space-x-1 items-center">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  </div>
  );
};

export default ChatWindow; 