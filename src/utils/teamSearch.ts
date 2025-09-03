import { TeamMember, TeamSearchQuery, TeamSearchResult } from '../types/team';
import teamData from '../data/team-data.json';

// Реальні дані команди Cieden
export const mockTeamData: TeamMember[] = teamData as TeamMember[];

// Функція пошуку по команді
export const searchTeam = (query: TeamSearchQuery): TeamSearchResult => {
  const { query: searchQuery, filters } = query;
  const searchTerm = searchQuery.toLowerCase();
  
  let results = mockTeamData.filter(member => {
    // Пошук по імені
    if (member.fullName.toLowerCase().includes(searchTerm)) return true;
    
    // Пошук по ролі
    if (member.role.toLowerCase().includes(searchTerm)) return true;
    
    // Пошук по відділу
    if (member.department.toLowerCase().includes(searchTerm)) return true;
    
    // Пошук по індустріях
    if (member.industries.some(industry => 
      industry.toLowerCase().includes(searchTerm)
    )) return true;
    
    // Пошук по seniority
    if (member.seniority.toLowerCase().includes(searchTerm)) return true;
    
    return false;
  });
  
  // Застосовуємо фільтри
  if (filters) {
    if (filters.department) {
      results = results.filter(member => 
        member.department.toLowerCase() === filters.department!.toLowerCase()
      );
    }
    
    if (filters.seniority) {
      results = results.filter(member => 
        member.seniority.toLowerCase() === filters.seniority!.toLowerCase()
      );
    }
    
    if (filters.englishLevel) {
      results = results.filter(member => 
        member.englishLevel === filters.englishLevel
      );
    }
    
    if (filters.industries && filters.industries.length > 0) {
      results = results.filter(member => 
        member.industries.some(industry => 
          filters.industries!.includes(industry)
        )
      );
    }
  }
  
  // Генеруємо пропозиції для пошуку
  const suggestions = generateSearchSuggestions(searchTerm, results);
  
  return {
    members: results,
    total: results.length,
    query: searchQuery,
    suggestions
  };
};

// Генерація пропозицій для пошуку
const generateSearchSuggestions = (query: string, results: TeamMember[]): string[] => {
  const suggestions: string[] = [];
  
  if (query.length < 2) return suggestions;
  
  // Пропозиції по відділах
  const departments = Array.from(new Set(results.map(m => m.department)));
  suggestions.push(...departments.filter(d => 
    d.toLowerCase().includes(query)
  ));
  
  // Пропозиції по ролях
  const roles = Array.from(new Set(results.map(m => m.role)));
  suggestions.push(...roles.filter(r => 
    r.toLowerCase().includes(query)
  ));
  
  // Пропозиції по seniority
  const seniorities = Array.from(new Set(results.map(m => m.seniority)));
  suggestions.push(...seniorities.filter(s => 
    s.toLowerCase().includes(query)
  ));
  
  return suggestions.slice(0, 5); // Максимум 5 пропозицій
};

// Отримання конкретного члена команди
export const getTeamMember = (id: string): TeamMember | null => {
  return mockTeamData.find(member => member.id === id) || null;
};

// Отримання всіх членів команди
export const getAllTeamMembers = (): TeamMember[] => {
  return mockTeamData;
};

// Отримання членів команди по відділу
export const getTeamMembersByDepartment = (department: string): TeamMember[] => {
  return mockTeamData.filter(member => 
    member.department.toLowerCase() === department.toLowerCase()
  );
};

// Отримання статистики команди
export const getTeamStats = () => {
  const total = mockTeamData.length;
  const departments = Array.from(new Set(mockTeamData.map(m => m.department)));
  const seniorities = Array.from(new Set(mockTeamData.map(m => m.seniority)));
  const englishLevels = Array.from(new Set(mockTeamData.map(m => m.englishLevel)));
  
  return {
    total,
    departments: departments.length,
    seniorities: seniorities.length,
    englishLevels: englishLevels.length,
    avgExperience: mockTeamData.reduce((acc, m) => {
      const exp = parseInt(m.totalExperience.split(' ')[0]);
      return acc + (isNaN(exp) ? 0 : exp);
    }, 0) / total
  };
};
