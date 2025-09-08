'use client';

import { Message } from '../types/chat';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import VoiceSpeaker from './VoiceSpeaker';

interface ChatMessageProps {
  message: Message;
  handleQuickPrompt?: (value: string) => void;
  userName?: string;
}

export default function ChatMessage({ message, handleQuickPrompt, userName }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Fallback: parse suggestions from text if GPT inserted them at the end
  const { cleanContent, fallbackAnswers } = useMemo(() => {
    let cleanContent = message.content;
    let fallbackAnswers: string[] = [];
    // Look for array in square brackets at the end
    const match = cleanContent.match(/\[([\s\S]*?)\]\s*$/);
    if (match) {
      try {
        // Try to parse as JSON array
        const arr = JSON.parse(match[0].replace(/'/g, '"'));
        if (Array.isArray(arr)) {
          fallbackAnswers = arr.map((s: any) => String(s).trim()).filter(Boolean);
          cleanContent = cleanContent.replace(match[0], '').trim();
        }
      } catch {}
    }
    return { cleanContent, fallbackAnswers };
  }, [message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="w-full py-2 animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} items-end`}
        style={{ maxWidth: 900, margin: '0 auto' }}
      >
        <div className={`relative max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}
        >
          {/* Label */}
          <div className={`flex items-center mb-1 text-xs text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}
            style={{ minHeight: 18 }}
          >
            {isUser ? (
              <>
                <span>{userName || t('chat.client')}</span>
                <svg className="ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>
              </>
            ) : (
              <>
                <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="4"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M12 2v4m-6 4V6m12 4V6"/></svg>
                <span>{t('chat.assistant')}</span>
              </>
            )}
          </div>
          <div className={`rounded-3xl px-5 py-4 shadow-lg border ${isUser ? 'bg-[#6030FE] dark:bg-[#3C2780] text-white border-accent' : 'bg-accent text-gray-900 dark:text-white border-accent'} markdown-body transition-colors duration-300`} style={{wordBreak: 'break-word'}}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-2"><table className="min-w-full border border-muted" {...props} /></div>
                ),
                th: ({node, ...props}) => (
                  <th className="px-3 py-2 border-b border-muted bg-muted text-left text-xs font-semibold text-foreground" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="px-3 py-2 border-b border-muted text-sm text-foreground" {...props} />
                ),
                code: ({node, ...props}) => (
                  <code className="bg-muted text-accent px-1 py-0.5 rounded text-xs" {...props} />
                ),
                pre: ({node, ...props}) => (
                  <pre className="bg-muted rounded p-3 my-2 overflow-x-auto text-xs" {...props} />
                ),
                ul: ({node, ...props}) => (
                  <ul className="list-disc list-inside ml-4 my-2" {...props} />
                ),
                ol: ({node, ...props}) => (
                  <ol className="list-decimal list-inside ml-4 my-2" {...props} />
                ),
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground my-2" {...props} />
                ),
                a: ({node, ...props}) => (
                  <a className="text-accent underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
          {/* Message Footer */}
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{(() => {
              let date: Date | null = null;
              if (message.timestamp instanceof Date) {
                date = message.timestamp;
              } else if (typeof message.timestamp === 'string' || typeof message.timestamp === 'number') {
                const d = new Date(message.timestamp);
                if (!isNaN(d.getTime())) date = d;
              }
              return date ? format(date, 'HH:mm') : '';
            })()}</span>
            {!isUser && (
              <>
                <VoiceSpeaker 
                  text={cleanContent}
                  className="ml-1"
                />
                <button
                  onClick={handleCopy}
                  className="hover:text-gray-300 transition"
                  title={t('chat.copyMessage')}
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
          {/* Suggested Answers */}
          {!isUser && handleQuickPrompt && (
            (Array.isArray(message.suggestedAnswers) && message.suggestedAnswers.length > 0 ? message.suggestedAnswers : fallbackAnswers).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(Array.isArray(message.suggestedAnswers) && message.suggestedAnswers.length > 0 ? message.suggestedAnswers : fallbackAnswers).map((answer, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(answer)}
                    className="px-4 py-2 rounded-xl bg-[#EFEFFF] dark:bg-[#2D225A] text-[#6030FE] dark:text-white font-medium shadow hover:bg-[#e0e0ff] dark:hover:bg-[#3C2780] transition-colors duration-200"
                  >
                    {answer}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 