import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { projectDescription, conversationHistory = [] } = await request.json();

    if (!projectDescription) {
      return NextResponse.json({ error: 'Project description is required' }, { status: 400 });
    }

    // Створюємо контекст з історії розмови
    const conversationContext = conversationHistory.length > 0 
      ? conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      : [];

    // AI аналізує опис проекту та визначає компоненти
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert project analyzer for a UI/UX design company. 
          
Your task is to analyze project descriptions and extract detailed components for accurate cost estimation.

ANALYSIS RULES:
1. Extract ALL platforms mentioned (web, mobile-ios, mobile-android, desktop)
2. Identify ALL features (e-commerce, AI, user-auth, payments, etc.)
3. Determine complexity level (simple, medium, complex, enterprise)
4. Identify integrations needed (APIs, databases, third-party services)
5. Consider business type (restaurant, store, services, marketplace, etc.)

RESPONSE FORMAT (JSON only):
{
  "platforms": ["web", "mobile-ios", "mobile-android"],
  "features": ["ecommerce", "user-auth", "payments", "ai-filtering"],
  "complexity": "complex",
  "businessType": "marketplace",
  "integrations": ["payment-gateway", "api", "database"],
  "estimatedHours": {
    "ux-research": 60,
    "ui-design": 300,
    "prototyping": 80,
    "design-system": 60,
    "mobile-adaptive": 200
  },
  "reasoning": "Brief explanation of analysis"
}

EXAMPLES:
- "web and mobile app for selling cars" → platforms: ["web", "mobile-ios", "mobile-android"], features: ["ecommerce", "ai-filtering"], businessType: "marketplace"
- "restaurant website" → platforms: ["web"], features: ["menu", "reservations"], businessType: "restaurant"
- "dashboard for property management" → platforms: ["web"], features: ["dashboard", "user-management", "reports"], complexity: "complex"`
        },
        ...conversationContext,
        {
          role: "user",
          content: `Analyze this project: ${projectDescription}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content || '';
    
    // Парсимо JSON відповідь
    let projectAnalysis;
    try {
      projectAnalysis = JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json({ error: 'Failed to analyze project' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: projectAnalysis
    });

  } catch (error) {
    console.error('Error in AI project analyzer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
