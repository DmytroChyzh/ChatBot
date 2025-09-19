import { NextRequest, NextResponse } from 'next/server';
import { ProjectEstimates, PhaseEstimate } from '../../../types/chat';

// Реальні дані з CSV файлів для динамічного розрахунку
const REAL_PROJECT_DATA = {
  // Living Sunshine (простий веб-сайт)
  'living-sunshine': {
    type: 'simple-website',
    platforms: ['web'],
    features: ['landing', 'contact'],
    hours: 62,
    cost: 3120,
    phases: {
      'ux-research': 8,
      'ui-design': 35,
      'prototyping': 12,
      'design-system': 7,
      'mobile-adaptive': 20
    }
  },
  
  // Shipro (середній веб-сайт)
  'shipro': {
    type: 'medium-website',
    platforms: ['web'],
    features: ['ecommerce', 'integrations', 'blog'],
    hours: 362,
    cost: 18100,
    phases: {
      'ux-research': 20,
      'ui-design': 180,
      'prototyping': 30,
      'design-system': 25,
      'mobile-adaptive': 89
    }
  },
  
  // Refmax (складний веб-додаток)
  'refmax': {
    type: 'complex-webapp',
    platforms: ['web'],
    features: ['dashboard', 'reports', 'user-management'],
    hours: 500,
    cost: 25000,
    phases: {
      'ux-research': 40,
      'ui-design': 200,
      'prototyping': 50,
      'design-system': 32,
      'mobile-adaptive': 125
    }
  },
  
  // Stask (веб + мобільний додаток)
  'stask': {
    type: 'web-mobile-combined',
    platforms: ['web', 'mobile-ios', 'mobile-android'],
    features: ['dashboard', 'user-management', 'tasks', 'reports'],
    hours: 600,
    cost: 30000,
    phases: {
      'ux-research': 60,
      'ui-design': 300,
      'prototyping': 80,
      'design-system': 60,
      'mobile-adaptive': 200
    }
  },
  
  // Property Management (складний e-commerce)
  'property-management': {
    type: 'complex-ecommerce',
    platforms: ['web'],
    features: ['ecommerce', 'user-management', 'payments', 'reports'],
    hours: 800,
    cost: 40000,
    phases: {
      'ux-research': 80,
      'ui-design': 400,
      'prototyping': 100,
      'design-system': 80,
      'mobile-adaptive': 200
    }
  },
  
  // Visible AI (enterprise з AI)
  'visible-ai': {
    type: 'enterprise-ai',
    platforms: ['web'],
    features: ['ai', 'dashboard', 'analytics', 'integrations'],
    hours: 1200,
    cost: 60000,
    phases: {
      'ux-research': 100,
      'ui-design': 600,
      'prototyping': 150,
      'design-system': 100,
      'mobile-adaptive': 200
    }
  }
};

// Функція для знаходження найбільш схожих проектів
function findSimilarProjects(analysis: any) {
  const { platforms, features, complexity, businessType } = analysis;
  
  const similarities = Object.entries(REAL_PROJECT_DATA).map(([key, project]) => {
    let score = 0;
    
    // Порівнюємо платформи
    const platformMatch = platforms.some((p: string) => project.platforms.includes(p));
    if (platformMatch) score += 30;
    
    // Порівнюємо функції
    const featureMatches = features.filter((f: string) => project.features.includes(f)).length;
    score += featureMatches * 10;
    
    // Порівнюємо складність
    if (complexity === 'simple' && project.type.includes('simple')) score += 20;
    if (complexity === 'medium' && project.type.includes('medium')) score += 20;
    if (complexity === 'complex' && project.type.includes('complex')) score += 20;
    if (complexity === 'enterprise' && project.type.includes('enterprise')) score += 20;
    
    return { key, project, score };
  });
  
  // Сортуємо за схожістю
  return similarities.sort((a, b) => b.score - a.score);
}

