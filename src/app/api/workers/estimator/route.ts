import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getChatSession, updateWorkerStatus, saveWorkerResults } from '../../../../lib/firestore'
import { ProjectEstimates, PhaseEstimate } from '../../../../types/chat'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Функція для отримання описів фаз дизайну
function getPhaseDescription(phase: string): string {
  const descriptions: { [key: string]: string } = {
    'ux-research': 'UX дослідження та аналіз користувачів',
    'ui-design': 'UI дизайн та візуальне оформлення',
    'prototyping': 'Прототипування та інтерактивність',
    'design-system': 'Дизайн-система та компоненти',
    'mobile-adaptive': 'Мобільна адаптація та responsive дизайн'
  };
  return descriptions[phase] || `${phase} phase`;
}

// Реальні шаблони на основі аналізу CSV файлів
const REAL_DESIGN_TEMPLATES = {
  'simple-website': {
    // Living Sunshine: $3,120-$4,560, 62-91 годин
    'ux-research': { hours: 8, cost: 400 },
    'ui-design': { hours: 35, cost: 1750 },
    'prototyping': { hours: 12, cost: 600 },
    'design-system': { hours: 7, cost: 350 },
    'mobile-adaptive': { hours: 20, cost: 1000 },
  },
  'medium-website': {
    // Shipro: ~$18,000, 362 години (при $50/год)
    'ux-research': { hours: 20, cost: 1000 },
    'ui-design': { hours: 180, cost: 9000 },
    'prototyping': { hours: 30, cost: 1500 },
    'design-system': { hours: 25, cost: 1250 },
    'mobile-adaptive': { hours: 89, cost: 4450 },
  },
  'complex-webapp': {
    // Refmax: $15,780-$24,367, 395-609 годин
    'ux-research': { hours: 40, cost: 2000 },
    'ui-design': { hours: 200, cost: 10000 },
    'prototyping': { hours: 50, cost: 2500 },
    'design-system': { hours: 32, cost: 1600 },
    'mobile-adaptive': { hours: 125, cost: 6250 },
  },
  'mobile-app': {
    // Мобільний додаток (Android + iOS): $25,000-$45,000, 500-900 годин
    'ux-research': { hours: 60, cost: 3000 },
    'ui-design': { hours: 300, cost: 15000 },
    'prototyping': { hours: 80, cost: 4000 },
    'design-system': { hours: 60, cost: 3000 },
    'mobile-adaptive': { hours: 200, cost: 10000 },
  },
  'enterprise-platform': {
    // Visible AI: $61,280-$114,240, 1,226-2,285 годин
    'ux-research': { hours: 100, cost: 5000 },
    'ui-design': { hours: 600, cost: 30000 },
    'prototyping': { hours: 150, cost: 7500 },
    'design-system': { hours: 100, cost: 5000 },
    'mobile-adaptive': { hours: 200, cost: 10000 },
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

    // Визначаємо тип проєкту на основі реальних даних
    let projectTypeValue = projectData.projectType?.value;
    let projectType = 'medium-website'; // default
    
    if (typeof projectTypeValue === 'string') {
      projectType = projectTypeValue.toLowerCase();
    } else if (Array.isArray(projectTypeValue) && typeof projectTypeValue[0] === 'string') {
      projectType = projectTypeValue[0].toLowerCase();
    }
    
    // Мапінг на реальні типи з CSV файлів
    if (projectType.includes('landing') || projectType.includes('simple')) {
      projectType = 'simple-website';
    } else if (projectType.includes('dashboard') || projectType.includes('admin') || projectType.includes('management')) {
      projectType = 'complex-webapp';
    } else if (projectType.includes('mobile') || projectType.includes('app') || projectType.includes('android') || projectType.includes('ios')) {
      projectType = 'mobile-app'; // мобільні додатки як окремий тип
    } else if (projectType.includes('web-app') || projectType.includes('webapp') || projectType.includes('application')) {
      projectType = 'complex-webapp'; // веб-додатки як складні проекти
    } else if (projectType.includes('enterprise') || projectType.includes('platform') || projectType.includes('complex')) {
      projectType = 'enterprise-platform';
    } else {
      projectType = 'medium-website'; // default для веб-сайтів
    }

    // Отримуємо базовий шаблон
    const baseTemplate = REAL_DESIGN_TEMPLATES[projectType as keyof typeof REAL_DESIGN_TEMPLATES] || REAL_DESIGN_TEMPLATES['medium-website'];

    // Створюємо промпт для AI для уточнення оцінок UI/UX дизайну
    const prompt = `
Як експерт з оцінки UI/UX дизайн проєктів, проаналізуй надану інформацію та створи детальні оцінки за фазами дизайну.

Дані проєкту:
${projectData.projectName ? `Назва: ${projectData.projectName}` : ''}
${projectData.projectType ? `Тип: ${projectData.projectType}` : ''}
${projectData.description ? `Опис: ${projectData.description}` : ''}
${projectData.features && Array.isArray(projectData.features.value) && projectData.features.value.length > 0 ? `Функції: ${projectData.features.value.join(', ')}` : projectData.features && typeof projectData.features.value === 'string' ? `Функції: ${projectData.features.value}` : ''}
${projectData.budget ? `Бюджет: ${projectData.budget}` : ''}
${projectData.timeline ? `Терміни: ${projectData.timeline}` : ''}

Базові оцінки для типу проєкту "${projectType}" (на основі реальних кейсів):
${Object.entries(baseTemplate).map(([phase, data]) => `${phase}: ${data.hours} годин, $${data.cost}`).join('\n')}

Проаналізуй складність проєкту та відповідь JSON з уточненими оцінками UI/UX дизайну:
{
  "phases": [
    {
      "phase": "ux-research",
      "estimatedHours": число,
      "estimatedCost": число,
      "description": "UX дослідження та аналіз",
      "priority": "high|medium|low"
    },
    {
      "phase": "ui-design",
      "estimatedHours": число,
      "estimatedCost": число,
      "description": "UI дизайн та візуальне оформлення",
      "priority": "high|medium|low"
    },
    {
      "phase": "prototyping",
      "estimatedHours": число,
      "estimatedCost": число,
      "description": "Прототипування та інтерактивність",
      "priority": "high|medium|low"
    },
    {
      "phase": "design-system",
      "estimatedHours": число,
      "estimatedCost": число,
      "description": "Дизайн-система та компоненти",
      "priority": "high|medium|low"
    },
    {
      "phase": "mobile-adaptive",
      "estimatedHours": число,
      "estimatedCost": число,
      "description": "Мобільна адаптація та responsive дизайн",
      "priority": "high|medium|low"
    }
  ],
  "totalHours": число,
  "totalCost": число,
  "currency": "USD",
  "complexity": "low|medium|high",
  "recommendations": "рекомендації для дизайн-процесу"
}

Врахуй:
- Кількість сторінок/екранів для дизайну
- Складність UI компонентів
- Потреби в UX дослідженнях
- Мобільну адаптацію
- Специфічні вимоги до дизайну
- Брендинг та фірмовий стиль
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
          description: getPhaseDescription(phase),
          priority: 'medium' as const,
        })),
        totalHours: Object.values(baseTemplate).reduce((sum, data) => sum + data.hours, 0),
        totalCost: Object.values(baseTemplate).reduce((sum, data) => sum + data.cost, 0),
        currency: 'USD',
        complexity: 'medium',
        recommendations: 'Standard UI/UX design estimation based on real project data'
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

