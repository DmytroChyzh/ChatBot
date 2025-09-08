import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Створюємо WebSocket підключення до OpenAI
    const wsUrl = `wss://api.openai.com/v1/realtime/sessions/${sessionId}?model=gpt-4o-realtime-preview`;
    
    // Повертаємо URL для клієнта
    return NextResponse.json({ 
      wsUrl,
      sessionId 
    });
  } catch (error) {
    console.error('Error creating WebSocket URL:', error);
    return NextResponse.json({ error: 'Failed to create WebSocket URL' }, { status: 500 });
  }
}
