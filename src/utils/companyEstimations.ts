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
  descriptions: {
    research: string;
    wireframing: string;
    design: string;
    prototyping: string;
    testing: string;
  };
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
  
  // Generate detailed descriptions based on project type and complexity
  const descriptions = generatePhaseDescriptions(projectType, complexity, isUkrainian);
  
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
      : `🧪 Testing & Optimization (${hoursDistribution.testing}h, $${priceDistribution.testing})`,
    
    descriptions
  };
}

/**
 * Generate detailed descriptions for each phase based on project type and complexity
 */
function generatePhaseDescriptions(projectType: string, complexity: string, isUkrainian: boolean) {
  const baseDescriptions = {
    research: isUkrainian 
      ? "Аналіз цільової аудиторії, конкурентів та ринку. Дослідження потреб користувачів, створення персон, аналіз бізнес-вимог та технічних обмежень."
      : "Target audience analysis, competitor research, market analysis. User needs research, persona creation, business requirements analysis, and technical constraints study.",
    
    wireframing: isUkrainian 
      ? "Створення інформаційної архітектури, карта сайту, низько-деталізовані макети (wireframes), планування навігації та структури контенту."
      : "Information architecture creation, site map, low-fidelity wireframes, navigation planning, and content structure design.",
    
    design: isUkrainian 
      ? "Створення візуального стилю, дизайн-система, високо-деталізовані макети (mockups), адаптивний дизайн для різних пристроїв, UI компоненти."
      : "Visual style creation, design system, high-fidelity mockups, responsive design for different devices, UI components.",
    
    prototyping: isUkrainian 
      ? "Створення інтерактивних прототипів для тестування користувацького досвіду, демонстрації функціональності та валідації дизайн-рішень."
      : "Interactive prototype creation for user experience testing, functionality demonstration, and design validation.",
    
    testing: isUkrainian 
      ? "Юзабіліті тестування, збір зворотного зв'язку, ітерації на основі результатів тестування, фінальна оптимізація дизайну."
      : "Usability testing, feedback collection, iterations based on testing results, final design optimization."
  };

  // Customize descriptions based on project type
  if (projectType === 'e-commerce') {
    return {
      research: isUkrainian 
        ? "Аналіз цільової аудиторії, дослідження конкурентів в e-commerce, аналіз товарного каталогу, дослідження процесів покупки та конверсії."
        : "Target audience analysis, e-commerce competitor research, product catalog analysis, purchase process and conversion research.",
      
      wireframing: isUkrainian 
        ? "Створення структури каталогу товарів, планування корзини та процесу оформлення замовлення, карта сайту для інтернет-магазину."
        : "Product catalog structure creation, shopping cart and checkout process planning, e-commerce site map.",
      
      design: isUkrainian 
        ? "Дизайн каталогу товарів, сторінки товару, корзини, оформлення замовлення, особистого кабінету, адаптивний дизайн для мобільних пристроїв."
        : "Product catalog design, product pages, shopping cart, checkout, user account, responsive design for mobile devices.",
      
      prototyping: isUkrainian 
        ? "Інтерактивні прототипи процесу покупки, тестування корзини та оформлення замовлення, демонстрація функціональності магазину."
        : "Interactive purchase process prototypes, cart and checkout testing, store functionality demonstration.",
      
      testing: isUkrainian 
        ? "Тестування процесу покупки, аналіз конверсії, оптимізація користувацького досвіду в e-commerce, A/B тестування ключових сторінок."
        : "Purchase process testing, conversion analysis, e-commerce UX optimization, A/B testing of key pages."
    };
  }

  if (projectType === 'dashboard') {
    return {
      research: isUkrainian 
        ? "Аналіз бізнес-процесів, дослідження потреб користувачів дашборду, аналіз даних та метрик, визначення ключових показників ефективності (KPI)."
        : "Business process analysis, dashboard user needs research, data and metrics analysis, key performance indicators (KPI) definition.",
      
      wireframing: isUkrainian 
        ? "Створення інформаційної архітектури дашборду, планування розташування віджетів, структура навігації між розділами."
        : "Dashboard information architecture creation, widget layout planning, navigation structure between sections.",
      
      design: isUkrainian 
        ? "Дизайн інтерфейсу дашборду, створення віджетів та графіків, дизайн-система для адміністративних панелей, темна/світла тема."
        : "Dashboard interface design, widget and chart creation, administrative panel design system, dark/light theme.",
      
      prototyping: isUkrainian 
        ? "Інтерактивні прототипи дашборду з робочими графіками, демонстрація фільтрації даних та взаємодії з віджетами."
        : "Interactive dashboard prototypes with working charts, data filtering demonstration, and widget interaction.",
      
      testing: isUkrainian 
        ? "Тестування з бізнес-користувачами, валідація ефективності відображення даних, оптимізація швидкості сприйняття інформації."
        : "Business user testing, data display effectiveness validation, information perception speed optimization."
    };
  }

  if (projectType === 'web-app') {
    return {
      research: isUkrainian 
        ? "Аналіз функціональних вимог, дослідження користувацьких сценаріїв, аналіз інтеграцій з зовнішніми сервісами, технічні обмеження."
        : "Functional requirements analysis, user scenario research, external service integration analysis, technical constraints.",
      
      wireframing: isUkrainian 
        ? "Створення детальної інформаційної архітектури, планування користувацьких потоків, макети всіх екранів та функцій."
        : "Detailed information architecture creation, user flow planning, all screens and functions wireframes.",
      
      design: isUkrainian 
        ? "Повний дизайн інтерфейсу веб-додатку, створення дизайн-системи, адаптивний дизайн, анімації та мікро-взаємодії."
        : "Complete web application interface design, design system creation, responsive design, animations and micro-interactions.",
      
      prototyping: isUkrainian 
        ? "Повнофункціональні прототипи з усіма інтерактивними елементами, демонстрація робочих процесів та інтеграцій."
        : "Full-featured prototypes with all interactive elements, working processes and integrations demonstration.",
      
      testing: isUkrainian 
        ? "Комплексне тестування користувацького досвіду, тестування продуктивності, валідація всіх функцій та інтеграцій."
        : "Comprehensive user experience testing, performance testing, all functions and integrations validation."
    };
  }

  return baseDescriptions;
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
