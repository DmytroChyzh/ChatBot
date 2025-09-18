import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getChatSession, updateWorkerStatus, saveWorkerResults } from '../../../../lib/firestore'
import { ProjectEstimates, PhaseEstimate } from '../../../../types/chat'
import { getDesignersForProject, getContactPersonForProject, getContactEmailForProject } from '../../../../utils/teamUtils'

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

    // Аналізуємо додаткові фактори для корекції ціни
    const projectDescription = projectData.description || '';
    const features = projectData.features?.value || [];
    const featuresText = Array.isArray(features) ? features.join(' ') : String(features);
    const allText = `${projectDescription} ${featuresText}`.toLowerCase();

    // Коефіцієнти для корекції ціни
    let priceMultiplier = 1.0;
    let complexityMultiplier = 1.0;

    // Тип проекту (новий/редизайн/додавання функцій)
    if (allText.includes('редизайн') || allText.includes('redesign') || allText.includes('переробка')) {
      priceMultiplier *= 0.6; // -40% для редизайну
    } else if (allText.includes('додавання') || allText.includes('додати') || allText.includes('add') || allText.includes('нові функції')) {
      priceMultiplier *= 0.4; // -60% для додавання функцій
    }

    // Платформи
    if (allText.includes('тільки android') || allText.includes('only android')) {
      priceMultiplier *= 0.7; // -30% для тільки Android
    } else if (allText.includes('тільки ios') || allText.includes('only ios')) {
      priceMultiplier *= 0.7; // -30% для тільки iOS
    } else if (allText.includes('web версія') || allText.includes('web version')) {
      priceMultiplier *= 1.4; // +40% для web версії
    }

    // Складність дизайну
    if (allText.includes('простий дизайн') || allText.includes('simple design')) {
      complexityMultiplier *= 0.8; // -20% для простого дизайну
    } else if (allText.includes('складний дизайн') || allText.includes('complex design') || allText.includes('кастомний')) {
      complexityMultiplier *= 1.3; // +30% для складного дизайну
    }

    // Анімації та мікровзаємодії
    if (allText.includes('анімації') || allText.includes('animations') || allText.includes('мікровзаємодії')) {
      complexityMultiplier *= 1.25; // +25% для анімацій
    }

    // Функціональність
    if (allText.includes('e-commerce') || allText.includes('магазин') || allText.includes('shop')) {
      priceMultiplier *= 1.5; // +50% для e-commerce
    } else if (allText.includes('соціальні') || allText.includes('social') || allText.includes('чат')) {
      priceMultiplier *= 1.3; // +30% для соціальних функцій
    } else if (allText.includes('api') || allText.includes('інтеграція') || allText.includes('integration')) {
      priceMultiplier *= 1.2; // +20% для інтеграцій
    } else if (allText.includes('push') || allText.includes('нотифікації') || allText.includes('notifications')) {
      priceMultiplier *= 1.1; // +10% для push-нотифікацій
    }

    // Застосовуємо коефіцієнти
    const finalMultiplier = priceMultiplier * complexityMultiplier;

    // Отримуємо базовий шаблон
    const baseTemplate = REAL_DESIGN_TEMPLATES[projectType as keyof typeof REAL_DESIGN_TEMPLATES] || REAL_DESIGN_TEMPLATES['medium-website'];
    
    // Логування для дебагу
    console.log('Project analysis:', {
      originalType: projectTypeValue,
      mappedType: projectType,
      priceMultiplier: priceMultiplier,
      complexityMultiplier: complexityMultiplier,
      finalMultiplier: finalMultiplier,
      allText: allText.substring(0, 200) + '...'
    });

    // Створюємо промпт для AI для уточнення оцінок UI/UX дизайну
    const prompt = `
Як експерт з оцінки UI/UX дизайн проєктів, проаналізуй надану інформацію та створи детальні оцінки за фазами дизайну.

ВАЖЛИВО: Тип проекту вже визначено як "${projectType}". НЕ ЗМІНЮЙ його!

Дані проєкту:
${projectData.projectName ? `Назва: ${projectData.projectName}` : ''}
${projectData.projectType ? `Тип: ${projectData.projectType}` : ''}
${projectData.description ? `Опис: ${projectData.description}` : ''}
${projectData.features && Array.isArray(projectData.features.value) && projectData.features.value.length > 0 ? `Функції: ${projectData.features.value.join(', ')}` : projectData.features && typeof projectData.features.value === 'string' ? `Функції: ${projectData.features.value}` : ''}
${projectData.budget ? `Бюджет: ${projectData.budget}` : ''}
${projectData.timeline ? `Терміни: ${projectData.timeline}` : ''}

Базові оцінки для типу проєкту "${projectType}" (на основі реальних кейсів):
${Object.entries(baseTemplate).map(([phase, data]) => `${phase}: ${data.hours} годин, $${data.cost}`).join('\n')}

ВАЖЛИВО: Врахуй наступні коефіцієнти для корекції ціни:
- Коефіцієнт ціни: ${priceMultiplier.toFixed(2)}x
- Коефіцієнт складності: ${complexityMultiplier.toFixed(2)}x  
- Загальний коефіцієнт: ${finalMultiplier.toFixed(2)}x

Фактори, які вплинули на ціну:
${allText.includes('редизайн') || allText.includes('redesign') ? '- Редизайн існуючого проекту (-40%)' : ''}
${allText.includes('додавання') || allText.includes('add') ? '- Додавання нових функцій (-60%)' : ''}
${allText.includes('тільки android') || allText.includes('only android') ? '- Тільки Android платформа (-30%)' : ''}
${allText.includes('тільки ios') || allText.includes('only ios') ? '- Тільки iOS платформа (-30%)' : ''}
${allText.includes('web версія') || allText.includes('web version') ? '- Web версія додатку (+40%)' : ''}
${allText.includes('простий дизайн') || allText.includes('simple design') ? '- Простий дизайн (-20%)' : ''}
${allText.includes('складний дизайн') || allText.includes('complex design') ? '- Складний дизайн (+30%)' : ''}
${allText.includes('анімації') || allText.includes('animations') ? '- Анімації та мікровзаємодії (+25%)' : ''}
${allText.includes('e-commerce') || allText.includes('магазин') ? '- E-commerce функціональність (+50%)' : ''}
${allText.includes('соціальні') || allText.includes('social') ? '- Соціальні функції (+30%)' : ''}
${allText.includes('api') || allText.includes('інтеграція') ? '- API інтеграції (+20%)' : ''}
${allText.includes('push') || allText.includes('нотифікації') ? '- Push-нотифікації (+10%)' : ''}

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
        // Fallback: використовуємо базовий шаблон без AI
        const session = await getChatSession(sessionId)
        if (session?.projectCard) {
          const projectData = session.projectCard
          let projectTypeValue = projectData.projectType?.value;
          let projectType = 'medium-website';
          
          if (typeof projectTypeValue === 'string') {
            projectType = projectTypeValue.toLowerCase();
          } else if (Array.isArray(projectTypeValue) && typeof projectTypeValue[0] === 'string') {
            projectType = projectTypeValue[0].toLowerCase();
          }
          
          // Мапінг на реальні типи
          if (projectType.includes('landing') || projectType.includes('simple')) {
            projectType = 'simple-website';
          } else if (projectType.includes('dashboard') || projectType.includes('admin') || projectType.includes('management')) {
            projectType = 'complex-webapp';
          } else if (projectType.includes('mobile') || projectType.includes('app') || projectType.includes('android') || projectType.includes('ios')) {
            projectType = 'mobile-app';
          } else if (projectType.includes('web-app') || projectType.includes('webapp') || projectType.includes('application')) {
            projectType = 'complex-webapp';
          } else if (projectType.includes('enterprise') || projectType.includes('platform') || projectType.includes('complex')) {
            projectType = 'enterprise-platform';
          } else {
            projectType = 'medium-website';
          }
          
          const baseTemplate = REAL_DESIGN_TEMPLATES[projectType as keyof typeof REAL_DESIGN_TEMPLATES] || REAL_DESIGN_TEMPLATES['medium-website'];
          
          // Аналізуємо додаткові фактори для fallback
          const projectDescription = projectData.description || '';
          const features = projectData.features?.value || [];
          const featuresText = Array.isArray(features) ? features.join(' ') : String(features);
          const allText = `${projectDescription} ${featuresText}`.toLowerCase();

          // Коефіцієнти для корекції ціни (fallback)
          let priceMultiplier = 1.0;
          let complexityMultiplier = 1.0;

          if (allText.includes('редизайн') || allText.includes('redesign')) {
            priceMultiplier *= 0.6;
          } else if (allText.includes('додавання') || allText.includes('add')) {
            priceMultiplier *= 0.4;
          }

          if (allText.includes('тільки android') || allText.includes('only android')) {
            priceMultiplier *= 0.7;
          } else if (allText.includes('тільки ios') || allText.includes('only ios')) {
            priceMultiplier *= 0.7;
          } else if (allText.includes('web версія') || allText.includes('web version')) {
            priceMultiplier *= 1.4;
          }

          if (allText.includes('простий дизайн') || allText.includes('simple design')) {
            complexityMultiplier *= 0.8;
          } else if (allText.includes('складний дизайн') || allText.includes('complex design')) {
            complexityMultiplier *= 1.3;
          }

          if (allText.includes('анімації') || allText.includes('animations')) {
            complexityMultiplier *= 1.25;
          }

          if (allText.includes('e-commerce') || allText.includes('магазин')) {
            priceMultiplier *= 1.5;
          } else if (allText.includes('соціальні') || allText.includes('social')) {
            priceMultiplier *= 1.3;
          } else if (allText.includes('api') || allText.includes('інтеграція')) {
            priceMultiplier *= 1.2;
          } else if (allText.includes('push') || allText.includes('нотифікації')) {
            priceMultiplier *= 1.1;
          }

          const finalMultiplier = priceMultiplier * complexityMultiplier;

          // Створюємо fallback оцінку з коефіцієнтами
          const baseHours = Object.values(baseTemplate).reduce((sum, phase) => sum + phase.hours, 0);
          const baseCost = Object.values(baseTemplate).reduce((sum, phase) => sum + phase.cost, 0);
          
          const totalHours = Math.round(baseHours * finalMultiplier);
          const totalCost = Math.round(baseCost * finalMultiplier);
          
          const fallbackEstimate: ProjectEstimates = {
            id: `fallback-${Date.now()}`,
            totalHours: totalHours,
            totalCost: totalCost,
            currency: 'USD',
            generatedAt: new Date(),
            model: 'fallback-template',
            phases: [
              {
                phase: 'discovery',
                estimatedHours: baseTemplate['ux-research'].hours,
                estimatedCost: baseTemplate['ux-research'].cost,
                description: 'User research, needs analysis and user personas creation',
                priority: 'high' as const
              },
              {
                phase: 'ux-ui',
                estimatedHours: baseTemplate['ui-design'].hours,
                estimatedCost: baseTemplate['ui-design'].cost,
                description: 'Visual design creation, layouts and interfaces',
                priority: 'high' as const
              },
              {
                phase: 'development',
                estimatedHours: baseTemplate['prototyping'].hours,
                estimatedCost: baseTemplate['prototyping'].cost,
                description: 'Interactive prototyping and user experience testing',
                priority: 'medium' as const
              },
              {
                phase: 'testing',
                estimatedHours: baseTemplate['design-system'].hours,
                estimatedCost: baseTemplate['design-system'].cost,
                description: 'Design system and components development for scaling',
                priority: 'medium' as const
              },
              {
                phase: 'deployment',
                estimatedHours: baseTemplate['mobile-adaptive'].hours,
                estimatedCost: baseTemplate['mobile-adaptive'].cost,
                description: 'Mobile device adaptation and responsive design versions',
                priority: 'high' as const
              }
            ]
          };
          
          await saveWorkerResults(sessionId, 'estimator', fallbackEstimate);
          await updateWorkerStatus(sessionId, 'estimator', 'completed');
          
          return NextResponse.json({ 
            success: true, 
            estimates: [fallbackEstimate],
            message: 'Fallback estimate generated successfully' 
          });
        }
        
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

