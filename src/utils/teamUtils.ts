import teamData from '../data/comprehensive-team-data.json';

export interface TeamMember {
  id: string;
  fullName: string;
  department: string;
  role: string;
  leader: string;
  access: string;
  email: string;
  cv: string;
  seniority: string;
  industries: string[];
  linkedin: string;
  experienceStarted: string;
  joinedCieden: string;
  inCieden: string;
  totalExperience: string;
  englishLevel: string;
  goals: Array<{
    id: string;
    name: string;
    goalType: string;
    goalName: string;
    goalDescription: string;
    link: string;
    tags: string[];
  }>;
}

/**
 * Get all team members
 */
export function getAllTeamMembers(): TeamMember[] {
  return teamData.members;
}

/**
 * Get team members by department
 */
export function getTeamMembersByDepartment(department: string): TeamMember[] {
  return teamData.members.filter(member => 
    member.department.toLowerCase() === department.toLowerCase()
  );
}

/**
 * Get team members by role
 */
export function getTeamMembersByRole(role: string): TeamMember[] {
  return teamData.members.filter(member => 
    member.role.toLowerCase().includes(role.toLowerCase())
  );
}

/**
 * Get designers for project (UX/UI Designers)
 */
export function getDesignersForProject(complexity: string, projectType: string): string[] {
  const designers = getTeamMembersByDepartment('Design');
  
  // Фільтруємо за seniority та проектом
  let filteredDesigners = designers;
  
  if (complexity === 'high' || projectType === 'e-commerce' || projectType === 'mobile-app') {
    // Для складних проектів - тільки Senior дизайнери
    filteredDesigners = designers.filter(d => d.seniority === 'Senior');
  } else if (complexity === 'medium') {
    // Для середніх проектів - Senior + Middle
    filteredDesigners = designers.filter(d => ['Senior', 'Middle'].includes(d.seniority));
  }
  
  // Повертаємо імена дизайнерів
  return filteredDesigners.map(d => d.fullName);
}

/**
 * Get contact person for project type
 */
export function getContactPersonForProject(projectType: string): string {
  // Логіка вибору контактної особи за типом проекту
  if (projectType === 'e-commerce' || projectType === 'website') {
    // Для веб-проектів - Product Manager
    const productManagers = getTeamMembersByRole('Product Manager');
    if (productManagers.length > 0) {
      return productManagers[0].fullName;
    }
  }
  
  // За замовчуванням - перший менеджер
  const managers = teamData.members.filter(m => m.access === 'Manager');
  if (managers.length > 0) {
    return managers[0].fullName;
  }
  
  // Якщо немає менеджерів - перший Senior
  const seniors = teamData.members.filter(m => m.seniority === 'Senior');
  if (seniors.length > 0) {
    return seniors[0].fullName;
  }
  
  return 'Roman Kaminechny'; // Fallback
}

/**
 * Get contact email for project type
 */
export function getContactEmailForProject(projectType: string): string {
  const contactPerson = getContactPersonForProject(projectType);
  const member = teamData.members.find(m => m.fullName === contactPerson);
  return member?.email || 'roman@cieden.com';
}

/**
 * Search team members by query
 */
export function searchTeam(query: string): TeamMember[] {
  const lowerQuery = query.toLowerCase();
  
  return teamData.members.filter(member => 
    member.fullName.toLowerCase().includes(lowerQuery) ||
    member.role.toLowerCase().includes(lowerQuery) ||
    member.department.toLowerCase().includes(lowerQuery) ||
    member.industries.some(industry => 
      industry.toLowerCase().includes(lowerQuery)
    )
  );
}

/**
 * Get team member by name
 */
export function getTeamMember(name: string): TeamMember | null {
  return teamData.members.find(member => 
    member.fullName.toLowerCase().includes(name.toLowerCase())
  ) || null;
}

/**
 * Get team members by seniority level
 */
export function getTeamMembersBySeniority(level: string): TeamMember[] {
  return teamData.members.filter(member => 
    member.seniority.toLowerCase() === level.toLowerCase()
  );
}

/**
 * Get team members by industry experience
 */
export function getTeamMembersByIndustry(industry: string): TeamMember[] {
  return teamData.members.filter(member => 
    member.industries.some(ind => 
      ind.toLowerCase().includes(industry.toLowerCase())
    )
  );
}
