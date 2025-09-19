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

  // Якщо AI пояснює, кнопки не потрібні
  if (lastAIMessage.includes('залежить від') || lastAIMessage.includes('впливає на') || lastAIMessage.includes('пояснюю')) {
    console.log('AI is explaining - no buttons needed');
    return [];
  }

  // Якщо AI задає питання
  if (lastAIMessage.includes('?')) {
    console.log('AI is asking a question:', lastAIMessage);
    
    // Розумне розпізнавання контексту на основі поточного кроку
    if (projectInfo.step === 0 || projectInfo.step === 1) {
      // Крок 1: Тип проекту
      if (lastAIMessage.includes('який') && lastAIMessage.includes('тип') && lastAIMessage.includes('проект')) {
        console.log('Detected project type question');
        return language === 'uk' ? ["Веб-сайт", "Мобільний додаток", "E-commerce", "Не знаю"] : ["Website", "Mobile App", "E-commerce", "I don't know"];
      }
    }
    
    if (projectInfo.step === 1 || projectInfo.step === 2) {
      // Крок 2: Сфера бізнесу
      if (lastAIMessage.includes('яка') && lastAIMessage.includes('галузь')) {
        console.log('Detected industry question');
        return language === 'uk' ? ["Ресторан", "Магазин", "Послуги", "Інше"] : ["Restaurant", "Store", "Services", "Other"];
      }
    }
    
    if (projectInfo.step === 2 || projectInfo.step === 3) {
      // Крок 3: Функції
      if (lastAIMessage.includes('які') && lastAIMessage.includes('функції')) {
        console.log('Detected features question');
        return language === 'uk' ? ["Базові", "Розширені", "Кастомні", "Не знаю"] : ["Basic", "Advanced", "Custom", "I don't know"];
      }
    }
    
    if (projectInfo.step === 3 || projectInfo.step === 4) {
      // Крок 4: Бюджет
      if (lastAIMessage.includes('який') && lastAIMessage.includes('бюджет')) {
        console.log('Detected budget question');
        return language === 'uk' ? ["До $10,000", "$10,000-25,000", "$25,000+", "Не знаю"] : ["Under $10,000", "$10,000-25,000", "$25,000+", "I don't know"];
      }
    }
    
    if (projectInfo.step === 4 || projectInfo.step === 5) {
      // Крок 5: Терміни
      if (lastAIMessage.includes('який') && lastAIMessage.includes('термін')) {
        console.log('Detected timeline question');
        return language === 'uk' ? ["1-2 місяці", "3-6 місяців", "6+ місяців", "Не знаю"] : ["1-2 months", "3-6 months", "6+ months", "I don't know"];
      }
    }
    
    // Додаткові контекстні кнопки
    if (lastAIMessage.includes('побажання') || lastAIMessage.includes('вимоги')) {
      return language === 'uk' ? ["Так, є побажання", "Ні, немає", "Потрібна допомога", "Не знаю"] : ["Yes, I have wishes", "No, none", "Need help", "I don't know"];
    }
    
    if (lastAIMessage.includes('реалізувати') || lastAIMessage.includes('зробити') || lastAIMessage.includes('створити')) {
      return language === 'uk' ? ["Так, можна", "Ні, не можна", "Потрібна консультація", "Не знаю"] : ["Yes, possible", "No, not possible", "Need consultation", "I don't know"];
    }
  }
  
  // Якщо AI не задає питання, кнопки не потрібні
  console.log('No specific context detected - no buttons');
  return [];
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
  
  conversationHistory.forEach(msg => {
    const content = msg.content?.toLowerCase() || '';
    
    // Extract project type
    if (content.includes('веб-сайт') || content.includes('website')) {
      info.type = 'website';
      info.step = Math.max(info.step, 1);
    }
    if (content.includes('додаток') || content.includes('app') || content.includes('мобільний')) {
      info.type = 'mobile-app';
      info.step = Math.max(info.step, 1);
    }
    if (content.includes('e-commerce') || content.includes('магазин')) {
      info.type = 'ecommerce';
      info.step = Math.max(info.step, 1);
    }
    
    // Extract industry
    if (content.includes('ресторан')) {
      info.industry = 'restaurant';
      info.step = Math.max(info.step, 2);
    }
    if (content.includes('магазин')) {
      info.industry = 'store';
      info.step = Math.max(info.step, 2);
    }
    if (content.includes('послуги')) {
      info.industry = 'services';
      info.step = Math.max(info.step, 2);
    }
    
    // Extract features
    if (content.includes('базові') || content.includes('basic')) {
      info.features.push('basic');
      info.step = Math.max(info.step, 3);
    }
    if (content.includes('розширені') || content.includes('advanced')) {
      info.features.push('advanced');
      info.step = Math.max(info.step, 3);
    }
    if (content.includes('кастомні') || content.includes('custom')) {
      info.features.push('custom');
      info.step = Math.max(info.step, 3);
    }
    
    // Extract budget
    if (content.includes('до 10') || content.includes('under 10')) {
      info.budget = 'under-10k';
      info.step = Math.max(info.step, 4);
    }
    if (content.includes('10-25') || content.includes('10 to 25')) {
      info.budget = '10-25k';
      info.step = Math.max(info.step, 4);
    }
    if (content.includes('25+') || content.includes('over 25')) {
      info.budget = 'over-25k';
      info.step = Math.max(info.step, 4);
    }
    
    // Extract timeline
    if (content.includes('1-2') || content.includes('1 to 2')) {
      info.timeline = '1-2-months';
      info.step = Math.max(info.step, 5);
    }
    if (content.includes('3-6') || content.includes('3 to 6')) {
      info.timeline = '3-6-months';
      info.step = Math.max(info.step, 5);
    }
    if (content.includes('6+') || content.includes('over 6')) {
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