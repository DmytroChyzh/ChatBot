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
  'ux-research': string;
  'ui-design': string;
  'prototyping': string;
  'design-system': string;
  'mobile-adaptive': string;
  descriptions: {
    'ux-research': string;
    'ui-design': string;
    'prototyping': string;
    'design-system': string;
    'mobile-adaptive': string;
  };
} {
  const patterns = getEstimationPatterns();
  const isUkrainian = language === 'uk';
  
  // Calculate average values
  const avgHours = Math.round((minHours + maxHours) / 2);
  const avgPrice = Math.round((minPrice + maxPrice) / 2);
  
  // Use company patterns for distribution (adapted for UI/UX design phases)
  const hoursDistribution = {
    'ux-research': Math.round(avgHours * patterns.phase_distribution.research_analysis),
    'ui-design': Math.round(avgHours * patterns.phase_distribution.design),
    'prototyping': Math.round(avgHours * patterns.phase_distribution.prototyping),
    'design-system': Math.round(avgHours * patterns.phase_distribution.wireframing),
    'mobile-adaptive': Math.round(avgHours * patterns.phase_distribution.testing)
  };
  
  const priceDistribution = {
    'ux-research': Math.round(avgPrice * patterns.phase_distribution.research_analysis),
    'ui-design': Math.round(avgPrice * patterns.phase_distribution.design),
    'prototyping': Math.round(avgPrice * patterns.phase_distribution.prototyping),
    'design-system': Math.round(avgPrice * patterns.phase_distribution.wireframing),
    'mobile-adaptive': Math.round(avgPrice * patterns.phase_distribution.testing)
  };
  
  // Generate detailed descriptions based on project type and complexity
  const descriptions = generatePhaseDescriptions(projectType, complexity, isUkrainian);
  
  return {
    'ux-research': isUkrainian 
      ? `🔍 UX Дослідження (${hoursDistribution['ux-research']} год, $${priceDistribution['ux-research']})`
      : `🔍 UX Research (${hoursDistribution['ux-research']}h, $${priceDistribution['ux-research']})`,
    
    'ui-design': isUkrainian 
      ? `🎨 UI Дизайн (${hoursDistribution['ui-design']} год, $${priceDistribution['ui-design']})`
      : `🎨 UI Design (${hoursDistribution['ui-design']}h, $${priceDistribution['ui-design']})`,
    
    'prototyping': isUkrainian 
      ? `⚡ Прототипування (${hoursDistribution['prototyping']} год, $${priceDistribution['prototyping']})`
      : `⚡ Prototyping (${hoursDistribution['prototyping']}h, $${priceDistribution['prototyping']})`,
    
    'design-system': isUkrainian 
      ? `📐 Дизайн-система (${hoursDistribution['design-system']} год, $${priceDistribution['design-system']})`
      : `📐 Design System (${hoursDistribution['design-system']}h, $${priceDistribution['design-system']})`,
    
    'mobile-adaptive': isUkrainian 
      ? `📱 Мобільна адаптація (${hoursDistribution['mobile-adaptive']} год, $${priceDistribution['mobile-adaptive']})`
      : `📱 Mobile Adaptive (${hoursDistribution['mobile-adaptive']}h, $${priceDistribution['mobile-adaptive']})`,
    
    descriptions
  };
}

/**
 * Generate detailed descriptions for each phase based on project type and complexity
 */
