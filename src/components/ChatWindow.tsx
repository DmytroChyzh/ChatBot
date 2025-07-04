import React, { RefObject } from 'react';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  session: any;
  contact: { name: string; email: string };
  isLoading: boolean;
  quickPrompts: any[];
  handleQuickPrompt: (value: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  paddingBottom?: number;
}

const MESSAGE_CONTAINER_PADDING = 32; // padding як у InputBox
const MAX_WIDTH = 900;

const ChatWindow: React.FC<ChatWindowProps> = ({ session, contact, isLoading, quickPrompts, handleQuickPrompt, messagesEndRef, paddingBottom }) => (
  <div
    className="flex-1 overflow-y-auto w-full px-0 py-8 transition-colors duration-300"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
    }}
  >
    <div style={{ width: '100%', maxWidth: MAX_WIDTH, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {session?.messages.length === 0 && (
        <div className="text-center py-12 w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            C
          </div>
          <h2 className="text-xl font-semibold text-[#23232B] dark:text-white mb-2">Привіт, {contact.name}! 👋</h2>
          <p className="text-[#6B7280] dark:text-[#E5E7EB] mb-6">Розкажіть про свій проєкт або виберіть один з варіантів нижче</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt.value)}
                className="p-4 bg-[#E5E7EB] rounded-lg text-left hover:bg-[#D1D5DB] transition-colors duration-300 group"
              >
                <h3 className="font-medium text-[#23232B] dark:text-white mb-1 group-hover:text-[#8B5CF6] transition-colors duration-300">
                  {prompt.title}
                </h3>
                <p className="text-sm text-[#6B7280] dark:text-[#E5E7EB]">{prompt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      {session?.messages.map((message: any) => (
        <div key={message.id} style={{ width: '100%', maxWidth: MAX_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          <ChatMessage message={message} handleQuickPrompt={handleQuickPrompt} />
        </div>
      ))}
      {isLoading && (
        <div style={{ width: '100%', maxWidth: MAX_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
          <div className="relative max-w-2xl items-start">
            {/* Label */}
            <div className="flex items-center mb-1 text-xs text-[#6B7280] dark:text-[#E5E7EB] justify-start transition-colors duration-300" style={{ minHeight: 18 }}>
              <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="4"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M12 2v4m-6 4V6m12 4V6"/></svg>
              <span>Асистент</span>
            </div>
            <div className="rounded-3xl px-5 py-4 shadow-md bg-white dark:bg-[#23232B] text-[#23232B] dark:text-white flex items-center gap-2 transition-colors duration-300" style={{ minHeight: 40 }}>
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-[#6B7280] dark:bg-[#E5E7EB] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-[#6B7280] dark:bg-[#E5E7EB] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2 h-2 bg-[#6B7280] dark:bg-[#E5E7EB] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  </div>
);

export default ChatWindow; 