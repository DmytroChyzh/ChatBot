import realEstimations from '../data/real-estimations.json';

export interface RealEstimation {
  projectType: string;
  complexity: string;
  minHours: number;
  maxHours: number;
  minPrice: number;
  maxPrice: number;
  timeline: string;
  teamSize: number;
  features: string[];
  description: string;
}

/**
 * Get real estimation data for specific project type and complexity
 */
export function getRealEstimation(projectType: string, complexity: string): RealEstimation | null {
  return realEstimations.estimations.find(est => 
    est.projectType.toLowerCase() === projectType.toLowerCase() &&
    est.complexity.toLowerCase() === complexity.toLowerCase()
  ) || null;
}

/**
 * Get estimation by project type (fallback to medium complexity if not found)
 */
export function getEstimationByType(projectType: string): RealEstimation | null {
  // Try to find exact match first
  const exactMatch = realEstimations.estimations.find(est => 
    est.projectType.toLowerCase() === projectType.toLowerCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Fallback to medium complexity
  return realEstimations.estimations.find(est => 
    est.projectType.toLowerCase() === projectType.toLowerCase() &&
    est.complexity === 'medium'
  ) || null;
}

/**
 * Get all available project types
 */
export function getAvailableProjectTypes(): string[] {
  const types = realEstimations.estimations.map(est => est.projectType);
  return Array.from(new Set(types));
}

/**
 * Get all available complexity levels
 */
export function getAvailableComplexityLevels(): string[] {
  const levels = realEstimations.estimations.map(est => est.complexity);
  return Array.from(new Set(levels));
}

/**
 * Calculate adjusted price based on features and additional requirements
 */
export function calculateAdjustedPrice(
  baseEstimation: RealEstimation,
  additionalFeatures: string[],
  specialRequirements: string[]
): { minPrice: number; maxPrice: number; minHours: number; maxHours: number } {
  let minMultiplier = 1.0;
  let maxMultiplier = 1.0;
  
  // Additional features increase price and hours
  additionalFeatures.forEach(feature => {
    if (feature.includes('AI') || feature.includes('аі')) {
      minMultiplier += 0.3;
      maxMultiplier += 0.4;
    } else if (feature.includes('API') || feature.includes('інтеграція')) {
      minMultiplier += 0.2;
      maxMultiplier += 0.25;
    } else if (feature.includes('анімація') || feature.includes('animation')) {
      minMultiplier += 0.15;
      maxMultiplier += 0.2;
    } else if (feature.includes('аналітика') || feature.includes('analytics')) {
      minMultiplier += 0.25;
      maxMultiplier += 0.3;
    } else {
      minMultiplier += 0.1;
      maxMultiplier += 0.15;
    }
  });
  
  // Special requirements can significantly increase price
  specialRequirements.forEach(req => {
    if (req.includes('терміново') || req.includes('urgent')) {
      minMultiplier += 0.5;
      maxMultiplier += 0.6;
    } else if (req.includes('преміум') || req.includes('premium')) {
      minMultiplier += 0.4;
      maxMultiplier += 0.5;
    }
  });
  
  return {
    minPrice: Math.round(baseEstimation.minPrice * minMultiplier),
    maxPrice: Math.round(baseEstimation.maxPrice * maxMultiplier),
    minHours: Math.round(baseEstimation.minHours * minMultiplier),
    maxHours: Math.round(baseEstimation.maxHours * maxMultiplier)
  };
}

/**
 * Get timeline based on complexity and features
 */
export function getAdjustedTimeline(
  baseEstimation: RealEstimation,
  additionalFeatures: string[]
): string {
  let baseWeeks = 0;
  
  // Parse base timeline
  const timelineMatch = baseEstimation.timeline.match(/(\d+)-(\d+)/);
  if (timelineMatch) {
    const minWeeks = parseInt(timelineMatch[1]);
    const maxWeeks = parseInt(timelineMatch[2]);
    baseWeeks = Math.round((minWeeks + maxWeeks) / 2);
  }
  
  // Adjust for additional features
  let additionalWeeks = 0;
  additionalFeatures.forEach(feature => {
    if (feature.includes('AI') || feature.includes('аі')) {
      additionalWeeks += 2;
    } else if (feature.includes('API') || feature.includes('інтеграція')) {
      additionalWeeks += 1.5;
    } else if (feature.includes('анімація') || feature.includes('animation')) {
      additionalWeeks += 1;
    } else {
      additionalWeeks += 0.5;
    }
  });
  
  const totalWeeks = Math.round(baseWeeks + additionalWeeks);
  return `${totalWeeks}-${totalWeeks + 2} тижнів`;
}

/**
 * Get team size based on complexity and features
 */
export function getAdjustedTeamSize(
  baseEstimation: RealEstimation,
  additionalFeatures: string[]
): number {
  let teamSize = baseEstimation.teamSize;
  
  additionalFeatures.forEach(feature => {
    if (feature.includes('AI') || feature.includes('аі')) {
      teamSize += 1; // AI developer
    } else if (feature.includes('API') || feature.includes('інтеграція')) {
      teamSize += 0.5; // Backend developer
    } else if (feature.includes('анімація') || feature.includes('animation')) {
      teamSize += 0.5; // Frontend developer
    }
  });
  
  return Math.max(1, Math.round(teamSize));
}
