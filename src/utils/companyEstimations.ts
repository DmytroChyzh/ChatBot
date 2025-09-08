import companyEstimations from '../data/company-estimations-database.json';

export interface CompanyProject {
  id: string;
  name: string;
  type: string;
  complexity: string;
  description: string;
  roles?: string[];
  features: string[];
  phases: any;
  totals: {
    total_hours: number;
    total_cost: number;
    timeline_weeks: number;
    team_size: number;
  };
  hourly_rate: number;
  team_capacity?: any;
}

export interface EstimationPatterns {
  hourly_rates: {
    low_complexity: number;
    medium_complexity: number;
    high_complexity: number;
  };
  timeline_multipliers: {
    low_complexity: number;
    medium_complexity: number;
    high_complexity: number;
  };
  team_size_by_complexity: {
    low_complexity: number;
    medium_complexity: number;
    high_complexity: number;
  };
  phase_distribution: {
    research_analysis: number;
    wireframing: number;
    design: number;
    prototyping: number;
    testing: number;
  };
}

export interface ProjectTypeConfig {
  base_hours: number;
  base_cost: number;
  complexity_multipliers: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Get similar projects from company database
 */
export function getSimilarProjects(projectType: string, complexity: string): CompanyProject[] {
  return companyEstimations.projects.filter(project => 
    project.type === projectType && project.complexity === complexity
  );
}

/**
 * Get estimation patterns from company data
 */
export function getEstimationPatterns(): EstimationPatterns {
  return companyEstimations.patterns;
}

/**
 * Get project type configuration
 */
export function getProjectTypeConfig(projectType: string): ProjectTypeConfig | null {
  return companyEstimations.project_types[projectType] || null;
}

/**
 * Calculate realistic estimation based on company data
 */
export function calculateRealisticEstimation(
  projectType: string, 
  complexity: string, 
  additionalFeatures: string[] = [],
  specialRequirements: string[] = []
): {
  minHours: number;
  maxHours: number;
  minPrice: number;
  maxPrice: number;
  timeline: string;
  teamSize: number;
  hourlyRate: number;
} {
  const patterns = getEstimationPatterns();
  const projectConfig = getProjectTypeConfig(projectType);
  const similarProjects = getSimilarProjects(projectType, complexity);
  
  if (!projectConfig) {
    // Fallback to basic calculation
    return {
      minHours: 100,
      maxHours: 200,
      minPrice: 5000,
      maxPrice: 10000,
      timeline: "6-12 тижнів",
      teamSize: 2,
      hourlyRate: 50
    };
  }

  // Get hourly rate based on complexity
  const hourlyRate = patterns.hourly_rates[`${complexity}_complexity` as keyof typeof patterns.hourly_rates];
  
  // Calculate base hours and cost
  const complexityMultiplier = projectConfig.complexity_multipliers[complexity as keyof typeof projectConfig.complexity_multipliers];
  const baseHours = Math.round(projectConfig.base_hours * complexityMultiplier);
  const baseCost = Math.round(projectConfig.base_cost * complexityMultiplier);
  
  // Adjust for additional features (each feature adds 10-20% to base)
  const featureMultiplier = 1 + (additionalFeatures.length * 0.15);
  const requirementMultiplier = 1 + (specialRequirements.length * 0.1);
  
  const adjustedHours = Math.round(baseHours * featureMultiplier * requirementMultiplier);
  const adjustedCost = Math.round(baseCost * featureMultiplier * requirementMultiplier);
  
  // Calculate min/max with 20% variance
  const variance = 0.2;
  const minHours = Math.round(adjustedHours * (1 - variance));
  const maxHours = Math.round(adjustedHours * (1 + variance));
  const minPrice = Math.round(adjustedCost * (1 - variance));
  const maxPrice = Math.round(adjustedCost * (1 + variance));
  
  // Calculate timeline based on team size and hours
  const teamSize = patterns.team_size_by_complexity[`${complexity}_complexity` as keyof typeof patterns.team_size_by_complexity];
  const timelineMultiplier = patterns.timeline_multipliers[`${complexity}_complexity` as keyof typeof patterns.timeline_multipliers];
  const baseTimeline = Math.round((adjustedHours / (teamSize * 40)) * timelineMultiplier); // 40 hours per week per person
  const timeline = `${Math.max(2, baseTimeline - 2)}-${baseTimeline + 2} тижнів`;
  
  return {
    minHours,
    maxHours,
    minPrice,
    maxPrice,
    timeline,
    teamSize,
    hourlyRate
  };
}

/**
 * Generate detailed phases based on company patterns
 */
export function generateCompanyBasedPhases(
  projectType: string,
  complexity: string,
  minHours: number,
  maxHours: number,
  minPrice: number,
  maxPrice: number,
  language: string = 'uk'
): {
  research: string;
  wireframing: string;
  design: string;
  prototyping: string;
  testing: string;
} {
  const patterns = getEstimationPatterns();
  const isUkrainian = language === 'uk';
  
  // Calculate average values
  const avgHours = Math.round((minHours + maxHours) / 2);
  const avgPrice = Math.round((minPrice + maxPrice) / 2);
  
  // Use company patterns for distribution
  const hoursDistribution = {
    research: Math.round(avgHours * patterns.phase_distribution.research_analysis),
    wireframing: Math.round(avgHours * patterns.phase_distribution.wireframing),
    design: Math.round(avgHours * patterns.phase_distribution.design),
    prototyping: Math.round(avgHours * patterns.phase_distribution.prototyping),
    testing: Math.round(avgHours * patterns.phase_distribution.testing)
  };
  
  const priceDistribution = {
    research: Math.round(avgPrice * patterns.phase_distribution.research_analysis),
    wireframing: Math.round(avgPrice * patterns.phase_distribution.wireframing),
    design: Math.round(avgPrice * patterns.phase_distribution.design),
    prototyping: Math.round(avgPrice * patterns.phase_distribution.prototyping),
    testing: Math.round(avgPrice * patterns.phase_distribution.testing)
  };
  
  return {
    research: isUkrainian 
      ? `🔍 Дослідження та аналіз (${hoursDistribution.research} год, $${priceDistribution.research})`
      : `🔍 Research & Analysis (${hoursDistribution.research}h, $${priceDistribution.research})`,
    
    wireframing: isUkrainian 
      ? `📐 Структура та навігація (${hoursDistribution.wireframing} год, $${priceDistribution.wireframing})`
      : `📐 Structure & Navigation (${hoursDistribution.wireframing}h, $${priceDistribution.wireframing})`,
    
    design: isUkrainian 
      ? `🎨 Візуальний дизайн (${hoursDistribution.design} год, $${priceDistribution.design})`
      : `🎨 Visual Design (${hoursDistribution.design}h, $${priceDistribution.design})`,
    
    prototyping: isUkrainian 
      ? `⚡ Прототипування (${hoursDistribution.prototyping} год, $${priceDistribution.prototyping})`
      : `⚡ Prototyping (${hoursDistribution.prototyping}h, $${priceDistribution.prototyping})`,
    
    testing: isUkrainian 
      ? `🧪 Тестування та оптимізація (${hoursDistribution.testing} год, $${priceDistribution.testing})`
      : `🧪 Testing & Optimization (${hoursDistribution.testing}h, $${priceDistribution.testing})`
  };
}

/**
 * Get team size recommendation based on company data
 */
export function getRecommendedTeamSize(projectType: string, complexity: string): number {
  const patterns = getEstimationPatterns();
  return patterns.team_size_by_complexity[`${complexity}_complexity` as keyof typeof patterns.team_size_by_complexity];
}

/**
 * Get timeline recommendation based on company data
 */
export function getRecommendedTimeline(hours: number, teamSize: number, complexity: string): string {
  const patterns = getEstimationPatterns();
  const timelineMultiplier = patterns.timeline_multipliers[`${complexity}_complexity` as keyof typeof patterns.timeline_multipliers];
  const baseWeeks = Math.round((hours / (teamSize * 40)) * timelineMultiplier);
  return `${Math.max(2, baseWeeks - 2)}-${baseWeeks + 2} тижнів`;
}
