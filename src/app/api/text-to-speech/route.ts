import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'uk' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: language === 'uk' ? 'nova' : 'alloy', // Use appropriate voice for language
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI TTS API error:', errorData);
      return NextResponse.json({ error: 'TTS API error' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
