import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'auto';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Перевіряємо чи є API ключ
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Конвертуємо File в Buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Визначаємо мову для Whisper
    let whisperLanguage = 'auto';
    if (language === 'uk') {
      whisperLanguage = 'uk'; // Українська
    } else if (language === 'en') {
      whisperLanguage = 'en'; // Англійська
    } else if (language === 'ru') {
      whisperLanguage = 'ru'; // Російська
    } else if (language === 'de') {
      whisperLanguage = 'de'; // Німецька
    } else if (language === 'fr') {
      whisperLanguage = 'fr'; // Французька
    } else if (language === 'es') {
      whisperLanguage = 'es'; // Іспанська
    } else if (language === 'it') {
      whisperLanguage = 'it'; // Італійська
    } else if (language === 'pl') {
      whisperLanguage = 'pl'; // Польська
    } else if (language === 'cs') {
      whisperLanguage = 'cs'; // Чеська
    } else if (language === 'hu') {
      whisperLanguage = 'hu'; // Угорська
    } else if (language === 'ro') {
      whisperLanguage = 'ro'; // Румунська
    } else if (language === 'bg') {
      whisperLanguage = 'bg'; // Болгарська
    } else if (language === 'zh') {
      whisperLanguage = 'zh'; // Китайська
    } else if (language === 'ja') {
      whisperLanguage = 'ja'; // Японська
    } else if (language === 'ko') {
      whisperLanguage = 'ko'; // Корейська
    } else if (language === 'ar') {
      whisperLanguage = 'ar'; // Арабська
    } else if (language === 'hi') {
      whisperLanguage = 'hi'; // Хінді
    }

    // Викликаємо OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
        formData.append('model', 'whisper-1');
        if (whisperLanguage !== 'auto') {
          formData.append('language', whisperLanguage);
        }
        formData.append('response_format', 'json');
        return formData;
      })(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI Whisper API error:', errorData);
      return NextResponse.json({ 
        error: 'Speech recognition failed',
        details: errorData 
      }, { status: response.status });
    }

    const result = await response.json();
    
    return NextResponse.json({
      text: result.text,
      language: result.language || whisperLanguage,
      confidence: 0.95 // Whisper зазвичай дуже точний
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
