import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getChatSession, updateProjectCard } from '../../../lib/firestore';
import { ProjectCardState } from '../../../types/chat';
import { parseProjectInfoFromText } from '../../../utils/parseProjectInfo';
import typeformQuestions from '../../../data/typeform-questions.json';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = (language: string) => `You are a friendly AI consultant for Cieden - a UI/UX design company.

🏢 COMPANY FOCUS:
Cieden provides ONLY design services:
- UX/UI Design
- Design Systems  
- Prototyping
- User Research
- Design Consulting

We do NOT provide: development, coding, programming, or technical implementation.

🌍 LANGUAGE DETECTION:
- Match client's language (English/Ukrainian)
- Never mix languages in responses
- If client writes in English → respond in English
- If client writes in Ukrainian → respond in Ukrainian

💬 CONVERSATION STYLE:
- Keep responses under 50 words
- Be friendly and conversational
- Use light emojis when appropriate
- Ask ONE question at a time
- Acknowledge answers before asking next

📋 QUESTION FLOW (Natural Order):
1. Project Type → "What kind of project do you need?"
2. Industry → "What industry is your business in?"
3. Goals/Features → "What are you trying to achieve?"
4. Budget → "What's your budget range?"
5. Timeline → "When do you need this completed?"

🎯 SMART QUESTIONING:
- Build on previous answers
- If client says "I don't know" → ask differently
- Never repeat questions already asked
- Adapt questions based on context
- Focus on business goals behind the project

🚫 OFF-TOPIC HANDLING:
If client asks about development/coding:
"I'd love to help with your design needs! We focus on UX/UI design, prototyping, and user research. What kind of design project are you working on?"

✅ CONVERSATION COMPLETION:
When you have enough information:
"Great! I have a good understanding of your project. Let me connect you with our project manager for a detailed estimate and next steps."

📝 RESPONSE FORMAT:
---
Your question or response here
---
`;

