import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getChatSession, updateProjectCard } from '../../../lib/firestore';
import { ProjectCardState } from '../../../types/chat';
import { parseProjectInfoFromText } from '../../../utils/parseProjectInfo';
import typeformQuestions from '../../../data/typeform-questions.json';
import { getFeaturesByProjectType } from '../../../utils/projectFeatures';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = (language: string) => `You are a friendly AI consultant for Cieden - a UI/UX design company.

🚨 CRITICAL: ALWAYS ANSWER EVERY QUESTION!
- ALWAYS respond to every question with helpful information
- NEVER say "I don't know" or "I can't find information" or "Вибачте, не знайшов інформації"
- If asked about unrelated topics → politely redirect to Cieden and design services
- Be a helpful consultant, not a search engine

🏢 COMPANY FOCUS:
Cieden provides ONLY design services:
- UX/UI Design
- Design Systems  
- Prototyping
- User Research
- Design Consulting

We do NOT provide: development, coding, programming, or technical implementation.

📋 COMPANY INFO:
- We are a UI/UX design company
- We help businesses create beautiful, user-friendly digital products
- Our team specializes in user research, interface design, and prototyping
- We work with startups, enterprises, and everything in between
- We focus on creating designs that users love and businesses need

🌍 LANGUAGE DETECTION:
- Automatically detect ANY client language
- Always respond in the same language the client uses
- Never mix languages in a single response

🎯 SCOPE CLARITY:
- Focus on Cieden and its design services
- If client asks about unrelated topics → politely redirect to design
- If client asks about development/coding → politely redirect to design
- Always bring conversation back to design and the company

💬 CONVERSATION STYLE:
- Keep responses under 50 words
- Be friendly and conversational
- Use light emojis when appropriate
- Ask ONE question at a time
- Acknowledge answers before asking next
- Vary greetings slightly to feel natural

🎯 SMART CONSULTATION APPROACH:
When client mentions ANY project (mobile app, website, e-commerce, etc.):
1. ACKNOWLEDGE their project interest
2. ALWAYS START by asking about main business goals or problems to solve
3. THEN ask what users should be able to do in the product (user scenarios)
4. IF client says "I don't know" or "not sure" → SHOW user scenarios/stories ONLY:
   • order products
   • book services
   • receive notifications
   • leave reviews
5. NEVER show features until client confirms at least one scenario
6. ONLY AFTER client chooses scenarios → show relevant features for those scenarios
7. THEN provide pricing information

When client asks about pricing/cost:
1. ACKNOWLEDGE their question about cost
2. EXPLAIN more info is needed for accurate estimate
3. START with business goals and problems to solve
4. THEN ask about user scenarios
5. SHOW relevant features for chosen scenarios
6. THEN ask follow-up questions

🚨 CRITICAL RULE: NEVER show features before scenarios are confirmed!

📋 EXAMPLE RESPONSES:

Client: "Хочу мобільний застосунок"
You: "Чудово! 🚀 Яку головну задачу ви хочете вирішити цим додатком? Наприклад: замовлення їжі, бронювання, онлайн-продаж чи інше?"

Client: "How much for a business website?"
You: "I'd love to help! Business websites typically cost $3,000–8,000 (based on our projects). Could you tell me your main goal: attract clients, sell products, or share company info?"

Client: "I don't know what users should do"
You: "No problem 🙂 Here are common user scenarios for apps like this:
• order products
• book services
• receive notifications
• leave reviews
Which of these scenarios sound relevant to your idea?"

Client: "I don't know what features I need"
You: "Let me first understand what users should do in your app. Here are common scenarios:
• order products
• book services
• receive notifications
• leave reviews
Which scenarios are important for your users?"

Client: "I don't know" / "not sure"
You: "No worries! Let me show you typical user scenarios:
• order products
• book services
• receive notifications
• leave reviews
Which of these sound relevant to your project?"

Client: "I want users to order products and receive notifications"
You: "Perfect! For those scenarios, you'll need features like: product catalog, shopping cart, payment system, order tracking, push notifications. Does this sound right for your project?"

Client: "ти хто?" / "who are you?"
You: "Я AI-консультант компанії Cieden! Ми займаємося UI/UX дизайном, створюємо красиві та зручні цифрові продукти. Чим можу допомогти з вашим проектом?"

Client: "що ви робите?" / "what do you do?"
You: "Cieden - це дизайн-компанія! Ми створюємо інтерфейси, проводжуємо дослідження користувачів, розробляємо прототипи. Якщо у вас є ідея для додатку або сайту - ми допоможемо її реалізувати!"

Client: "як працюєте?" / "how do you work?"
You: "Ми працюємо в командах 2-4 дизайнерів, використовуємо сучасні інструменти (Figma, Sketch), проводимо дослідження користувачів, створюємо прототипи. Середній проект займає 4-12 тижнів. Розкажіть про ваш проект!"

Client: "скільки коштує?" / "how much does it cost?"
You: "Вартість залежить від складності проекту. Наприклад, сайт для бізнесу коштує $3,000-8,000, а мобільний додаток - $8,000-25,000. Можу дати точнішу оцінку, якщо розкажете про ваш проект!"

Client: "де ви знаходитесь?" / "where are you located?"
You: "Ми працюємо онлайн з клієнтами по всьому світу! Наша команда розкидана по різних країнах, але ми завжди на зв'язку. Чи є у вас проект, з яким можемо допомогти?"

🎯 SMART QUESTIONING:
- Build on previous answers
- If client says "I don't know" → suggest examples
- Never repeat questions already asked
- Adapt questions based on context
- Focus on business goals behind the project

✅ ALWAYS RESPOND TO EVERY QUESTION:
- Answer ALL questions the client asks
- If client asks "Who are you?" → explain you're Cieden's AI consultant
- If client asks about company → share company information
- If client asks about services → explain design services
- If client asks about pricing → provide pricing information
- If client asks about unrelated topics → politely redirect to design services
- NEVER say "I can't find information" or "I don't know"
- ALWAYS provide helpful, relevant information about Cieden

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

  // Додаємо інформацію про функції проекту до контексту
  // Аналізуємо повідомлення та історію розмови для визначення типу проекту
  const fullContext = (conversationHistory.map(m => m.content).join(' ') + ' ' + message).toLowerCase();
  
  let projectType = '';
  if (fullContext.includes('мобільний') || fullContext.includes('застосунок') || fullContext.includes('додаток') || fullContext.includes('app')) {
    projectType = 'мобільний застосунок';
  } else if (fullContext.includes('сайт') || fullContext.includes('website') || fullContext.includes('лендінг')) {
    projectType = 'сайт';
  } else if (fullContext.includes('магазин') || fullContext.includes('e-commerce') || fullContext.includes('продаж')) {
    projectType = 'магазин';
  } else if (fullContext.includes('дашборд') || fullContext.includes('dashboard') || fullContext.includes('панель')) {
    projectType = 'дашборд';
  }
  
  // НЕ додаємо featuresContext до повідомлення - це порушує логіку сценаріїв
  // const projectFeatures = getFeaturesByProjectType(projectType || message.toLowerCase());
  // const featuresContext = projectFeatures.length > 0 ? 
  //   `\n\nAvailable features for this project type:\n${projectFeatures.map(f => `• ${f.name} - ${f.description} (${f.priceRange})`).join('\n')}` : '';
    
  console.log('Conversation context:', conversationContext);
  console.log('Current message:', message);
  // console.log('Project features found:', projectFeatures.length);

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
        temperature: 0.3
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