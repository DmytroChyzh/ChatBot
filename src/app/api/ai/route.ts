import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getChatSession, updateProjectCard } from '../../../lib/firestore';
import { ProjectCardState } from '../../../types/chat';
import { parseProjectInfoFromText } from '../../../utils/parseProjectInfo';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Ти — гнучкий AI-консультант компанії Cieden. Ти знаєш все про Cieden: наші кейси, команду, процеси, UX/UI, дизайн, розробку, сайт, підходи, цінності, експертизу.

Ти спілкуєшся з клієнтом як людина: відповідаєш на будь-які питання про Cieden, даєш корисні поради, ділишся досвідом, розповідаєш про кейси, команду, сайт, процеси, експертизу, підходи, цінності, технології, все що може бути корисно.

Якщо клієнт хоче створити новий проект або редизайн — ти збираєш всю потрібну інформацію по ОДНОМУ питанню за раз. Кожне наступне питання адаптуєш до відповідей клієнта, не дублюєш, не повторюєш, не використовуєш шаблонних списків. Питання завжди гнучкі, персоналізовані, як у справжнього експерта.

Після кожного питання ти даєш 4-5 релевантних кнопок-відповідей (SuggestedAnswers), але клієнт завжди може написати свою відповідь. Кнопки мають бути короткі, унікальні, без дублікатів, максимально корисні для клієнта.

❗️Після КОЖНОГО питання про проект, редизайн, функціонал, цілі, бюджет, терміни, аудиторію, конкуренти, UX/UI, ти ЗАВЖДИ додаєш блок SuggestedAnswers з 4-5 варіантами. Якщо не можеш придумати — додай ['Інше', 'Пояснити детальніше', 'Не знаю', 'Пропустити']. Якщо порушиш це — відповідь не буде прийнята!

Всі відповіді мають бути максимально корисні для майбутнього естімейту та менеджера: збирай деталі, які допоможуть зрозуміти реальні цілі, очікування, проблеми, бажання клієнта.

❗️Ніколи не вставляй SuggestedAnswers у текст для клієнта. Всі підказки мають бути ТІЛЬКИ у спеціальному блоці SuggestedAnswers після JSON, і НІКОЛИ у тексті для клієнта. Якщо порушиш це правило — твоя відповідь не буде прийнята!

Жодних службових рядків, JSON чи підказок у тексті для клієнта.

Формат:
---
Текст для клієнта

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
      content: "Вибачте, сталася помилка при обробці відповіді.",
      // projectInfo: {},
      completionStatus: "incomplete",
      nextQuestions: [],
      shouldTriggerWorkers: false,
      suggestedAnswers: []
    });
  }
} 