function generatePhaseDescriptions(projectType: string, complexity: string, isUkrainian: boolean) {
  const baseDescriptions = {
    'ux-research': isUkrainian 
      ? "Аналіз цільової аудиторії, конкурентів та ринку. Дослідження потреб користувачів, створення персон, аналіз бізнес-вимог та технічних обмежень."
      : "Target audience analysis, competitor research, market analysis. User needs research, persona creation, business requirements analysis, and technical constraints study.",
    
    'ui-design': isUkrainian 
      ? "Створення візуального стилю, високо-деталізовані макети (mockups), UI компоненти, іконки, типографіка та кольорова схема."
      : "Visual style creation, high-fidelity mockups, UI components, icons, typography and color scheme.",
    
    'prototyping': isUkrainian 
      ? "Створення інтерактивних прототипів для тестування користувацького досвіду, демонстрації функціональності та валідації дизайн-рішень."
      : "Interactive prototype creation for user experience testing, functionality demonstration, and design validation.",
    
    'design-system': isUkrainian 
      ? "Створення дизайн-системи, компонентів, стилів, гайдлайнів та бібліотеки елементів для масштабування проекту."
      : "Design system creation, components, styles, guidelines and element library for project scaling.",
    
    'mobile-adaptive': isUkrainian 
      ? "Адаптація дизайну для мобільних пристроїв, планшетів та різних розмірів екранів. Responsive дизайн та мобільна оптимізація."
      : "Design adaptation for mobile devices, tablets and different screen sizes. Responsive design and mobile optimization."
  };

  // Customize descriptions based on project type
  if (projectType === 'e-commerce') {
    return {
      'ux-research': isUkrainian 
        ? "Аналіз цільової аудиторії, дослідження конкурентів в e-commerce, аналіз товарного каталогу, дослідження процесів покупки та конверсії."
        : "Target audience analysis, e-commerce competitor research, product catalog analysis, purchase process and conversion research.",
      
      'ui-design': isUkrainian 
        ? "Дизайн каталогу товарів, сторінки товару, корзини, оформлення замовлення, особистого кабінету, UI компоненти для e-commerce."
        : "Product catalog design, product pages, shopping cart, checkout, user account, e-commerce UI components.",
      
      'prototyping': isUkrainian 
        ? "Інтерактивні прототипи процесу покупки, тестування корзини та оформлення замовлення, демонстрація функціональності магазину."
        : "Interactive purchase process prototypes, cart and checkout testing, store functionality demonstration.",
      
      'design-system': isUkrainian 
        ? "Дизайн-система для e-commerce: компоненти каталогу, корзини, форми, кнопки, картки товарів та елементи навігації."
        : "E-commerce design system: catalog components, cart, forms, buttons, product cards and navigation elements.",
      
      'mobile-adaptive': isUkrainian 
        ? "Мобільна адаптація інтернет-магазину, оптимізація для touch-інтерфейсів, мобільна корзина та процес оформлення замовлення."
        : "E-commerce mobile adaptation, touch interface optimization, mobile cart and checkout process."
    };
  }

  if (projectType === 'dashboard') {
    return {
      'ux-research': isUkrainian 
        ? "Аналіз бізнес-процесів, дослідження потреб користувачів дашборду, аналіз даних та метрик, визначення ключових показників ефективності (KPI)."
        : "Business process analysis, dashboard user needs research, data and metrics analysis, key performance indicators (KPI) definition.",
      
      'ui-design': isUkrainian 
        ? "Дизайн інтерфейсу дашборду, створення віджетів та графіків, UI компоненти для адміністративних панелей, темна/світла тема."
        : "Dashboard interface design, widget and chart creation, administrative panel UI components, dark/light theme.",
      
      'prototyping': isUkrainian 
        ? "Інтерактивні прототипи дашборду з робочими графіками, демонстрація фільтрації даних та взаємодії з віджетами."
        : "Interactive dashboard prototypes with working charts, data filtering demonstration, and widget interaction.",
      
      'design-system': isUkrainian 
        ? "Дизайн-система для дашбордів: компоненти графіків, віджетів, таблиць, фільтрів та елементів навігації."
        : "Dashboard design system: chart components, widgets, tables, filters and navigation elements.",
      
      'mobile-adaptive': isUkrainian 
        ? "Мобільна адаптація дашборду, оптимізація віджетів для touch-інтерфейсів, мобільна навігація та перегляд даних."
        : "Dashboard mobile adaptation, widget optimization for touch interfaces, mobile navigation and data viewing."
    };
  }

  if (projectType === 'web-app') {
    return {
      'ux-research': isUkrainian 
        ? "Аналіз функціональних вимог, дослідження користувацьких сценаріїв, аналіз інтеграцій з зовнішніми сервісами, технічні обмеження."
        : "Functional requirements analysis, user scenario research, external service integration analysis, technical constraints.",
      
      'ui-design': isUkrainian 
        ? "Повний дизайн інтерфейсу веб-додатку, UI компоненти, адаптивний дизайн, анімації та мікро-взаємодії."
        : "Complete web application interface design, UI components, responsive design, animations and micro-interactions.",
      
      'prototyping': isUkrainian 
        ? "Повнофункціональні прототипи з усіма інтерактивними елементами, демонстрація робочих процесів та інтеграцій."
        : "Full-featured prototypes with all interactive elements, working processes and integrations demonstration.",
      
      'design-system': isUkrainian 
        ? "Дизайн-система для веб-додатку: компоненти форм, кнопок, навігації, модальних вікон та інтерактивних елементів."
        : "Web application design system: form components, buttons, navigation, modal windows and interactive elements.",
      
      'mobile-adaptive': isUkrainian 
        ? "Мобільна адаптація веб-додатку, оптимізація для touch-інтерфейсів, мобільна навігація та взаємодія."
        : "Web application mobile adaptation, touch interface optimization, mobile navigation and interaction."
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
