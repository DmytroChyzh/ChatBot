import companyEstimations from '../data/company-estimations-database.json';

export interface ProjectFeature {
  name: string;
  description: string;
  priceRange: string;
  exampleProject?: string;
}

export interface ProjectTypeFeatures {
  type: string;
  complexity: string;
  features: ProjectFeature[];
  basePrice: { min: number; max: number };
  timeline: string;
  teamSize: number;
}

// Отримуємо функції для конкретного типу проекту
export function getProjectFeatures(projectType: string, complexity: string = 'medium'): ProjectTypeFeatures {
  const projects = companyEstimations.projects;
  
  // Фільтруємо проекти за типом та складністю
  const relevantProjects = projects.filter(project => 
    project.type === projectType && 
    project.complexity === complexity
  );

  // Якщо немає точних збігів, беремо всі проекти цього типу
  const allTypeProjects = projects.filter(project => project.type === projectType);
  const projectsToUse = relevantProjects.length > 0 ? relevantProjects : allTypeProjects;

  if (projectsToUse.length === 0) {
    // Fallback для невідомих типів
    return getDefaultFeatures(projectType);
  }

  // Збираємо всі функції з проектів
  const allFeatures = projectsToUse.flatMap(project => 
    project.features.map(feature => ({
      name: feature,
      description: getFeatureDescription(feature),
      priceRange: getPriceRange(project.totals.total_cost),
      exampleProject: project.name
    }))
  );

  // Видаляємо дублікати
  const uniqueFeatures = allFeatures.filter((feature, index, self) => 
    index === self.findIndex(f => f.name === feature.name)
  );

  // Розраховуємо базову ціну
  const costs = projectsToUse.map(p => p.totals.total_cost);
  const basePrice = {
    min: Math.min(...costs),
    max: Math.max(...costs)
  };

  // Розраховуємо timeline
  const timelines = projectsToUse.map(p => p.totals.timeline_weeks);
  const avgTimeline = Math.round(timelines.reduce((a, b) => a + b, 0) / timelines.length);
  const timeline = `${avgTimeline - 1}-${avgTimeline + 1} тижнів`;

  // Розраховуємо розмір команди
  const teamSizes = projectsToUse.map(p => p.totals.team_size);
  const avgTeamSize = Math.round(teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length);

  return {
    type: projectType,
    complexity,
    features: uniqueFeatures.slice(0, 8), // Беремо топ-8 функцій
    basePrice,
    timeline,
    teamSize: avgTeamSize
  };
}

// Отримуємо функції для e-commerce
export function getEcommerceFeatures(): ProjectFeature[] {
  const ecommerceProjects = companyEstimations.projects.filter(p => 
    p.type === 'web-app' && 
    (p.features.some(f => f.includes('management') || f.includes('dashboard') || f.includes('analytics')))
  );

  const commonFeatures = [
    {
      name: "Каталог товарів з фільтрами",
      description: "Пошук та фільтрація товарів за різними параметрами",
      priceRange: "Включено в базову ціну",
      exampleProject: "Refmax Real Estate Platform"
    },
    {
      name: "Корзина та оформлення замовлення", 
      description: "Додавання товарів в корзину та процес оформлення",
      priceRange: "Включено в базову ціну",
      exampleProject: "Refmax Real Estate Platform"
    },
    {
      name: "Особистий кабінет",
      description: "Управління профілем, історія замовлень",
      priceRange: "Включено в базову ціну", 
      exampleProject: "Refmax Real Estate Platform"
    },
    {
      name: "Адмін-панель",
      description: "Управління товарами, замовленнями, користувачами",
      priceRange: "+$2,000-5,000",
      exampleProject: "Property Management System"
    },
    {
      name: "Система оплати",
      description: "Різні способи оплати (картка, PayPal, тощо)",
      priceRange: "+$1,500-3,000",
      exampleProject: "Property Management System"
    },
    {
      name: "Мобільна версія",
      description: "Адаптивний дизайн для мобільних пристроїв",
      priceRange: "+$2,000-4,000",
      exampleProject: "Living Sunshine Website"
    },
    {
      name: "Аналітика та звіти",
      description: "Статистика продажів, звіти по доходах",
      priceRange: "+$1,000-2,500",
      exampleProject: "BruhnPartner Platform"
    },
    {
      name: "Сповіщення та алерти",
      description: "Email повідомлення, push-нотифікації",
      priceRange: "+$800-1,500",
      exampleProject: "Refmax Real Estate Platform"
    }
  ];

  return commonFeatures;
}

