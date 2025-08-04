// Smart parser using GPT for better field recognition
export async function parseProjectInfoFromText(text: string): Promise<any> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Analyze the following user input and extract project information. Return ONLY a JSON object with the following structure:

{
  "projectName": { "value": "extracted name", "status": "draft" },
  "projectType": { "value": "extracted type", "status": "draft" },
  "description": { "value": "extracted description", "status": "draft" },
  "targetAudience": { "value": "extracted audience", "status": "draft" },
  "features": { "value": ["feature1", "feature2"], "status": "draft" },
  "budget": { "value": "extracted budget", "status": "draft" },
  "timeline": { "value": "extracted timeline", "status": "draft" },
  "competitors": { "value": ["competitor1", "competitor2"], "status": "draft" },
  "website": { "value": "extracted website", "status": "draft" }
}

Rules:
1. Only include fields that are clearly mentioned in the text
2. For arrays (features, competitors), split by commas or list items
3. If a field is not mentioned, don't include it in the response
4. Be smart about context - if someone says "budget is $5000", extract it as budget
5. If someone says "we need login and payment", extract as features array
6. Support both Ukrainian and English text

User input: "${text}"

Return ONLY the JSON object, no additional text or explanations.`,
        conversationHistory: [],
        sessionId: null
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      try {
        const parsedInfo = JSON.parse(data.content);
        
        // Validate and clean the parsed data
        const cleanedInfo: any = {};
        const validFields = ['projectName', 'projectType', 'description', 'targetAudience', 'features', 'budget', 'timeline', 'competitors', 'website'];
        
        for (const field of validFields) {
          if (parsedInfo[field] && parsedInfo[field].value) {
            // Ensure arrays are properly formatted
            if (field === 'features' || field === 'competitors') {
              if (Array.isArray(parsedInfo[field].value)) {
                cleanedInfo[field] = {
                  value: parsedInfo[field].value.filter((item: string) => item && item.trim()),
                  status: 'draft'
                };
              } else if (typeof parsedInfo[field].value === 'string') {
                cleanedInfo[field] = {
                  value: parsedInfo[field].value.split(',').map((s: string) => s.trim()).filter(Boolean),
                  status: 'draft'
                };
              }
            } else {
              cleanedInfo[field] = {
                value: parsedInfo[field].value.toString().trim(),
                status: 'draft'
              };
            }
          }
        }
        
        return cleanedInfo;
      } catch (parseError) {
        console.error('Error parsing GPT response:', parseError);
        return fallbackParse(text);
      }
    }
  } catch (error) {
    console.error('Error in smart parsing:', error);
  }
  
  // Fallback to simple parsing if GPT fails
  return fallbackParse(text);
}

// Fallback parser for when GPT is not available
function fallbackParse(text: string): any {
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
  
  return info;
}

// GPT processing for improving highlight quality
export async function enhanceProjectInfoWithGPT(rawInfo: any, originalText: string): Promise<any> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Enhance the following project information to make it more professional and structured. Return ONLY a JSON object with the same structure:

Original text: "${originalText}"
Current extracted info: ${JSON.stringify(rawInfo)}

Enhancement rules:
1. Make descriptions more professional and clear
2. Standardize budget format (e.g., "$5,000 - $10,000" or "€5000")
3. Standardize timeline format (e.g., "3-4 months" or "6-8 weeks")
4. For arrays (features, competitors), ensure proper formatting
5. Keep all important information but make it more concise
6. If a field is empty or unclear, don't include it

Return ONLY the JSON object with enhanced values, no additional text.`,
        conversationHistory: [],
        sessionId: null
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      try {
        // Try to parse JSON from GPT response
        const enhancedInfo = JSON.parse(data.content);
        
        // Validate the enhanced data
        const validatedInfo: any = {};
        for (const key in enhancedInfo) {
          if (rawInfo[key]) { // Only enhance fields that were originally found
            if (key === 'features' || key === 'competitors') {
              if (Array.isArray(enhancedInfo[key].value)) {
                validatedInfo[key] = {
                  value: enhancedInfo[key].value.filter((item: string) => item && item.trim()),
                  status: 'draft'
                };
              } else {
                validatedInfo[key] = rawInfo[key]; // Keep original if enhancement failed
              }
            } else {
              validatedInfo[key] = {
                value: enhancedInfo[key].value?.toString().trim() || rawInfo[key].value,
                status: 'draft'
              };
            }
          }
        }
        
        return validatedInfo;
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