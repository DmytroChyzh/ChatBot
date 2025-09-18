import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getChatSession, updateProjectCard } from '../../../lib/firestore';
import { ProjectCardState } from '../../../types/chat';
import { parseProjectInfoFromText } from '../../../utils/parseProjectInfo';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a flexible AI consultant for Cieden. You know everything about Cieden: our cases, team, processes, UX/UI, design, development, website, approaches, values, and expertise.

You communicate with the client as a human: answer any questions about Cieden, give useful advice, share experience, talk about cases, team, website, processes, expertise, approaches, values, technologies, anything that may be helpful.

🎯 TYPEFORM-STYLE PROJECT CONSULTATION:
You follow a structured but flexible approach similar to Typeform, asking ONE question at a time and adapting based on responses.

📋 CORE QUESTIONS FLOW (adapt order based on client responses):
1. **Project Type**: What type of project are you hiring for?
2. **Product Type**: What type of product or service are you building?
3. **Specifications**: Do you have product specifications ready?
4. **Goal**: What is your goal?
5. **Time Commitment**: What level of time commitment will you require?
6. **Team Size**: How many designers do you need?
7. **Duration**: How long do you need help with design?
8. **Start Date**: When do you need us to start?
9. **Scope**: How big is the scope of work?
10. **Services**: What services do you need?
11. **Complexity**: How complex is your app?

🧠 ADAPTIVE QUESTION STRATEGY:
- Ask questions in logical order, but adapt based on client's previous answers
- If client mentions "mobile app" → ask about platforms (Android/iOS)
- If client says "B2B" → ask about integrations and enterprise features
- If client mentions "MVP" → focus on essential features first
- Always build on previous information naturally

💡 SMART BUTTON GENERATION:
Provide 4-5 contextual buttons that match the question type:

**Project Type**: ["Website", "Mobile App", "E-commerce", "Dashboard", "Not sure"]
**Product Type**: ["B2C SaaS", "B2B SaaS", "Business automation", "Marketplace", "Other"]
**Specifications**: ["Need research first", "Have clear ideas", "Have written specs", "Need help documenting"]
**Goal**: ["Design MVP", "Build launchpad", "Full product design", "Need consultation"]
**Time Commitment**: ["Full time (40 hrs/week)", "Part time", "One time project", "Fixed price service"]
**Team Size**: ["One designer", "Multiple designers", "Cross-functional team", "Decide later"]
**Duration**: ["A week", "2-3 weeks", "1-3 months", "3-6 months", "6+ months"]
**Start Date**: ["Immediately", "1-2 weeks", "In a month", "1-3 months", "3+ months"]
**Scope**: ["Small project", "Medium project", "Large project", "Enterprise project", "Not sure"]
**Services**: ["UX Research", "UI Design", "Prototyping", "Design System", "All services"]
**Complexity**: ["Essential (simple)", "Advanced (complex)", "Enterprise-grade", "Need assessment"]

❗️CRITICAL RULES:
1. Ask ONLY ONE question per response
2. Always provide SuggestedAnswers with 4-5 contextual options
3. Never put suggestions in the main text - only in SuggestedAnswers block
4. Adapt questions based on client's previous answers
5. Be conversational and helpful, not robotic

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
function generateSmartButtons(message: string, conversationHistory: any[]): string[] {
  const currentMessage = message.toLowerCase();
  
  // Аналізуємо контекст для генерації релевантних кнопок на основі Typeform
  if (currentMessage.includes('тип') && currentMessage.includes('проект')) {
    return ["Веб-сайт", "Мобільний додаток", "E-commerce", "Dashboard", "Не знаю"];
  }
  
  if (currentMessage.includes('продукт') || currentMessage.includes('сервіс')) {
    return ["B2C SaaS", "B2B SaaS", "Business automation", "Marketplace", "Інше"];
  }
  
  if (currentMessage.includes('специфікації') || currentMessage.includes('готовність')) {
    return ["Потрібне дослідження", "Є чіткі ідеї", "Готові специфікації", "Потрібна допомога"];
  }
  
  if (currentMessage.includes('мета') || currentMessage.includes('ціль')) {
    return ["Дизайн MVP", "Створити launchpad", "Повний дизайн продукту", "Потрібна консультація"];
  }
  
  if (currentMessage.includes('час') && currentMessage.includes('робота')) {
    return ["Full time (40 год/тиждень)", "Part time", "Одноразовий проект", "Фіксована ціна"];
  }
  
  if (currentMessage.includes('дизайнер') || currentMessage.includes('команда')) {
    return ["Один дизайнер", "Кілька дизайнерів", "Кросс-функціональна команда", "Вирішу пізніше"];
  }
  
  if (currentMessage.includes('тривалість') || currentMessage.includes('довго')) {
    return ["Тиждень", "2-3 тижні", "1-3 місяці", "3-6 місяців", "6+ місяців"];
  }
  
  if (currentMessage.includes('почати') || currentMessage.includes('старт')) {
    return ["Негайно", "1-2 тижні", "Через місяць", "1-3 місяці", "3+ місяці"];
  }
  
  if (currentMessage.includes('обсяг') || currentMessage.includes('розмір')) {
    return ["Малий проект", "Середній проект", "Великий проект", "Enterprise проект", "Не знаю"];
  }
  
  if (currentMessage.includes('послуги') || currentMessage.includes('що потрібно')) {
    return ["UX Research", "UI Design", "Prototyping", "Design System", "Всі послуги"];
  }
  
  if (currentMessage.includes('складність') || currentMessage.includes('складний')) {
    return ["Essential (простий)", "Advanced (складний)", "Enterprise-grade", "Потрібна оцінка"];
  }
  
  // Загальні кнопки для невизначених ситуацій
  return ["Так", "Ні", "Не знаю", "Потрібна допомога", "Пропустити"];
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
  const { message, conversationHistory = [], sessionId } = await req.json();

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
        system: SYSTEM_PROMPT,
        messages: conversationContext.concat([{ role: "user", content: message }])
      });
    } catch (error) {
      console.log('Claude failed, falling back to GPT-3.5:', error);
      // Fallback до GPT-3.5
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
        { role: "system", content: SYSTEM_PROMPT },
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
      suggestedAnswers = generateSmartButtons(message, conversationHistory);
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