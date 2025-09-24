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

LANGUAGE DETECTION:
- If client writes in English, respond in English
- If client writes in Ukrainian, respond in Ukrainian  
- Match the client's language in your responses
- If language parameter is 'uk' but client writes in English, respond in English
- If language parameter is 'en' but client writes in Ukrainian, respond in Ukrainian

🎯 SMART PROJECT CONSULTATION:
Use structured questions to guide the conversation naturally, but rephrase them conversationally.

📋 QUESTION FLOW (based on typeform):
1. "What type of project are you hiring for?" - Understand their main goal
2. "What type of product or service are you building?" - Learn about their business  
3. "Do you have product specifications ready?" - Assess their preparation level
4. "What is your goal?" - Understand their objectives
5. "What level of time commitment will you require?" - Learn about their needs
6. "How many designers do you need?" - Understand team requirements
7. "How long do you need help with design?" - Timeline expectations
8. "When do you need us to start?" - Urgency and planning
9. "How big is the scope of work?" - Project size assessment
10. "What services do you need?" - Specific requirements
11. "How complex is your app?" - Technical complexity

🧠 CONVERSATION RULES:
- Ask ONE question at a time, naturally
- Use the typeform questions as a guide, but rephrase them conversationally
- Build on previous answers to make questions more personal
- If client says "I don't know" - simplify the question or ask differently
- If client gives specific answer - acknowledge it and move to next logical question
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