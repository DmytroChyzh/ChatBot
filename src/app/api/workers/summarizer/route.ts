import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getChatSession, updateWorkerStatus, saveWorkerResults } from '../../../../lib/firestore'
import { ProjectSummary } from '../../../../types/chat'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Оновлюємо статус воркера на "running"
    await updateWorkerStatus(sessionId, 'summarizer', 'running')

    // Отримуємо дані сесії
    const session = await getChatSession(sessionId)
    if (!session) {
      await updateWorkerStatus(sessionId, 'summarizer', 'error')
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Формуємо контекст для AI з повідомлень та даних проєкту
    const projectData = session.projectCard
    const messages = session.messages

    // Створюємо промпт для генерації summary
    const prompt = `
Як експерт з аналізу проєктів, створіть короткий, але інформативний опис проєкту на основі наданої інформації.

Дані проєкту:
${projectData.projectName ? `Назва: ${projectData.projectName}` : ''}
${projectData.projectType ? `Тип: ${projectData.projectType}` : ''}
${projectData.description ? `Опис: ${projectData.description}` : ''}
${projectData.targetAudience ? `Цільова аудиторія: ${projectData.targetAudience}` : ''}
${projectData.features && projectData.features.length > 0 ? `Функції: ${projectData.features.join(', ')}` : ''}
${projectData.budget ? `Бюджет: ${projectData.budget}` : ''}
${projectData.timeline ? `Терміни: ${projectData.timeline}` : ''}
${projectData.competitors && projectData.competitors.length > 0 ? `Конкуренти: ${projectData.competitors.join(', ')}` : ''}
${projectData.website ? `Вебсайт: ${projectData.website}` : ''}

Історія діалогу:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Створіть структурований опис проєкту, який включає:
1. Короткий опис (2-3 речення)
2. Основні цілі проєкту
3. Ключові функції
4. Цільова аудиторія
5. Унікальні переваги

Опис має бути професійним, лаконічним та інформативним для подальшого аналізу.
`

    // Викликаємо OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Ти експерт з аналізу проєктів та створення коротких, інформативних описів. Твоя відповідь має бути структурованою та професійною.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const summaryContent = completion.choices[0]?.message?.content || 'Не вдалося згенерувати опис'

    // Створюємо об'єкт summary
    const summary: ProjectSummary = {
      id: `summary_${Date.now()}`,
      content: summaryContent,
      generatedAt: new Date(),
      model: 'gpt-4',
    }

    // Зберігаємо результат
    await saveWorkerResults(sessionId, 'summarizer', summary)
    
    // Оновлюємо статус на "completed"
    await updateWorkerStatus(sessionId, 'summarizer', 'completed')

    return NextResponse.json({ 
      success: true, 
      summary,
      message: 'Summary generated successfully' 
    })

  } catch (error) {
    console.error('Summarizer worker error:', error)
    
    // Якщо є sessionId, оновлюємо статус на "error"
    try {
      const { sessionId } = await request.json()
      if (sessionId) {
        await updateWorkerStatus(sessionId, 'summarizer', 'error')
      }
    } catch (e) {
      // Ігноруємо помилки при оновленні статусу
    }

    return NextResponse.json(
      { error: 'Failed to generate summary' }, 
      { status: 500 }
    )
  }
} 