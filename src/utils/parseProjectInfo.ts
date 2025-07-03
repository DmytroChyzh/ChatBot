// Парсер для витягування ключових даних із тексту (user input)
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
  // Евристика для коротких відповідей (1-2 слова)
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