// Розумний парсер: шукаємо JSON у тексті
function extractJSON(str) {
  const first = str.indexOf('{');
  const last = str.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(str.slice(first, last + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function parseSuggestedAnswers(text: string): string[] {
  // Шукаємо SuggestedAnswers блок
  const match = text.match(/SuggestedAnswers:\s*\[([^\]]+)\]/i);
  let arr: string[] = [];
  if (match) {
    arr = match[1].split(',').map(s => s.replace(/['"\s]/g, '').trim()).filter(Boolean);
  } else {
    // Fallback - шукаємо маркдаун-список
    const mdList = text.match(/\n\- ([^\n]+)/g);
    if (mdList) {
      arr = mdList.map(s => s.replace(/\n\- /g, '').trim());
    }
  }
  // Повертаємо лише унікальні підказки
  return Array.from(new Set(arr.filter(Boolean)));
}

// РОЗУМНА СИСТЕМА КНОПОК НА ОСНОВІ TYPEFORM ПИТАНЬ
function generateSmartButtons(message: string, conversationHistory: any[], language: string = 'en'): string[] {
  const projectInfo = extractProjectInfo(conversationHistory);
  const lastAIMessage = conversationHistory.filter((msg: any) => msg.role === 'assistant').pop()?.content?.toLowerCase() || '';
  
  console.log('=== SMART BUTTONS DEBUG ===');
  console.log('Project info step:', projectInfo.step);
  console.log('Last AI message:', lastAIMessage);
  
  // Якщо AI не задає питання, кнопки не потрібні
  if (!lastAIMessage.includes('?')) {
    console.log('AI is not asking a question - no buttons');
    return [];
  }
  
  try {
    // Отримуємо поточне питання з typeform
    const currentQuestion = getCurrentTypeformQuestion(projectInfo.step);
    
    if (currentQuestion && currentQuestion.buttons) {
      console.log('Using typeform question:', currentQuestion.question);
      console.log('Available buttons:', currentQuestion.buttons);
      
      // Перевіряємо чи AI задає схоже питання
      const isRelevantQuestion = isQuestionRelevant(lastAIMessage, currentQuestion.type);
      
      if (isRelevantQuestion) {
        console.log('✅ Relevant question detected - showing buttons');
        return currentQuestion.buttons;
      }
    }
  } catch (error) {
    console.log('Error using typeform data:', error);
  }
  
  console.log('No relevant question detected - no buttons');
  return [];
}

// Отримуємо поточне питання з typeform на основі кроку
function getCurrentTypeformQuestion(step: number) {
  const typeformData = typeformQuestions;
  const questionIndex = Math.min(step, typeformData.questions.length - 1);
  return typeformData.questions[questionIndex];
}

// Перевіряємо чи AI задає релевантне питання
function isQuestionRelevant(aiMessage: string, questionType: string) {
  const keywordsMap: { [key: string]: string[] } = {
    'project_type': ['type', 'project', 'hiring', 'build', 'create', 'develop'],
    'product_type': ['product', 'service', 'building', 'creating', 'developing'],
    'specifications': ['specifications', 'ready', 'ideas', 'documentation', 'research'],
    'goal': ['goal', 'objective', 'purpose', 'want', 'need', 'looking'],
    'time_commitment': ['time', 'commitment', 'hours', 'week', 'schedule'],
    'team_size': ['designers', 'team', 'people', 'members', 'size'],
    'duration': ['long', 'duration', 'months', 'weeks', 'help', 'design'],
    'start_date': ['start', 'begin', 'when', 'immediately', 'timeline'],
    'scope': ['scope', 'size', 'big', 'project', 'work', 'enterprise'],
    'services': ['services', 'need', 'ux', 'ui', 'research', 'prototyping'],
    'complexity': ['complex', 'app', 'simple', 'advanced', 'enterprise']
  };
  
  const keywords = keywordsMap[questionType] || [];
  return keywords.some(keyword => aiMessage.includes(keyword));
}

// Всі функції для кнопок видалені - вони більше не потрібні

// Спрощена функція для відстеження проекту (без кнопок)
function extractProjectInfo(conversationHistory: any[]) {
  const info: any = {
    type: '',
    industry: '',
    features: [],
    budget: '',
    timeline: '',
    step: 0
  };
  
  // Простий підрахунок кроку на основі кількості повідомлень
  const userMessages = conversationHistory.filter((msg: any) => msg.role === 'user');
  info.step = Math.min(userMessages.length, 5);
  
  // Базове відстеження інформації про проект
  conversationHistory.forEach(msg => {
    const content = msg.content?.toLowerCase() || '';
    
    // Extract project type
    if (content.includes('веб-сайт') || content.includes('website') || content.includes('сайт')) {
      info.type = 'website';
    }
    if (content.includes('додаток') || content.includes('app') || content.includes('мобільний')) {
      info.type = 'mobile-app';
    }
    if (content.includes('e-commerce') || content.includes('магазин')) {
      info.type = 'ecommerce';
    }
    
    // Extract industry
    if (content.includes('ресторан') || content.includes('кафе')) {
      info.industry = 'restaurant';
    }
    if (content.includes('магазин') || content.includes('торгівля')) {
      info.industry = 'store';
    }
    if (content.includes('послуги') || content.includes('консультація')) {
      info.industry = 'services';
    }
    if (content.includes('авто') || content.includes('автомобіль')) {
      info.industry = 'automotive';
    }
    
    // Extract budget
    if (content.includes('до 10') || content.includes('менше 10')) {
      info.budget = 'under-10k';
    }
    if (content.includes('10-25') || content.includes('10 до 25')) {
      info.budget = '10k-25k';
    }
    if (content.includes('25+') || content.includes('більше 25')) {
      info.budget = '25k+';
    }
    
    // Extract timeline
    if (content.includes('1-2') || content.includes('швидко')) {
      info.timeline = '1-2-months';
    }
    if (content.includes('3-6') || content.includes('середній')) {
      info.timeline = '3-6-months';
    }
    if (content.includes('6+') || content.includes('довго')) {
      info.timeline = '6+months';
    }
  });
  
  return info;
}

// Очищення та мапінг під ProjectCardState
function cleanProjectInfo(raw: any, prevCard?: ProjectCardState): Partial<ProjectCardState> {
  const allowed = [
    'projectName',
    'projectType',
    'description',
    'targetAudience',
    'features',
    'budget',
    'timeline',
    'competitors',
    'website',
  ];
  const cleaned: any = {};
  for (const key of allowed) {
    const prev = prevCard?.[key];
    const value = raw[key];
    if (value && typeof value === 'object' && 'value' in value) {
      // Якщо вже є final — не перезаписуємо
      if (prev && prev.status === 'final') {
        cleaned[key] = prev;
      } else {
        cleaned[key] = { value: value.value, status: 'draft' };
      }
    }
  }
  return cleaned;
}

// Функція для вибору AI залежно від складності
function shouldUseClaude(message: string, conversationHistory: any[]): boolean {
  // Прості питання - використовуємо Claude Haiku (швидше)
  const simplePatterns = [
    /^(привіт|hello|hi|доброго дня|доброго ранку)/i,
    /^(дякую|спасибо|thank you|thanks)/i,
    /^(так|ні|yes|no|ok|ок)/i,
    /^(що|what|як|how|коли|when|де|where)/i
  ];
  
  // Складні питання - використовуємо GPT-3.5 (якісніше)
  const complexPatterns = [
    /проект|project|дизайн|design|розробка|development/i,
    /оцінка|estimate|ціна|price|бюджет|budget/i,
    /функціональність|functionality|можливості|features/i
  ];
  
  const isSimple = simplePatterns.some(pattern => pattern.test(message));
  const isComplex = complexPatterns.some(pattern => pattern.test(message));
  
  // Якщо є API ключ Claude і питання просте - використовуємо Claude
  return process.env.ANTHROPIC_API_KEY && isSimple && !isComplex;
}

export async function POST(req: NextRequest) {
  const { message, conversationHistory = [], sessionId, language = 'en' } = await req.json();

  // Створюємо контекст розмови з повною історією
  const conversationContext = conversationHistory.length > 0 
    ? conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    : [];
    
  console.log('Conversation context:', conversationContext);
  console.log('Current message:', message);

  let completion;
  
  // Вибираємо AI залежно від складності
  if (shouldUseClaude(message, conversationHistory)) {
    // Використовуємо Claude Haiku для простих питань
    try {
      completion = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: SYSTEM_PROMPT(language),
        messages: conversationContext.concat([{ role: "user", content: message }])
      });
    } catch (error) {
      console.log('Claude failed, falling back to GPT-3.5:', error);
      // Fallback до GPT-3.5
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT(language) },
          ...conversationContext,
          { role: "user", content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });
    }
  } else {
    // Використовуємо GPT-3.5 для складних питань
    completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT(language) },
        ...conversationContext,
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
  }

  try {
    // Обробляємо відповідь залежно від типу AI
    let rawContent = '';
    if (completion.choices) {
      // OpenAI response
      rawContent = completion.choices[0].message.content || '';
    } else if (completion.content) {
      // Claude response
      rawContent = Array.isArray(completion.content) 
        ? completion.content.map(block => block.text).join('')
        : completion.content;
    }
    
    let content = rawContent;
    // Видаляємо службові рядки (JSON, SuggestedAnswers) з тексту відповіді
    content = content.replace(/JSON:[\s\S]*?(SuggestedAnswers:|---|$)/gi, '').replace(/SuggestedAnswers:[\s\S]*?(---|$)/gi, '').replace(/SUGGESTED:\s*\[[^\]]*\]/gi, '').replace(/\n{2,}/g, '\n').trim();
    
    let suggestedAnswers = parseSuggestedAnswers(rawContent);
    
    // КНОПКИ ВИДАЛЕНІ - завжди повертаємо порожній масив
    suggestedAnswers = [];
    
    return NextResponse.json({
      content,
      completionStatus: "incomplete",
      nextQuestions: [],
      shouldTriggerWorkers: false,
      suggestedAnswers
    });
  } catch (error) {
    console.error('Error processing AI response:', error);
    return NextResponse.json({
      content: "Sorry, an error occurred while processing the response.",
      completionStatus: "incomplete",
      nextQuestions: [],
      shouldTriggerWorkers: false,
      suggestedAnswers: []
    });
  }
} 