// Отримуємо функції для звичайних сайтів
export function getWebsiteFeatures(): ProjectFeature[] {
  const websiteProjects = companyEstimations.projects.filter(p => p.type === 'website');
  
  const commonFeatures = [
    {
      name: "Головна сторінка",
      description: "Приваблива головна сторінка з основними послугами",
      priceRange: "Включено в базову ціну",
      exampleProject: "Living Sunshine Website"
    },
    {
      name: "Сторінки товарів/послуг",
      description: "Детальні сторінки з описом та зображеннями",
      priceRange: "Включено в базову ціну",
      exampleProject: "Living Sunshine Website"
    },
    {
      name: "Мобільна адаптація",
      description: "Оптимізація для мобільних пристроїв",
      priceRange: "Включено в базову ціну",
      exampleProject: "Living Sunshine Website"
    },
    {
      name: "Форми зворотного зв'язку",
      description: "Контактні форми, замовлення дзвінка",
      priceRange: "Включено в базову ціну",
      exampleProject: "Shipro Website"
    },
    {
      name: "Дизайн-система",
      description: "UI Kit з компонентами для майбутнього розвитку",
      priceRange: "+$500-1,000",
      exampleProject: "Shipro Website"
    },
    {
      name: "Блог/новини",
      description: "Секція для публікації новин та статей",
      priceRange: "+$800-1,500",
      exampleProject: "Shipro Website"
    },
    {
      name: "Мультимовність",
      description: "Підтримка кількох мов",
      priceRange: "+$1,000-2,000",
      exampleProject: "Shipro Website"
    },
    {
      name: "SEO оптимізація",
      description: "Налаштування для пошукових систем",
      priceRange: "+$500-1,200",
      exampleProject: "Living Sunshine Website"
    }
  ];

  return commonFeatures;
}

// Отримуємо функції для dashboard/web-app
export function getDashboardFeatures(): ProjectFeature[] {
  const dashboardProjects = companyEstimations.projects.filter(p => 
    p.type === 'dashboard' || p.type === 'web-app'
  );

  const commonFeatures = [
    {
      name: "Dashboard з аналітикою",
      description: "Головна панель з ключовими метриками",
      priceRange: "Включено в базову ціну",
      exampleProject: "BruhnPartner Platform"
    },
    {
      name: "Управління користувачами",
      description: "Реєстрація, авторизація, ролі користувачів",
      priceRange: "Включено в базову ціну",
      exampleProject: "Property Management System"
    },
    {
      name: "Система звітів",
      description: "Генерація та експорт звітів",
      priceRange: "+$1,500-3,000",
      exampleProject: "BruhnPartner Platform"
    },
    {
      name: "Сповіщення та алерти",
      description: "Email, SMS, push-повідомлення",
      priceRange: "+$1,000-2,000",
      exampleProject: "Refmax Real Estate Platform"
    },
    {
      name: "API інтеграції",
      description: "Підключення до зовнішніх сервісів",
      priceRange: "+$2,000-4,000",
      exampleProject: "Property Management System"
    },
    {
      name: "Мобільна версія",
      description: "Адаптивний дизайн для планшетів та телефонів",
      priceRange: "+$2,500-5,000",
      exampleProject: "Refmax Real Estate Platform"
    },
    {
      name: "Безпека та права доступу",
      description: "Система ролей та дозволів",
      priceRange: "+$1,500-3,000",
      exampleProject: "Property Management System"
    },
    {
      name: "Імпорт/експорт даних",
      description: "Завантаження та вивантаження файлів",
      priceRange: "+$1,000-2,500",
      exampleProject: "Property Management System"
    }
  ];

  return commonFeatures;
}

// Допоміжні функції
function getFeatureDescription(feature: string): string {
  const descriptions: { [key: string]: string } = {
    'Dashboard creation interface': 'Інтерфейс для створення дашбордів',
    'Customer access interface': 'Інтерфейс доступу клієнтів',
    'Admin user management': 'Управління користувачами адміністратором',
    'Report sharing via email': 'Розсилка звітів по email',
    'Customer branding': 'Брендинг для клієнтів',
    'Multiple studies access': 'Доступ до множинних досліджень',
    'Sign up/Login/Forgot password': 'Система авторизації',
    'Onboarding flow': 'Процес онбордингу нових користувачів',
    'Referrals management': 'Управління рефералами',
    'Listings management': 'Управління списками',
    'Analytics': 'Аналітичні інструменти',
    'Notifications': 'Система сповіщень',
    'Profile management': 'Управління профілем'
  };
  
  return descriptions[feature] || feature;
}

function getPriceRange(cost: number): string {
  if (cost < 5000) return "Включено в базову ціну";
  if (cost < 10000) return "+$1,000-2,000";
  if (cost < 20000) return "+$2,000-4,000";
  return "+$3,000-6,000";
}

function getDefaultFeatures(projectType: string): ProjectTypeFeatures {
  return {
    type: projectType,
    complexity: 'medium',
    features: [],
    basePrice: { min: 3000, max: 8000 },
    timeline: '4-8 тижнів',
    teamSize: 1
  };
}

// Головна функція для отримання функцій за типом проекту
export function getFeaturesByProjectType(projectType: string): ProjectFeature[] {
  switch (projectType.toLowerCase()) {
    case 'e-commerce':
    case 'ecommerce':
    case 'магазин':
    case 'інтернет-магазин':
      return getEcommerceFeatures();
    
    case 'website':
    case 'сайт':
    case 'лендінг':
    case 'landing':
      return getWebsiteFeatures();
    
    case 'dashboard':
    case 'web-app':
    case 'webapp':
    case 'дашборд':
    case 'веб-додаток':
      return getDashboardFeatures();
    
    default:
      return getWebsiteFeatures(); // Fallback
  }
}
