import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'uk';

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert File to FormData for OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', language === 'uk' ? 'uk' : 'en');
    openaiFormData.append('response_format', 'json');

    // Use OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI Whisper API error:', errorData);
      return NextResponse.json({ error: 'Speech-to-text API error' }, { status: 500 });
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.text || '',
      language: result.language || language
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
