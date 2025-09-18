import { NextRequest, NextResponse } from 'next/server';
import typeformQuestions from '../../../data/typeform-questions.json';

export async function POST(req: NextRequest) {
  try {
    const { responses } = await req.json();
    
    // Аналізуємо відповіді клієнта
    const analysis = analyzeResponses(responses);
    
    // Розраховуємо ціну на основі аналізу
    const estimate = calculatePrice(analysis);
    
    return NextResponse.json({
      success: true,
      estimate,
      analysis
    });
    
  } catch (error) {
    console.error('Error in price calculator:', error);
    return NextResponse.json({
      error: "Failed to calculate price",
      success: false
    });
  }
}

function analyzeResponses(responses: any[]) {
  const analysis = {
    projectType: 'website',
    platforms: [],
    complexity: 'medium',
    teamSize: 'multiple_designers',
    timeline: 'standard',
    services: []
  };
  
  // Аналізуємо відповіді
  responses.forEach(response => {
    const answer = response.answer.toLowerCase();
    
    // Тип проекту
    if (answer.includes('мобільний') || answer.includes('mobile')) {
      analysis.projectType = 'mobile_app';
    } else if (answer.includes('e-commerce') || answer.includes('магазин')) {
      analysis.projectType = 'webapp';
    } else if (answer.includes('dashboard') || answer.includes('панель')) {
      analysis.projectType = 'webapp';
    }
    
    // Платформи
    if (answer.includes('android') && answer.includes('ios')) {
      analysis.platforms = ['android', 'ios'];
    } else if (answer.includes('android')) {
      analysis.platforms = ['android'];
    } else if (answer.includes('ios')) {
      analysis.platforms = ['ios'];
    }
    
    // Складність
    if (answer.includes('essential') || answer.includes('простий')) {
      analysis.complexity = 'essential';
    } else if (answer.includes('advanced') || answer.includes('складний')) {
      analysis.complexity = 'advanced';
    } else if (answer.includes('enterprise')) {
      analysis.complexity = 'enterprise';
    }
    
    // Розмір команди
    if (answer.includes('один дизайнер')) {
      analysis.teamSize = 'one_designer';
    } else if (answer.includes('кілька дизайнерів')) {
      analysis.teamSize = 'multiple_designers';
    } else if (answer.includes('команда')) {
      analysis.teamSize = 'cross_functional';
    }
    
    // Терміни
    if (answer.includes('негайно') || answer.includes('тиждень')) {
      analysis.timeline = 'rush';
    } else if (answer.includes('місяць') || answer.includes('гнучкий')) {
      analysis.timeline = 'flexible';
    }
  });
  
  return analysis;
}

function calculatePrice(analysis: any) {
  const { base_prices, multipliers } = typeformQuestions.pricing;
  
  // Базова ціна залежно від типу проекту
  let basePrice = base_prices.website;
  if (analysis.projectType === 'mobile_app') {
    basePrice = base_prices.mobile_app;
  } else if (analysis.projectType === 'webapp') {
    basePrice = base_prices.webapp;
  } else if (analysis.complexity === 'enterprise') {
    basePrice = base_prices.enterprise;
  }
  
  // Застосовуємо множники
  let finalMultiplier = 1;
  
  // Множник за платформи
  if (analysis.platforms.length === 1) {
    finalMultiplier *= multipliers.platforms.android_only;
  } else if (analysis.platforms.length === 2) {
    finalMultiplier *= multipliers.platforms.android_ios;
  } else if (analysis.platforms.length > 2) {
    finalMultiplier *= multipliers.platforms.android_ios_web;
  }
  
  // Множник за складність
  finalMultiplier *= multipliers.complexity[analysis.complexity];
  
  // Множник за розмір команди
  finalMultiplier *= multipliers.team_size[analysis.teamSize];
  
  // Множник за терміни
  finalMultiplier *= multipliers.timeline[analysis.timeline];
  
  // Розраховуємо фінальну ціну
  const minPrice = Math.round(basePrice.min * finalMultiplier);
  const maxPrice = Math.round(basePrice.max * finalMultiplier);
  const minHours = Math.round(basePrice.hours.min * finalMultiplier);
  const maxHours = Math.round(basePrice.hours.max * finalMultiplier);
  
  return {
    minPrice,
    maxPrice,
    minHours,
    maxHours,
    multiplier: finalMultiplier,
    analysis
  };
}
