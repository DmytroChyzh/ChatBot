import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getChatSession, updateProjectCard } from '../../../lib/firestore';
import { ProjectCardState } from '../../../types/chat';
import { parseProjectInfoFromText } from '../../../utils/parseProjectInfo';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a flexible AI consultant for Cieden. You know everything about Cieden: our cases, team, processes, UX/UI, design, development, website, approaches, values, and expertise.

You communicate with the client as a human: answer any questions about Cieden, give useful advice, share experience, talk about cases, team, website, processes, expertise, approaches, values, technologies, anything that may be helpful.

If the client wants to start a new project or redesign — you gather all necessary information ONE question at a time. Each next question adapts to the client's answers, never duplicates, never repeats, never uses template lists. Questions are always flexible, personalized, like a real expert.

🎯 ESTIMATION STRATEGY:
- Start with broad questions to understand project scope
- Ask specific questions about functionality, target audience, business goals
- Gather technical requirements, integrations, design preferences
- Understand budget expectations and timeline constraints
- Ask about competitors and unique selling points
- Get details about current state (existing website/app) if applicable

📋 KEY INFORMATION TO GATHER:
1. Project type (website, web app, e-commerce, dashboard, mobile app)
2. Target audience and user personas
3. Core functionality and features
4. Business goals and success metrics
5. Budget range and timeline
6. Design preferences and brand guidelines
7. Technical requirements and integrations
8. Competitors and market positioning
9. Current state (if redesign/improvement)
10. Content management needs

After each question you provide 4-5 relevant answer buttons (SuggestedAnswers), but the client can always type their own answer. Buttons must be short, unique, without duplicates, and maximally helpful for the client.

❗️After EVERY question about project, redesign, functionality, goals, budget, timeline, audience, competitors, UX/UI, you ALWAYS add a SuggestedAnswers block with 4-5 options. If you can't think of any — add ['Other', 'Explain in detail', 'I don't know', 'Skip']. If you break this — the answer will not be accepted!

All answers must be maximally useful for future estimation and manager: gather details that help understand real goals, expectations, problems, and client wishes.

❗️Never insert SuggestedAnswers into the client text. All suggestions must be ONLY in a special SuggestedAnswers block after JSON, and NEVER in the client text. If you break this rule — your answer will not be accepted!

No service lines, JSON, or suggestions in the client text.

Format:
---
Client text

JSON:
{ ... }

SuggestedAnswers:
[ ... ]
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
  // SUGGESTED: ["..."]
  const match = text.match(/SUGGESTED:\s*\[([^\]]+)\]/i);
  let arr: string[] = [];
  if (match) {
    arr = match[1].split(',').map(s => s.replace(/['"\s]/g, '').trim()).filter(Boolean);
  } else {
    // Якщо не знайдено — шукаємо маркдаун-список одразу після питання
    const mdList = text.match(/\n\- ([^\n]+)/g);
    if (mdList) {
      arr = mdList.map(s => s.replace(/\n\- /g, '').trim());
    }
  }
  // Повертаємо лише унікальні підказки
  return Array.from(new Set(arr.filter(Boolean)));
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

export async function POST(req: NextRequest) {
  const { message, conversationHistory = [], sessionId } = await req.json();

  // Створюємо контекст розмови
  const conversationContext = conversationHistory.length > 0 
    ? conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    : [];

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationContext,
      { role: "user", content: message }
    ]
  });

  try {
    let content = completion.choices[0].message.content || '';
    // Видаляємо службові рядки (JSON, SuggestedAnswers) з тексту відповіді
    content = content.replace(/JSON:[\s\S]*?(SuggestedAnswers:|---|$)/gi, '').replace(/SuggestedAnswers:[\s\S]*?(---|$)/gi, '').replace(/SUGGESTED:\s*\[[^\]]*\]/gi, '').replace(/\n{2,}/g, '\n').trim();
    // НЕ парсимо і НЕ оновлюємо картку з відповіді асистента!
    // const projectInfoRaw = parseProjectInfoFromText(content);
    // const projectInfo = cleanProjectInfo(projectInfoRaw);
    const suggestedAnswers = parseSuggestedAnswers(completion.choices[0].message.content || '');
    return NextResponse.json({
      content,
      // projectInfo: {},
      completionStatus: "incomplete",
      nextQuestions: [],
      shouldTriggerWorkers: false,
      suggestedAnswers
    });
  } catch (error) {
    console.error('Error processing OpenAI response:', error);
    return NextResponse.json({
      content: "Sorry, an error occurred while processing the response.",
      // projectInfo: {},
      completionStatus: "incomplete",
      nextQuestions: [],
      shouldTriggerWorkers: false,
      suggestedAnswers: []
    });
  }
} 