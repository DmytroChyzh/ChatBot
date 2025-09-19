import { NextRequest, NextResponse } from 'next/server'
import { getChatSession, updateWorkerStatus, saveWorkerResults } from '../../../../lib/firestore'
import { ProjectEstimates, PhaseEstimate } from '../../../../types/chat'

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

    // НОВА РОЗУМНА СИСТЕМА: Аналізуємо проект з AI
    const projectDescription = projectData.description?.value || '';
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Викликаємо AI аналізатор
    const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-project-analyzer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectDescription,
        conversationHistory
      })
    });

    if (!analysisResponse.ok) {
      throw new Error('Failed to analyze project');
    }

    const { analysis } = await analysisResponse.json();

    // Викликаємо динамічний калькулятор
    const estimateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/dynamic-estimator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });

    if (!estimateResponse.ok) {
      throw new Error('Failed to calculate estimate');
    }

    const { estimate: dynamicEstimate } = await estimateResponse.json();

    // Зберігаємо результат динамічного естімейту
    await saveWorkerResults(sessionId, 'estimator', dynamicEstimate);
    await updateWorkerStatus(sessionId, 'estimator', 'completed');

    return NextResponse.json({
      success: true,
      estimate: dynamicEstimate,
      message: 'Dynamic estimate generated successfully'
    });

  } catch (error) {
    console.error('Error in estimator worker:', error);
    
    // Fallback до простої системи
    try {
      const { sessionId } = await request.json();
      const session = await getChatSession(sessionId);
      
      if (!session) {
        await updateWorkerStatus(sessionId, 'estimator', 'error');
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Простий fallback естімейт
      const fallbackEstimate: ProjectEstimates = {
        id: `fallback-${Date.now()}`,
        totalHours: 200,
        totalCost: 10000,
        currentRange: "8,000 - 12,000",
        phases: [
          {
            phase: 'ux-research',
            estimatedHours: 20,
            estimatedCost: 1000,
            description: 'UX дослідження та аналіз користувачів',
            priority: 'high'
          },
          {
            phase: 'ui-design',
            estimatedHours: 100,
            estimatedCost: 5000,
            description: 'UI дизайн та візуальне оформлення',
            priority: 'high'
          },
          {
            phase: 'prototyping',
            estimatedHours: 30,
            estimatedCost: 1500,
            description: 'Прототипування та інтерактивність',
            priority: 'medium'
          },
          {
            phase: 'design-system',
            estimatedHours: 25,
            estimatedCost: 1250,
            description: 'Дизайн-система та компоненти',
            priority: 'medium'
          },
          {
            phase: 'mobile-adaptive',
            estimatedHours: 25,
            estimatedCost: 1250,
            description: 'Мобільна адаптація та responsive дизайн',
            priority: 'high'
          }
        ],
        timeline: "5-7 тижнів",
        teamSize: 3,
        generatedAt: new Date(),
        model: 'fallback-estimator-v1'
      };

      await saveWorkerResults(sessionId, 'estimator', fallbackEstimate);
      await updateWorkerStatus(sessionId, 'estimator', 'completed');

      return NextResponse.json({
        success: true,
        estimate: fallbackEstimate,
        message: 'Fallback estimate generated successfully'
      });

    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      
      try {
        const { sessionId: fallbackSessionId } = await request.json();
        await updateWorkerStatus(fallbackSessionId, 'estimator', 'error');
      } catch (e) {
        // Ігноруємо помилки при оновленні статусу
      }

      return NextResponse.json(
        { error: 'Failed to generate estimates' }, 
        { status: 500 }
      );
    }
  }
}