// Функція для розрахунку динамічного естімейту
function calculateDynamicEstimate(analysis: any) {
  const similarProjects = findSimilarProjects(analysis);
  const { platforms, features, complexity } = analysis;
  
  // Беремо найбільш схожі проекти
  const topMatches = similarProjects.slice(0, 3);
  
  // Розраховуємо базову вартість
  let baseHours = 0;
  let baseCost = 0;
  let basePhases: any = {};
  
  if (topMatches.length > 0) {
    const primaryMatch = topMatches[0];
    baseHours = primaryMatch.project.hours;
    baseCost = primaryMatch.project.cost;
    basePhases = primaryMatch.project.phases;
  }
  
  // Коефіцієнти для різних факторів
  let platformMultiplier = 1.0;
  let featureMultiplier = 1.0;
  let complexityMultiplier = 1.0;
  
  // Множник за платформи
  if (platforms.includes('mobile-ios') && platforms.includes('mobile-android')) {
    platformMultiplier = 1.5; // +50% за обидві мобільні платформи
  } else if (platforms.includes('mobile-ios') || platforms.includes('mobile-android')) {
    platformMultiplier = 1.3; // +30% за одну мобільну платформу
  }
  
  if (platforms.includes('web') && (platforms.includes('mobile-ios') || platforms.includes('mobile-android'))) {
    platformMultiplier = 1.4; // +40% за веб + мобільний
  }
  
  // Множник за функції
  if (features.includes('ecommerce')) featureMultiplier += 0.3; // +30% за e-commerce
  if (features.includes('ai') || features.includes('ai-filtering')) featureMultiplier += 0.2; // +20% за AI
  if (features.includes('user-auth')) featureMultiplier += 0.1; // +10% за авторизацію
  if (features.includes('payments')) featureMultiplier += 0.2; // +20% за платежі
  if (features.includes('dashboard')) featureMultiplier += 0.2; // +20% за дашборд
  if (features.includes('reports')) featureMultiplier += 0.15; // +15% за звіти
  
  // Множник за складність
  if (complexity === 'simple') complexityMultiplier = 0.8;
  if (complexity === 'medium') complexityMultiplier = 1.0;
  if (complexity === 'complex') complexityMultiplier = 1.3;
  if (complexity === 'enterprise') complexityMultiplier = 1.6;
  
  // Загальний множник
  const totalMultiplier = platformMultiplier * featureMultiplier * complexityMultiplier;
  
  // Розраховуємо фінальні значення
  const finalHours = Math.round(baseHours * totalMultiplier);
  const finalCost = Math.round(baseCost * totalMultiplier);
  
  // Розраховуємо фази
  const finalPhases: any = {};
  Object.keys(basePhases).forEach(phase => {
    finalPhases[phase] = Math.round(basePhases[phase] * totalMultiplier);
  });
  
  // Розраховуємо діапазон (±20%)
  const minCost = Math.round(finalCost * 0.8);
  const maxCost = Math.round(finalCost * 1.2);
  const minHours = Math.round(finalHours * 0.8);
  const maxHours = Math.round(finalHours * 1.2);
  
  return {
    baseEstimate: {
      hours: finalHours,
      cost: finalCost,
      phases: finalPhases
    },
    range: {
      minCost,
      maxCost,
      minHours,
      maxHours
    },
    multipliers: {
      platform: platformMultiplier,
      feature: featureMultiplier,
      complexity: complexityMultiplier,
      total: totalMultiplier
    },
    similarProjects: topMatches.map(m => ({
      name: m.key,
      score: m.score,
      hours: m.project.hours,
      cost: m.project.cost
    }))
  };
}

export async function POST(request: NextRequest) {
  try {
    const { analysis } = await request.json();

    if (!analysis) {
      return NextResponse.json({ error: 'Project analysis is required' }, { status: 400 });
    }

    // Розраховуємо динамічний естімейт
    const estimate = calculateDynamicEstimate(analysis);
    
    // Створюємо ProjectEstimates об'єкт
    const projectEstimate: ProjectEstimates = {
      id: `dynamic-${Date.now()}`,
      totalHours: estimate.baseEstimate.hours,
      totalCost: estimate.baseEstimate.cost,
      currentRange: `${estimate.range.minCost} - ${estimate.range.maxCost}`,
      phases: Object.entries(estimate.baseEstimate.phases).map(([phase, hours]) => ({
        phase: phase as any,
        estimatedHours: hours as number,
        estimatedCost: Math.round((hours as number) * 50), // $50/година
        description: getPhaseDescription(phase),
        priority: 'high' as const
      })),
      timeline: `${Math.ceil(estimate.baseEstimate.hours / 40)}-${Math.ceil(estimate.baseEstimate.hours / 30)} тижнів`,
      teamSize: Math.ceil(estimate.baseEstimate.hours / 200),
      generatedAt: new Date(),
      model: 'dynamic-estimator-v1'
    };

    return NextResponse.json({
      success: true,
      estimate: projectEstimate,
      analysis: {
        multipliers: estimate.multipliers,
        similarProjects: estimate.similarProjects,
        reasoning: `Based on ${estimate.similarProjects.length} similar projects from our portfolio`
      }
    });

  } catch (error) {
    console.error('Error in dynamic estimator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Функція для описів фаз
function getPhaseDescription(phase: string): string {
  const descriptions: { [key: string]: string } = {
    'ux-research': 'UX дослідження та аналіз користувачів',
    'ui-design': 'UI дизайн та візуальне оформлення',
    'prototyping': 'Прототипування та інтерактивність',
    'design-system': 'Дизайн-система та компоненти',
    'mobile-adaptive': 'Мобільна адаптація та responsive дизайн'
  };
  return descriptions[phase] || `${phase} phase`;
}
