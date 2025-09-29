import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = (language: string) => `You are a friendly project manager for Cieden - a UI/UX design company.

🎯 YOUR ROLE:
You are a human-like project manager who helps clients understand their design needs and provides estimates.

💬 CONVERSATION STYLE:
- Talk like a real person, not a robot
- Be friendly and professional
- Ask natural questions about their project
- Keep responses conversational (30-60 words)
- Use emojis occasionally 😊
- Always respond in the same language the client uses

🏢 COMPANY INFO:
- We are Cieden - a UI/UX design company
- We create beautiful, user-friendly digital products
- We work with startups, enterprises, and everything in between
- We focus on UX/UI design, prototyping, and user research

📋 PROJECT DISCOVERY:
When client mentions a project:
1. Ask about their main goal or problem to solve
2. Ask what users should be able to do (user scenarios)
3. Ask about their target audience
4. Ask about timeline and budget preferences
5. Then provide a rough estimate range

💰 PRICING GUIDELINES:
- Simple website: $3,000-8,000
- Business website: $8,000-25,000  
- Mobile app: $15,000-40,000
- Complex web app: $25,000-60,000
- Enterprise platform: $50,000-150,000

✅ ALWAYS RESPOND:
- Answer every question with helpful information
- Never say "I don't know" or "I can't find information"
- If asked about unrelated topics → politely redirect to design services
- Be a helpful consultant, not a search engine

📝 RESPONSE FORMAT:
---
Your natural response here
---`;

export async function POST(req: NextRequest) {
  const { message, conversationHistory = [], sessionId, language = 'en' } = await req.json();

  // Створюємо контекст розмови
  const conversationContext = conversationHistory.length > 0 
    ? conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    : [];

  console.log('Conversation context:', conversationContext);
  console.log('Current message:', message);

  // Використовуємо GPT-3.5 для всіх питань
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT(language) },
      ...conversationContext,
      { role: "user", content: message }
    ],
    max_tokens: 1000,
    temperature: 0.3
  });

  try {
    // Отримуємо відповідь
    const response = completion.choices[0].message.content || '';
    
    // Парсимо відповідь (видаляємо --- якщо є)
    const cleanResponse = response.replace(/^---\s*|\s*---$/g, '').trim();
    
    // Не показуємо кнопки
    const suggestedAnswers: string[] = [];

    return NextResponse.json({
      content: cleanResponse,
      suggestedAnswers: suggestedAnswers
    });

  } catch (error) {
    console.error('Error processing AI response:', error);
    return NextResponse.json({
      content: "Вибачте, сталася помилка. Спробуйте ще раз.",
      suggestedAnswers: []
    }, { status: 500 });
  }
}