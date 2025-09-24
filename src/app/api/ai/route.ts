import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getChatSession, updateProjectCard } from '../../../lib/firestore';
import { ProjectCardState } from '../../../types/chat';
import { parseProjectInfoFromText } from '../../../utils/parseProjectInfo';
import typeformQuestions from '../../../data/typeform-questions.json';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = (language: string) => `You are a flexible AI consultant for Cieden. You know everything about Cieden: our cases, team, processes, UX/UI, design, development, website, approaches, values, and expertise.

You communicate with the client as a human: answer any questions about Cieden, give useful advice, share experience, talk about cases, team, website, processes, expertise, approaches, values, technologies, anything that may be helpful.

IMPORTANT: Always respond in ${language === 'uk' ? 'Ukrainian' : 'English'} language. Never mix languages in your responses.

🎯 SIMPLE PROJECT CONSULTATION:
Ask ONE simple question at a time, like a real consultant would.

📋 QUESTION RULES:
- Keep questions SHORT and SIMPLE
- Ask ONE thing at a time
- Be conversational and friendly
- Don't overwhelm with multiple questions

🧠 CONVERSATION FLOW:
- ALWAYS read the conversation history first
- Understand what the client already told you
- Ask questions in LOGICAL ORDER:
  1. First: What type of project? (Website, App, etc.)
  2. Second: What industry/business? (Restaurant, Store, etc.)
  3. Third: What features needed? (Simple, Advanced, etc.)
  4. Fourth: Budget and timeline
- If client says "I don't know" - ask a different, simpler question
- If client gives specific answer - acknowledge it and ask next logical question
- NEVER repeat questions you already know answers to
- ADAPT your questions based on what client already said

💡 BUTTON HANDLING:
- ONLY provide buttons when asking a direct question
- If explaining something - NO buttons needed
- If asking a question - provide 3-4 relevant buttons
- Acknowledge client's choice
- Ask next simple question

❗️CRITICAL RULES:
1. Ask ONLY ONE simple question per response
2. Keep questions SHORT (max 1-2 sentences)
3. Be friendly and conversational
4. Don't create long lists or multiple questions
5. Acknowledge client's answers before asking next question
6. READ conversation history to understand context
7. If client says "I don't know" - change the question completely
8. NEVER give generic responses - always be specific to the conversation
9. NEVER write long explanations or numbered lists
10. Keep responses under 50 words
11. If explaining something - don't ask questions, just explain
12. If asking a question - make it clear and direct
13. NEVER ask multiple questions in one message
14. Follow logical order: Project Type → Industry → Features → Budget → Timeline
15. ALWAYS remember what client already told you
16. NEVER repeat questions you already asked
17. ALWAYS adapt your next question based on client's previous answers
18. NEVER ask questions out of logical order
19. ALWAYS provide context-aware buttons when asking questions
20. NEVER provide buttons when explaining something

🎯 CONTEXT AWARENESS:
- Remember: Project Type → Industry → Features → Budget → Timeline
- If client says "I don't know" - ask a different, simpler question
- If client gives partial answer - ask for clarification
- If client gives complete answer - move to next logical step
- NEVER skip steps in logical order
- NEVER repeat information client already provided
- ALWAYS build on previous answers

🎯 EXAMPLES OF GOOD QUESTIONS:
- "What type of project do you need?" (Step 1)
- "What industry is your business in?" (Step 2)
- "What features do you need?" (Step 3)
- "What's your budget range?" (Step 4)
- "When do you need it completed?" (Step 5)

🎯 EXAMPLES OF BAD QUESTIONS:
- "What type of project and what industry?" (Too many questions)
- "What's your budget?" (Before knowing project type)
- "What features do you need?" (Before knowing industry)
- "When do you need it?" (Before knowing features)

All answers must be maximally useful for future estimation and manager: gather details that help understand real goals, expectations, problems, and client wishes.

❗️Never insert SuggestedAnswers into the client text. All suggestions must be ONLY in a special SuggestedAnswers block after JSON, and NEVER in the client text. If you break this rule — your answer will not be accepted!

No service lines, JSON, or suggestions in the client text.

Format:
---
Your single question here

SuggestedAnswers:
["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]
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

// Розумна функція для генерації кнопок на основі контексту
function generateSmartButtons(message: string, conversationHistory: any[], language: string = 'en'): string[] {
  const currentMessage = message.toLowerCase();
  const projectInfo = extractProjectInfo(conversationHistory);
  const lastUserMessage = conversationHistory.filter((msg: any) => msg.role === 'user').pop()?.content?.toLowerCase() || '';
  const lastAIMessage = conversationHistory.filter((msg: any) => msg.role === 'assistant').pop()?.content?.toLowerCase() || '';

  console.log('=== SMART BUTTONS DEBUG ===');
  console.log('Last AI message:', lastAIMessage);
  console.log('Current message:', currentMessage);
  console.log('Project info:', projectInfo);
  console.log('Current step:', projectInfo.step);

  // Якщо AI пояснює або не задає прямих питань, кнопки не потрібні
  if (lastAIMessage.includes('залежить від') || 
      lastAIMessage.includes('впливає на') || 
      lastAIMessage.includes('пояснюю') ||
      lastAIMessage.includes('розумію') ||
      lastAIMessage.includes('чудово') ||
      lastAIMessage.includes('відмінно') ||
      !lastAIMessage.includes('?')) {
    console.log('AI is explaining or not asking direct question - no buttons needed');
    return [];
  }

  // НЕ використовуємо typeform-questions.json поки що - він створює плутанину
  // Замість цього використовуємо розумне розпізнавання контексту

  // Розумне розпізнавання контексту на основі останнього повідомлення AI
  const contextKeywords = {
    'project_type': ['який тип', 'що створити', 'який проект', 'сайт', 'додаток', 'app', 'website', 'мобільний'],
    'industry': ['яка галузь', 'в якій галузі', 'бізнес', 'сфера', 'ресторан', 'магазин', 'послуги', 'авто', 'медицина'],
    'features': ['які функції', 'які можливості', 'що потрібно', 'які фічі', 'функціонал'],
    'budget': ['який бюджет', 'бюджет', 'ціна', 'коштувати', 'доларів', 'гроші', 'скільки', 'вартість', 'терміни'],
    'timeline': ['коли', 'термін', 'час', 'швидко', 'терміново', 'негайно', 'місяці', 'тижні', 'завершити', 'плануєте']
  };

  // Шукаємо відповідний контекст
  for (const [context, keywords] of Object.entries(contextKeywords)) {
    const hasRelevantKeywords = keywords.some(keyword => lastAIMessage.includes(keyword));
    console.log(`Checking ${context}: keywords=${keywords.join(', ')}, found=${hasRelevantKeywords}`);
    if (hasRelevantKeywords) {
      console.log(`✅ Detected ${context} context - showing buttons`);
      const buttons = getContextButtons(context, language);
      console.log(`Buttons for ${context}:`, buttons);
      return buttons;
    }
  }
  
  console.log('No specific context detected - no buttons');
  return [];
}

// Функція для отримання ключових слів питання
function getQuestionKeywords(questionType: string): string[] {
  const keywordsMap: { [key: string]: string[] } = {
    'project_type': ['тип', 'проект', 'створити', 'зробити', 'сайт', 'додаток'],
    'product_type': ['продукт', 'сервіс', 'створюєте', 'розробляєте'],
    'specifications': ['специфікації', 'готові', 'ідеї', 'документи'],
    'goal': ['мета', 'ціль', 'хочете', 'потрібно'],
    'time_commitment': ['час', 'затрат', 'плануєте', 'тиждень'],
    'team_size': ['дизайнерів', 'команда', 'людей', 'спеціалістів'],
    'duration': ['довго', 'допомога', 'дизайн', 'місяці', 'тижні'],
    'start_date': ['почати', 'коли', 'негайно', 'термін'],
    'scope': ['розмір', 'проект', 'малий', 'великий', 'enterprise'],
    'services': ['послуги', 'потрібні', 'ux', 'ui', 'прототип'],
    'complexity': ['складний', 'додаток', 'essential', 'advanced']
  };
  
  return keywordsMap[questionType] || [];
}

// Функція для отримання кнопок за контекстом
function getContextButtons(context: string, language: string): string[] {
  const buttonsMap: { [key: string]: { [lang: string]: string[] } } = {
    'project_type': {
      'uk': ["Веб-сайт", "Мобільний додаток", "E-commerce", "Dashboard", "Не знаю"],
      'en': ["Website", "Mobile App", "E-commerce", "Dashboard", "I don't know"]
    },
    'industry': {
      'uk': ["Ресторан", "Магазин", "Послуги", "Авто", "Медицина", "Інше"],
      'en': ["Restaurant", "Store", "Services", "Automotive", "Healthcare", "Other"]
    },
    'features': {
      'uk': ["Базові функції", "Розширені можливості", "Кастомні рішення", "Не знаю"],
      'en': ["Basic features", "Advanced features", "Custom solutions", "I don't know"]
    },
    'budget': {
      'uk': ["До $10,000", "$10,000-25,000", "$25,000-50,000", "$50,000+", "Не знаю"],
      'en': ["Under $10,000", "$10,000-25,000", "$25,000-50,000", "$50,000+", "I don't know"]
    },
    'timeline': {
      'uk': ["1-2 місяці", "3-6 місяців", "6+ місяців", "Терміново", "Не знаю"],
      'en': ["1-2 months", "3-6 months", "6+ months", "Urgent", "I don't know"]
    }
  };
  
  return buttonsMap[context]?.[language] || [];
}

function extractProjectInfo(conversationHistory: any[]) {
  const info: any = {
    type: '',
    industry: '',
    features: [],
    budget: '',
    timeline: '',
    step: 0
  };
  
  // Підраховуємо кількість питань AI для визначення кроку
  const aiMessages = conversationHistory.filter((msg: any) => msg.role === 'assistant');
  const userMessages = conversationHistory.filter((msg: any) => msg.role === 'user');
  
  // Базовий крок на основі кількості обмінів
  info.step = Math.min(Math.floor(userMessages.length / 2), 5);
  
  conversationHistory.forEach(msg => {
    const content = msg.content?.toLowerCase() || '';
    
    // Extract project type
    if (content.includes('веб-сайт') || content.includes('website') || content.includes('сайт')) {
      info.type = 'website';
      info.step = Math.max(info.step, 1);
    }
    if (content.includes('додаток') || content.includes('app') || content.includes('мобільний') || content.includes('мобіл')) {
      info.type = 'mobile-app';
      info.step = Math.max(info.step, 1);
    }
    if (content.includes('e-commerce') || content.includes('магазин') || content.includes('інтернет-магазин')) {
      info.type = 'ecommerce';
      info.step = Math.max(info.step, 1);
    }
    if (content.includes('dashboard') || content.includes('дашборд')) {
      info.type = 'dashboard';
      info.step = Math.max(info.step, 1);
    }
    
    // Extract industry
    if (content.includes('ресторан') || content.includes('кафе') || content.includes('їжа')) {
      info.industry = 'restaurant';
      info.step = Math.max(info.step, 2);
    }
    if (content.includes('магазин') || content.includes('торгівля') || content.includes('продажі')) {
      info.industry = 'store';
      info.step = Math.max(info.step, 2);
    }
    if (content.includes('послуги') || content.includes('консультація') || content.includes('допомога')) {
      info.industry = 'services';
      info.step = Math.max(info.step, 2);
    }
    if (content.includes('авто') || content.includes('автомобіль') || content.includes('машина')) {
      info.industry = 'automotive';
      info.step = Math.max(info.step, 2);
    }
    if (content.includes('медицина') || content.includes('здоров\'я') || content.includes('лікар')) {
      info.industry = 'healthcare';
      info.step = Math.max(info.step, 2);
    }
    
    // Extract features
    if (content.includes('базові') || content.includes('простий') || content.includes('мінімальний') || content.includes('basic')) {
      info.features.push('basic');
      info.step = Math.max(info.step, 3);
    }
    if (content.includes('розширені') || content.includes('складний') || content.includes('додаткові') || content.includes('advanced')) {
      info.features.push('advanced');
      info.step = Math.max(info.step, 3);
    }
    if (content.includes('кастомні') || content.includes('індивідуальний') || content.includes('унікальний') || content.includes('custom')) {
      info.features.push('custom');
      info.step = Math.max(info.step, 3);
    }
    
    // Extract budget
    if (content.includes('до 10') || content.includes('менше 10') || content.includes('недорого') || content.includes('under 10')) {
      info.budget = 'under-10k';
      info.step = Math.max(info.step, 4);
    }
    if (content.includes('10-25') || content.includes('10 до 25') || content.includes('середній бюджет') || content.includes('10 to 25')) {
      info.budget = '10k-25k';
      info.step = Math.max(info.step, 4);
    }
    if (content.includes('25-50') || content.includes('25 до 50')) {
      info.budget = '25k-50k';
      info.step = Math.max(info.step, 4);
    }
    if (content.includes('50+') || content.includes('більше 50') || content.includes('дорого') || content.includes('over 25')) {
      info.budget = '50k+';
      info.step = Math.max(info.step, 4);
    }
    
    // Extract timeline
    if (content.includes('1-2') || content.includes('швидко') || content.includes('терміново') || content.includes('1 to 2')) {
      info.timeline = '1-2-months';
      info.step = Math.max(info.step, 5);
    }
    if (content.includes('3-6') || content.includes('середній термін') || content.includes('нормально') || content.includes('3 to 6')) {
      info.timeline = '3-6-months';
      info.step = Math.max(info.step, 5);
    }
    if (content.includes('6+') || content.includes('довго') || content.includes('не поспішаємо') || content.includes('over 6')) {
      info.timeline = 'over-6-months';
      info.step = Math.max(info.step, 5);
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
    
    // Якщо AI не надав кнопки, генеруємо розумні кнопки на основі контексту
    if (suggestedAnswers.length === 0) {
      suggestedAnswers = generateSmartButtons(message, conversationHistory, language);
    }
    
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