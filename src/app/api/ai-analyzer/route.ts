import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_PROMPT = `You are an expert project estimator for Cieden, a UI/UX design company. Analyze the conversation and update the project estimate based on the client's responses.

Your task is to:
1. Analyze all client responses from the conversation
2. Determine project complexity, scope, and requirements
3. Calculate accurate pricing based on real market data
4. Update the estimate with realistic numbers

CONVERSATION ANALYSIS:
Analyze the following conversation and provide an updated estimate:

CONVERSATION:
{conversation}

CURRENT ESTIMATE:
{currentEstimate}

REAL MARKET DATA FOR UI/UX DESIGN:
- Simple Website: $3,000-$8,000 (60-160 hours)
- Medium Website: $8,000-$25,000 (160-500 hours)  
- Complex Web App: $25,000-$60,000 (500-1200 hours)
- Mobile App (Android + iOS): $30,000-$80,000 (600-1600 hours)
- Enterprise Platform: $60,000-$150,000 (1200-3000 hours)

PRICING FACTORS:
- Project Type: Website (1x), Web App (1.5x), Mobile App (2x), Enterprise (3x)
- Complexity: Simple (0.8x), Medium (1x), Complex (1.5x), Enterprise (2x)
- Team Size: 1 designer (0.8x), 2-3 designers (1x), 4+ designers (1.3x)
- Timeline: Standard (1x), Rush (1.5x), Flexible (0.9x)
- Services: Basic UI (0.7x), Full UX+UI (1x), All services (1.3x)

RESPONSE FORMAT:
{
  "analysis": "Brief analysis of the conversation and key factors",
  "projectType": "website|webapp|mobile|enterprise",
  "complexity": "simple|medium|complex|enterprise",
  "estimatedHours": {
    "min": number,
    "max": number
  },
  "estimatedCost": {
    "min": number,
    "max": number
  },
  "confidence": "low|medium|high",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "recommendations": "Brief recommendations for the project"
}`;

export async function POST(req: NextRequest) {
  try {
    const { conversation, currentEstimate } = await req.json();

    // Вибираємо AI для аналізу
    let completion;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        completion = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          system: ANALYSIS_PROMPT,
          messages: [{
            role: "user",
            content: `CONVERSATION:\n${conversation}\n\nCURRENT ESTIMATE:\n${JSON.stringify(currentEstimate)}`
          }]
        });
      } catch (error) {
        console.log('Claude failed, falling back to GPT-3.5:', error);
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: ANALYSIS_PROMPT },
            { role: "user", content: `CONVERSATION:\n${conversation}\n\nCURRENT ESTIMATE:\n${JSON.stringify(currentEstimate)}` }
          ],
          max_tokens: 1000,
          temperature: 0.3
        });
      }
    } else {
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: `CONVERSATION:\n${conversation}\n\nCURRENT ESTIMATE:\n${JSON.stringify(currentEstimate)}` }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });
    }

    // Обробляємо відповідь
    let rawContent = '';
    if (completion.choices) {
      rawContent = completion.choices[0].message.content || '';
    } else if (completion.content) {
      rawContent = Array.isArray(completion.content) 
        ? completion.content.map(block => block.text).join('')
        : completion.content;
    }

    // Парсимо JSON відповідь
    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
      return NextResponse.json({
        error: "Failed to analyze conversation",
        analysis: null
      });
    }

    return NextResponse.json({
      analysis,
      success: true
    });

  } catch (error) {
    console.error('Error in AI analyzer:', error);
    return NextResponse.json({
      error: "Internal server error",
      analysis: null
    });
  }
}
