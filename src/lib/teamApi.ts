import { TeamMember } from '../utils/teamUtils';

const API_BASE = '/api/team';

export interface TeamApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

export interface ProjectTeamFilters {
  complexity: string;
  projectType: string;
  features?: string[];
}

export interface AdvancedSearchFilters {
  department?: string;
  role?: string;
  seniority?: string;
  industry?: string;
  experience?: number;
}

/**
 * Get all team members
 */
export async function fetchAllTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API_BASE}?action=all`);
    const result: TeamApiResponse<TeamMember[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch team members');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching all team members:', error);
    return [];
  }
}

/**
 * Search team members by query
 */
export async function searchTeamMembers(query: string): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}`);
    const result: TeamApiResponse<TeamMember[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to search team members');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error searching team members:', error);
    return [];
  }
}

/**
 * Get team members by department
 */
export async function fetchTeamMembersByDepartment(department: string): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API_BASE}?action=byDepartment&department=${encodeURIComponent(department)}`);
    const result: TeamApiResponse<TeamMember[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch team members by department');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching team members by department:', error);
    return [];
  }
}

/**
 * Get team members by role
 */
export async function fetchTeamMembersByRole(role: string): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API_BASE}?action=byRole&role=${encodeURIComponent(role)}`);
    const result: TeamApiResponse<TeamMember[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch team members by role');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching team members by role:', error);
    return [];
  }
}

/**
 * Get designers for project
 */
export async function fetchDesignersForProject(complexity: string, projectType: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE}?action=designers&complexity=${encodeURIComponent(complexity)}&projectType=${encodeURIComponent(projectType)}`
    );
    const result: TeamApiResponse<string[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch designers for project');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching designers for project:', error);
    return [];
  }
}

/**
 * Get contact person for project
 */
export async function fetchContactPersonForProject(projectType: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}?action=contactPerson&projectType=${encodeURIComponent(projectType)}`);
    const result: TeamApiResponse<string> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch contact person');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching contact person:', error);
    return 'Roman Kaminechny'; // Fallback
  }
}

/**
 * Advanced search with multiple filters
 */
export async function advancedTeamSearch(filters: AdvancedSearchFilters): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'advancedSearch',
        filters
      })
    });
    
    const result: TeamApiResponse<TeamMember[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to perform advanced search');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error performing advanced search:', error);
    return [];
  }
}

/**
 * Get project team composition
 */
export async function fetchProjectTeam(filters: ProjectTeamFilters): Promise<{
  designers: string[];
  developers: string[];
  qa: string[];
  contactPerson: string;
  projectManager: string;
}> {
  try {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getProjectTeam',
        filters
      })
    });
    
    const result: TeamApiResponse<{
      designers: string[];
      developers: string[];
      qa: string[];
      contactPerson: string;
      projectManager: string;
    }> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch project team');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching project team:', error);
    return {
      designers: [],
      developers: [],
      qa: [],
      contactPerson: 'Roman Kaminechny',
      projectManager: 'Roman Kaminechny'
    };
  }
}

/**
 * Get specific team member by ID or name
 */
export async function fetchTeamMember(idOrName: string): Promise<TeamMember | null> {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(idOrName)}`);
    
    if (response.status === 404) {
      return null;
    }
    
    const result: TeamApiResponse<TeamMember> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch team member');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching team member:', error);
    return null;
  }
}
