import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllTeamMembers, 
  getTeamMembersByDepartment, 
  getTeamMembersByRole, 
  searchTeam,
  getTeamMember,
  getTeamMembersBySeniority,
  getTeamMembersByIndustry,
  getDesignersForProject,
  getContactPersonForProject
} from '../../../utils/teamUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const seniority = searchParams.get('seniority');
    const industry = searchParams.get('industry');
    const complexity = searchParams.get('complexity');
    const projectType = searchParams.get('projectType');

    let result;

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required for search' }, { status: 400 });
        }
        result = searchTeam(query);
        break;

      case 'byDepartment':
        if (!department) {
          return NextResponse.json({ error: 'Department parameter required' }, { status: 400 });
        }
        result = getTeamMembersByDepartment(department);
        break;

      case 'byRole':
        if (!role) {
          return NextResponse.json({ error: 'Role parameter required' }, { status: 400 });
        }
        result = getTeamMembersByRole(role);
        break;

      case 'bySeniority':
        if (!seniority) {
          return NextResponse.json({ error: 'Seniority parameter required' }, { status: 400 });
        }
        result = getTeamMembersBySeniority(seniority);
        break;

      case 'byIndustry':
        if (!industry) {
          return NextResponse.json({ error: 'Industry parameter required' }, { status: 400 });
        }
        result = getTeamMembersByIndustry(industry);
        break;

      case 'designers':
        if (!complexity || !projectType) {
          return NextResponse.json({ error: 'Complexity and projectType parameters required' }, { status: 400 });
        }
        result = getDesignersForProject(complexity, projectType);
        break;

      case 'contactPerson':
        if (!projectType) {
          return NextResponse.json({ error: 'ProjectType parameter required' }, { status: 400 });
        }
        result = getContactPersonForProject(projectType);
        break;

      case 'all':
      default:
        result = getAllTeamMembers();
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 1
    });

  } catch (error) {
    console.error('Team API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST method for more complex queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filters } = body;

    let result;

    switch (action) {
      case 'advancedSearch':
        // Advanced search with multiple filters
        let members = getAllTeamMembers();
        
        if (filters.department) {
          members = members.filter(m => 
            m.department.toLowerCase() === filters.department.toLowerCase()
          );
        }
        
        if (filters.role) {
          members = members.filter(m => 
            m.role.toLowerCase().includes(filters.role.toLowerCase())
          );
        }
        
        if (filters.seniority) {
          members = members.filter(m => 
            m.seniority.toLowerCase() === filters.seniority.toLowerCase()
          );
        }
        
        if (filters.industry) {
          members = members.filter(m => 
            m.industries.some(ind => 
              ind.toLowerCase().includes(filters.industry.toLowerCase())
            )
          );
        }
        
        if (filters.experience) {
          const minYears = parseInt(filters.experience);
          members = members.filter(m => {
            const totalExp = parseInt(m.totalExperience.split(' ')[0]);
            return totalExp >= minYears;
          });
        }
        
        result = members;
        break;

      case 'getProjectTeam':
        // Get team composition for a specific project
        const { complexity, projectType, features } = filters;
        
        const designers = getDesignersForProject(complexity, projectType);
        const contactPerson = getContactPersonForProject(projectType);
        
        // Get developers if needed
        let developers = [];
        if (features && features.includes('backend') || features.includes('api')) {
          developers = getTeamMembersByRole('Developer');
        }
        
        // Get QA if needed
        let qa = [];
        if (complexity === 'high') {
          qa = getTeamMembersByRole('QA');
        }
        
        result = {
          designers,
          developers,
          qa,
          contactPerson,
          projectManager: contactPerson
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 1
    });

  } catch (error) {
    console.error('Team API POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
