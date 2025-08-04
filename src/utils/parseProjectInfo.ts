// Parser for extracting key data from text (user input)
export function parseProjectInfoFromText(text: string): any {
  const info: any = {};
  const fields = [
    { key: 'projectType', patterns: [/Тип:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i, /-\s*Тип:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i] },
    { key: 'projectName', patterns: [/Назва:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i, /-\s*Назва:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i] },
    { key: 'description', patterns: [/Опис:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i, /-\s*Опис:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i] },
    { key: 'budget', patterns: [/Бюджет:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9$]+)(?=\n|$)/i, /-\s*Бюджет:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9$]+)(?=\n|$)/i] },
    { key: 'timeline', patterns: [/Термін:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i, /-\s*Термін:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i] },
    { key: 'targetAudience', patterns: [/Цільова аудиторія:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i, /-\s*Цільова аудиторія:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9]+)(?=\n|$)/i] },
    { key: 'competitors', patterns: [/Конкурент[и]?:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9,]+)(?=\n|$)/i, /-\s*Конкурент[и]?:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9,]+)(?=\n|$)/i] },
    { key: 'features', patterns: [/Функці[яї]:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9,]+)(?=\n|$)/i, /-\s*Функці[яї]:?\s*([\w\s\-&.,:;()\[\]{}!?@#$%^*+=/\\'"|<>~`А-Яа-яёЁЇїІіЄєҐґA-Za-z0-9,]+)(?=\n|$)/i] },
  ];
  
  for (const field of fields) {
    for (const pattern of field.patterns) {
      const match = text.match(pattern);
      if (match) {
        let value = match[1].trim();
        value = value.replace(/^[-–—•\s]+/, '').replace(/[\s]+$/, '');
        if (field.key === 'competitors' || field.key === 'features') {
          info[field.key] = { value: value.split(',').map(s => s.trim()).filter(Boolean), status: 'draft' };
        } else {
          info[field.key] = { value, status: 'draft' };
        }
        break;
      }
    }
  }
  
  // Heuristic for short answers (1-2 words)
  const trimmed = text.trim();
  if (Object.keys(info).length === 0 && trimmed.length > 0 && trimmed.length < 64) {
    if (/\d+\s*(тиж|міс|днів|день|weeks?|months?|days?)/i.test(trimmed)) {
      info.timeline = { value: trimmed, status: 'draft' };
    } else if (/\$|\d+\s*\-\s*\d+|до \$?\d+/i.test(trimmed)) {
      info.budget = { value: trimmed, status: 'draft' };
    } else if (/^(автомобілісти|студенти|дилери|бізнес|широка аудиторія|бізнес|business|dealers|students|drivers)$/i.test(trimmed)) {
      info.targetAudience = { value: trimmed, status: 'draft' };
    } else if (/^(мобільний додаток|мобільний|додаток|mobile app|app|saas|веб-сайт|сайт|web|website)$/i.test(trimmed)) {
      info.projectType = { value: trimmed, status: 'draft' };
    } else if (/^(olx|auto\.ria|amazon|ebay|booking|інше|немає|none)$/i.test(trimmed)) {
      info.competitors = { value: [trimmed], status: 'draft' };
    } else if (/^(пошук|реєстрація|авторизація|оплата|чат|замовлення|services?|registration|login|payment|order)$/i.test(trimmed)) {
      info.features = { value: [trimmed], status: 'draft' };
    } else {
      info.description = { value: trimmed, status: 'draft' };
    }
  }
  
  return info;
}

// GPT processing for improving highlight quality
export async function enhanceProjectInfoWithGPT(rawInfo: any, originalText: string): Promise<any> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Please enhance and summarize the following project information extracted from user input. Make it more professional and concise while preserving all key details:

Original text: "${originalText}"
Extracted info: ${JSON.stringify(rawInfo)}

Please return a JSON object with enhanced values for each field. Focus on:
1. Making descriptions more professional and clear
2. Summarizing long text into key points
3. Standardizing formats (budget, timeline, etc.)
4. Improving readability while keeping all important information

Return only the JSON object, no additional text.`,
        conversationHistory: [],
        sessionId: null
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      try {
        // Try to parse JSON from GPT response
        const enhancedInfo = JSON.parse(data.content);
        return enhancedInfo;
      } catch {
        // If parsing failed, return original data
        return rawInfo;
      }
    }
  } catch (error) {
    console.error('Error enhancing project info with GPT:', error);
  }
  
  return rawInfo;
} 