import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

interface TeamMember {
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

function parseCSV(filePath: string): any[] {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function mergeTeamData(): TeamMember[] {
  console.log('🔄 Starting team data merge...');
  
  // Parse Org Chart (main team structure)
  const orgChartData = parseCSV('src/data/Design Goals for Performance management - Org chart.csv');
  console.log(`📊 Org Chart: ${orgChartData.length} people`);
  
  // Parse Goals DB (goals and performance data)
  const goalsData = parseCSV('src/data/Design Goals for Performance management - Goals DB.csv');
  console.log(`📊 Goals DB: ${goalsData.length} goals`);
  
  // Create comprehensive team members
  const teamMembers: TeamMember[] = [];
  let idCounter = 1;
  
  for (const person of orgChartData) {
    const fullName = person['Full Name'] || person['Name'] || '';
    if (!fullName) continue;
    
    // Find goals for this person
    const personGoals = goalsData.filter(goal => 
      goal.Name && goal.Name.toLowerCase().includes(fullName.toLowerCase())
    );
    
    // Parse experience dates
    const experienceStarted = person['Experience Started'] || '';
    const joinedCieden = person['Joined Cieden'] || '';
    const inCieden = person['In Cieden'] || '';
    
    // Calculate total experience
    let totalExperience = '';
    if (experienceStarted) {
      try {
        const startDate = new Date(experienceStarted);
        const now = new Date();
        const years = now.getFullYear() - startDate.getFullYear();
        totalExperience = `${years} years`;
      } catch (e) {
        totalExperience = 'Unknown';
      }
    }
    
    const teamMember: TeamMember = {
      id: (idCounter++).toString(),
      fullName: fullName.trim(),
      department: person['Department'] || 'Unknown',
      role: person['Role'] || 'Unknown',
      leader: person['Leader'] || 'Unknown',
      access: person['Access'] || 'Employee',
      email: person['Email'] || '',
      cv: person['CV'] || '',
      seniority: person['Seniority'] || 'Unknown',
      industries: person['Industries'] ? person['Industries'].split(',').map(i => i.trim()) : [],
      linkedin: person['LinkedIn'] || '',
      experienceStarted,
      joinedCieden,
      inCieden,
      totalExperience,
      englishLevel: person['English'] || 'Unknown',
      goals: personGoals.map((goal, index) => ({
        id: `g${idCounter}_${index}`,
        name: fullName,
        goalType: goal['Goal type'] || 'Unknown',
        goalName: goal['Goal name'] || 'Unknown',
        goalDescription: goal['Goal description'] || '',
        link: goal['Link'] || '',
        tags: goal['Tag'] ? goal['Tag'].split(',').map(t => t.trim()) : []
      }))
    };
    
    teamMembers.push(teamMember);
  }
  
  console.log(`🎉 Total team members: ${teamMembers.length}`);
  return teamMembers;
}

function saveTeamData(teamMembers: TeamMember[]) {
  const outputPath = 'src/data/comprehensive-team-data.json';
  const data = {
    lastUpdated: new Date().toISOString(),
    totalMembers: teamMembers.length,
    departments: Array.from(new Set(teamMembers.map(m => m.department))),
    roles: Array.from(new Set(teamMembers.map(m => m.role))),
    seniorityLevels: Array.from(new Set(teamMembers.map(m => m.seniority))),
    members: teamMembers
  };
  
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 Saved to ${outputPath}`);
}

// Run merge
const teamMembers = mergeTeamData();
saveTeamData(teamMembers);

export { mergeTeamData, saveTeamData };
