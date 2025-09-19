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

🎯 TYPEFORM-STYLE PROJECT CONSULTATION:
You follow a structured approach using predefined questions, but remain flexible and conversational.

📋 QUESTION STRUCTURE:
You have access to a structured set of questions. Use them as a guide, but adapt naturally to the conversation flow.

🧠 ADAPTIVE STRATEGY:
- Ask ONE question at a time
- Remember ALL previous answers from the conversation
- If client clicks a button or gives a specific answer, acknowledge it and ask the next logical question
- If client asks something unrelated, answer their question first, then continue with the consultation
- Always be helpful and conversational
- Build on previous information naturally
- NEVER ask about information you already know from the conversation

💡 BUTTON HANDLING:
- When client clicks a button, acknowledge their choice and ask the next question
- If client types a free-form answer, acknowledge it and ask the next question
- Always provide SuggestedAnswers with 4-5 contextual options

❗️CRITICAL RULES:
1. Ask ONLY ONE question per response
2. Always provide SuggestedAnswers with 4-5 contextual options
3. Never put suggestions in the main text - only in SuggestedAnswers block
4. Be conversational and natural, not robotic
5. Acknowledge client's responses before asking next question
6. If client asks unrelated questions, answer them first

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

// Розумна функція для генерації кнопок на основі Typeform структури
function generateSmartButtons(message: string, conversationHistory: any[], language: string = 'en'): string[] {
  const currentMessage = message.toLowerCase();
  
  // Знаходимо відповідне питання з файлу
  for (const question of typeformQuestions.questions) {
    const questionText = question.question.toLowerCase();
    
    // Перевіряємо чи поточне повідомлення відповідає питанню
    if (currentMessage.includes('тип') && currentMessage.includes('проект') && questionText.includes('тип')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('продукт') && questionText.includes('продукт')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('специфікації') && questionText.includes('специфікації')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('мета') && questionText.includes('мета')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('час') && questionText.includes('час')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('дизайнер') && questionText.includes('дизайнер')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('тривалість') && questionText.includes('тривалість')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('почати') && questionText.includes('почати')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('обсяг') && questionText.includes('обсяг')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('послуги') && questionText.includes('послуги')) {
      return question.buttons;
    }
    
    if (currentMessage.includes('складність') && questionText.includes('складність')) {
      return question.buttons;
    }
  }
  
  // Загальні кнопки для невизначених ситуацій
  if (language === 'uk') {
    return ["Так", "Ні", "Не знаю", "Потрібна допомога", "Пропустити"];
  } else {
    return ["Yes", "No", "I don't know", "Need help", "Skip"];
  }
}

function extractProjectInfo(conversationHistory: any[]) {
  const info: any = {};
  
  conversationHistory.forEach(msg => {
    const content = msg.content?.toLowerCase() || '';
    
    // Extract project type
    if (content.includes('веб-сайт') || content.includes('website')) info.type = 'website';
    if (content.includes('додаток') || content.includes('app')) info.type = 'app';
    if (content.includes('e-commerce') || content.includes('магазин')) info.type = 'ecommerce';
    
    // Extract industry
    if (content.includes('ресторан')) info.industry = 'restaurant';
    if (content.includes('магазин')) info.industry = 'store';
    if (content.includes('послуги')) info.industry = 'services';
    
    // Extract complexity
    if (content.includes('простий')) info.complexity = 'simple';
    if (content.includes('складний')) info.complexity = 'complex';
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

  // Створюємо контекст розмови
  const conversationContext = conversationHistory.length > 0 
    ? conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    : [];

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