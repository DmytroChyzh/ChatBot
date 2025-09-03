export interface TeamMember {
  id: string;
  fullName: string;
  department: string;
  role: string;
  leader: string;
  access: 'Employee' | 'Manager' | 'CEO' | 'Admin';
  email: string;
  cv?: string;
  seniority: 'Junior' | 'Middle' | 'Senior' | 'Lead' | 'Principal';
  industries: string[];
  linkedin?: string;
  experienceStarted: string; // Date when started working in industry
  joinedCieden: string; // Date when joined Cieden
  inCieden: string; // Experience in Cieden
  totalExperience: string; // Total industry experience
  englishLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  goals?: TeamGoal[];
}

export interface TeamGoal {
  id: string;
  name: string;
  goalType: 'Book' | 'Work' | 'English' | 'Course' | 'Matrix' | 'Other';
  goalName: string;
  goalDescription: string;
  link?: string;
  tags: string[];
}

export interface TeamSearchQuery {
  query: string;
  filters?: {
    department?: string;
    seniority?: string;
    englishLevel?: string;
    industries?: string[];
  };
}

export interface TeamSearchResult {
  members: TeamMember[];
  total: number;
  query: string;
  suggestions?: string[];
}
