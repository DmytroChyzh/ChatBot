import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getChatSession, updateWorkerStatus, saveWorkerResults } from '../../../../lib/firestore'
import { ProjectEstimates, PhaseEstimate } from '../../../../types/chat'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Базові шаблони для різних типів проєктів
const PROJECT_TEMPLATES = {
  'landing': {
    discovery: { hours: 8, cost: 400 },
    'ux-ui': { hours: 16, cost: 800 },
    development: { hours: 24, cost: 1200 },
    testing: { hours: 8, cost: 400 },
    deployment: { hours: 4, cost: 200 },
  },
  'dashboard': {
    discovery: { hours: 16, cost: 800 },
    'ux-ui': { hours: 32, cost: 1600 },
    development: { hours: 80, cost: 4000 },
    testing: { hours: 16, cost: 800 },
    deployment: { hours: 8, cost: 400 },
  },
  'web-app': {
    discovery: { hours: 24, cost: 1200 },
    'ux-ui': { hours: 48, cost: 2400 },
    development: { hours: 120, cost: 6000 },
    testing: { hours: 24, cost: 1200 },
    deployment: { hours: 12, cost: 600 },
  },
  'mobile': {
    discovery: { hours: 20, cost: 1000 },
    'ux-ui': { hours: 40, cost: 2000 },
    development: { hours: 100, cost: 5000 },
    testing: { hours: 20, cost: 1000 },
    deployment: { hours: 8, cost: 400 },
  },
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Оновлюємо статус воркера на "running"
    await updateWorkerStatus(sessionId, 'estimator', 'running')

    // Отримуємо дані сесії
    const session = await getChatSession(sessionId)
    if (!session) {
      await updateWorkerStatus(sessionId, 'estimator', 'error')
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const projectData = session.projectCard
    const messages = session.messages

    // Визначаємо тип проєкту
    let projectTypeValue = projectData.projectType?.value;
    let projectType = 'web-app';
    if (typeof projectTypeValue === 'string') {
      projectType = projectTypeValue.toLowerCase();
    } else if (Array.isArray(projectTypeValue) && typeof projectTypeValue[0] === 'string') {
      projectType = projectTypeValue[0].toLowerCase();
    }
    if (projectType.includes('landing')) projectType = 'landing';
    else if (projectType.includes('dashboard')) projectType = 'dashboard';
    else if (projectType.includes('mobile')) projectType = 'mobile';
    else projectType = 'web-app';

    // Отримуємо базовий шаблон
    const baseTemplate = PROJECT_TEMPLATES[projectType as keyof typeof PROJECT_TEMPLATES] || PROJECT_TEMPLATES['web-app'];

    // Створюємо промпт для AI для уточнення оцінок
    const prompt = `
Як експерт з оцінки проєктів, проаналізуй надану інформацію та створи детальні оцінки за фазами розробки.

Дані проєкту:
${projectData.projectName ? `Назва: ${projectData.projectName}` : ''}
${projectData.projectType ? `Тип: ${projectData.projectType}` : ''}
${projectData.description ? `Опис: ${projectData.description}` : ''}
${projectData.features && Array.isArray(projectData.features.value) && projectData.features.value.length > 0 ? `Функції: ${projectData.features.value.join(', ')}` : projectData.features && typeof projectData.features.value === 'string' ? `Функції: ${projectData.features.value}` : ''}
${projectData.budget ? `Бюджет: ${projectData.budget}` : ''}
${projectData.timeline ? `Терміни: ${projectData.timeline}` : ''}

Базові оцінки для типу проєкту "${projectType}":
${Object.entries(baseTemplate).map(([phase, data]) => `${phase}: ${data.hours} годин, $${data.cost}`).join('\n')}

Проаналізуй складність проєкту та відповідь JSON з уточненими оцінками:
{
  "phases": [
    {
      "phase": "discovery",
      "estimatedHours": число,
      "estimatedCost": число,
      "description": "опис фази",
      "priority": "high|medium|low"
    }
  ],
  "totalHours": число,
  "totalCost": число,
  "currency": "USD",
  "complexity": "low|medium|high",
  "recommendations": "рекомендації"
}

Врахуй:
- Складність функцій
- Кількість сторінок/екранів
- Інтеграції з зовнішніми сервісами
- Потреби в тестуванні
- Специфічні вимоги клієнта
`;

    // Викликаємо OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Ти експерт з оцінки проєктів. Відповідай тільки JSON без додаткового тексту.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    
    let estimatesData
    try {
      estimatesData = JSON.parse(responseText)
    } catch (e) {
      // Якщо AI не повернув валідний JSON, використовуємо базовий шаблон
      estimatesData = {
        phases: Object.entries(baseTemplate).map(([phase, data]) => ({
          phase,
          estimatedHours: data.hours,
          estimatedCost: data.cost,
          description: `${phase} phase`,
          priority: 'medium' as const,
        })),
        totalHours: Object.values(baseTemplate).reduce((sum, data) => sum + data.hours, 0),
        totalCost: Object.values(baseTemplate).reduce((sum, data) => sum + data.cost, 0),
        currency: 'USD',
        complexity: 'medium',
        recommendations: 'Standard project estimation based on template'
      }
    }

    // Створюємо об'єкт оцінок
    const estimates: ProjectEstimates = {
      id: `estimates_${Date.now()}`,
      phases: estimatesData.phases.map((phase: any) => ({
        phase: phase.phase,
        estimatedHours: phase.estimatedHours,
        estimatedCost: phase.estimatedCost,
        description: phase.description,
        priority: phase.priority,
      })),
      totalHours: estimatesData.totalHours,
      totalCost: estimatesData.totalCost,
      currency: estimatesData.currency || 'USD',
      generatedAt: new Date(),
      model: 'gpt-4',
    }

    // Зберігаємо результат
    await saveWorkerResults(sessionId, 'estimator', estimates)
    
    // Оновлюємо статус на "completed"
    await updateWorkerStatus(sessionId, 'estimator', 'completed')

    return NextResponse.json({ 
      success: true, 
      estimates,
      message: 'Estimates generated successfully' 
    })

  } catch (error) {
    console.error('Estimator worker error:', error)
    
    try {
      const { sessionId } = await request.json()
      if (sessionId) {
        await updateWorkerStatus(sessionId, 'estimator', 'error')
      }
    } catch (e) {
      // Ігноруємо помилки при оновленні статусу
    }

    return NextResponse.json(
      { error: 'Failed to generate estimates' }, 
      { status: 500 }
    )
  }
} 1

