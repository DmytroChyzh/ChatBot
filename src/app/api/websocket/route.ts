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
    // Спробуємо отримати WebSocket URL через OpenAI API
    const response = await fetch(`https://api.openai.com/v1/realtime/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const sessionData = await response.json();
    console.log('Session data:', sessionData);
    
    // Створюємо WebSocket URL
    const wsUrl = `wss://api.openai.com/v1/realtime/sessions/${sessionId}?model=gpt-4o-realtime-preview`;
    
    console.log('Creating WebSocket URL for session:', sessionId);
    console.log('API Key present:', !!apiKey);
    
    // Повертаємо URL та API ключ для клієнта
    return NextResponse.json({ 
      wsUrl,
      apiKey,
      sessionId,
      sessionData
    });
  } catch (error) {
    console.error('Error creating WebSocket URL:', error);
    return NextResponse.json({ error: 'Failed to create WebSocket URL' }, { status: 500 });
  }
}
