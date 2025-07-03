import OpenAI from 'openai';
import { ProjectEstimate } from '../types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI project estimation assistant. Your task is to:
1. Determine the project type (landing, dashboard, mobile app, etc.)
2. Ask about the number of unique pages
3. Consider project phases: design system, discovery, communication
4. Calculate project cost using PERT method or $50/hour rate

Format your response as a JSON object with the following structure:
{
  "type": "project_type",
  "pages": number,
  "phases": {
    "designSystem": boolean,
    "discovery": boolean,
    "communication": boolean
  },
  "estimatedHours": number,
  "estimatedCost": number,
  "currency": "USD"
}

Be concise and professional in your responses.`;

export async function analyzeProject(description: string): Promise<ProjectEstimate> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description }
      ],
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response) as ProjectEstimate;
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw error;
  }
}

export async function generateResponse(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ]
    });

    return completion.choices[0].message.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
} 