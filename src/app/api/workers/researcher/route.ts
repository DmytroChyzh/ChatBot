import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getChatSession, updateWorkerStatus, saveWorkerResults } from '../../../../lib/firestore'
import { ResearchHighlights } from '../../../../types/chat'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Функція для отримання контенту з вебсайту
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Простий парсинг HTML для витягування тексту
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Видаляємо скрипти
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Видаляємо стилі
      .replace(/<[^>]+>/g, ' ') // Видаляємо HTML теги
      .replace(/\s+/g, ' ') // Нормалізуємо пробіли
      .trim()
    
    return textContent.substring(0, 3000) // Обмежуємо довжину
  } catch (error) {
    console.error('Error fetching website content:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Оновлюємо статус воркера на "running"
    await updateWorkerStatus(sessionId, 'researcher', 'running')

    // Отримуємо дані сесії
    const session = await getChatSession(sessionId)
    if (!session) {
      await updateWorkerStatus(sessionId, 'researcher', 'error')
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const projectData = session.projectCard
    const messages = session.messages

    // Збираємо джерела для дослідження
    const sources: string[] = []
    
    // Додаємо вебсайт клієнта, якщо є
    if (projectData.website?.value) {
      const websiteValue = projectData.website.value
      if (typeof websiteValue === 'string') {
        sources.push(websiteValue)
      } else if (Array.isArray(websiteValue)) {
        sources.push(...websiteValue.filter(url => typeof url === 'string'))
      }
    }
    
    // Додаємо конкурентів, якщо є
    if (projectData.competitors?.value && Array.isArray(projectData.competitors.value)) {
      sources.push(...projectData.competitors.value.filter(comp => comp.startsWith('http')))
    }

    if (sources.length === 0) {
      // Якщо немає джерел, створюємо базовий research на основі діалогу
      const researchHighlight: ResearchHighlights = {
        id: `research_${Date.now()}`,
        source: 'chat_dialogue',
        highlights: [
          'Аналіз проведено на основі діалогу з клієнтом',
          'Рекомендується додати посилання на вебсайт для детальнішого аналізу'
        ],
        insights: 'Для більш детального аналізу необхідно надати посилання на існуючий вебсайт або конкурентів.',
        generatedAt: new Date(),
        model: 'gpt-4',
      }

      await saveWorkerResults(sessionId, 'researcher', [researchHighlight])
      await updateWorkerStatus(sessionId, 'researcher', 'completed')

      return NextResponse.json({ 
        success: true, 
        research: [researchHighlight],
        message: 'Basic research completed (no external sources provided)' 
      })
    }

    const researchResults: ResearchHighlights[] = []

    // Аналізуємо кожне джерело
    for (const source of sources) {
      try {
        // Отримуємо контент з вебсайту
        const websiteContent = await fetchWebsiteContent(source)
        
        if (!websiteContent) {
          continue
        }

        // Створюємо промпт для аналізу контенту
        const prompt = `
Як експерт з аналізу бізнесу та вебсайтів, проаналізуй наданий контент та витягни ключові insights.

Контент з ${source}:
${websiteContent.substring(0, 2000)}

Проаналізуй та відповідь JSON:
{
  "highlights": [
    "ключова особливість 1",
    "ключова особливість 2",
    "ключова особливість 3"
  ],
  "insights": "загальний аналіз та рекомендації",
  "business_model": "модель бізнесу",
  "target_audience": "цільова аудиторія",
  "unique_value": "унікальна цінність"
}

Фокусуйся на:
- Бізнес-моделі
- Цільовій аудиторії
- Унікальних перевагах
- Технологічних рішеннях
- UX/UI підходах
`

        // Викликаємо OpenAI для аналізу
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Ти експерт з аналізу бізнесу та вебсайтів. Відповідай тільки JSON без додаткового тексту.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
        })

        const responseText = completion.choices[0]?.message?.content || '{}'
        
        let analysisData
        try {
          analysisData = JSON.parse(responseText)
        } catch (e) {
          analysisData = {
            highlights: ['Аналіз не вдався'],
            insights: 'Не вдалося проаналізувати контент',
            business_model: 'Невідомо',
            target_audience: 'Невідомо',
            unique_value: 'Невідомо'
          }
        }

        // Створюємо об'єкт research
        const research: ResearchHighlights = {
          id: `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source,
          highlights: analysisData.highlights || ['Аналіз не вдався'],
          insights: analysisData.insights || 'Не вдалося проаналізувати контент',
          generatedAt: new Date(),
          model: 'gpt-4',
        }

        researchResults.push(research)

      } catch (error) {
        console.error(`Error analyzing source ${source}:`, error)
        
        // Додаємо помилковий результат
        const errorResearch: ResearchHighlights = {
          id: `research_error_${Date.now()}`,
          source,
          highlights: ['Помилка при аналізі джерела'],
          insights: 'Не вдалося отримати або проаналізувати контент з цього джерела.',
          generatedAt: new Date(),
          model: 'gpt-4',
        }
        
        researchResults.push(errorResearch)
      }
    }

    // Зберігаємо результати
    await saveWorkerResults(sessionId, 'researcher', researchResults)
    
    // Оновлюємо статус на "completed"
    await updateWorkerStatus(sessionId, 'researcher', 'completed')

    return NextResponse.json({ 
      success: true, 
      research: researchResults,
      message: `Research completed for ${researchResults.length} sources` 
    })

  } catch (error) {
    console.error('Researcher worker error:', error)
    
    try {
      const { sessionId } = await request.json()
      if (sessionId) {
        await updateWorkerStatus(sessionId, 'researcher', 'error')
      }
    } catch (e) {
      // Ігноруємо помилки при оновленні статусу
    }

    return NextResponse.json(
      { error: 'Failed to complete research' }, 
      { status: 500 }
    )
  }
} 