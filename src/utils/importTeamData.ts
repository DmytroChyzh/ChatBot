import { TeamMember, TeamGoal } from '../types/team';

// Функція для конвертації CSV даних в наш формат
export const parseCSVToTeamData = (csvData: string): TeamMember[] => {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataLines = lines.slice(1);
  
  return dataLines.map((line, index) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const member: TeamMember = {
      id: `member-${index + 1}`,
      fullName: values[0] || '',
      department: values[1] || '',
      role: values[2] || '',
      leader: values[3] || '',
      access: (values[4] as any) || 'Employee',
      email: values[5] || '',
      cv: values[6] || undefined,
      seniority: (values[7] as any) || 'Middle',
      industries: values[8] ? values[8].split(';').map(i => i.trim()) : [],
      linkedin: values[9] || undefined,
      experienceStarted: values[10] || '',
      joinedCieden: values[11] || '',
      inCieden: values[12] || '',
      totalExperience: values[13] || '',
      englishLevel: (values[14] as any) || 'B1',
      goals: []
    };
    
    return member;
  });
};

// Функція для конвертації Excel даних (якщо потрібно)
export const parseExcelToTeamData = (excelData: any[]): TeamMember[] => {
  return excelData.map((row, index) => {
    const member: TeamMember = {
      id: `member-${index + 1}`,
      fullName: row['Full Name'] || row['Name'] || '',
      department: row['Department'] || '',
      role: row['Role'] || '',
      leader: row['Leader'] || '',
      access: (row['Access'] as any) || 'Employee',
      email: row['Email'] || '',
      cv: row['CV'] || undefined,
      seniority: (row['Seniority'] as any) || 'Middle',
      industries: row['Industries'] ? 
        (typeof row['Industries'] === 'string' ? 
          row['Industries'].split(';').map((i: string) => i.trim()) : 
          row['Industries']
        ) : [],
      linkedin: row['LinkedIn'] || undefined,
      experienceStarted: row['Experience Started'] || '',
      joinedCieden: row['Joined Cieden'] || '',
      inCieden: row['In Cieden'] || '',
      totalExperience: row['Total Experience'] || '',
      englishLevel: (row['English'] as any) || 'B1',
      goals: []
    };
    
    return member;
  });
};

// Функція для конвертації JSON даних
export const parseJSONToTeamData = (jsonData: any[]): TeamMember[] => {
  return jsonData.map((item, index) => {
    const member: TeamMember = {
      id: item.id || `member-${index + 1}`,
      fullName: item.fullName || item.name || '',
      department: item.department || '',
      role: item.role || '',
      leader: item.leader || '',
      access: (item.access as any) || 'Employee',
      email: item.email || '',
      cv: item.cv || undefined,
      seniority: (item.seniority as any) || 'Middle',
      industries: Array.isArray(item.industries) ? item.industries : [],
      linkedin: item.linkedin || undefined,
      experienceStarted: item.experienceStarted || '',
      joinedCieden: item.joinedCieden || '',
      inCieden: item.inCieden || '',
      totalExperience: item.totalExperience || '',
      englishLevel: (item.englishLevel as any) || 'B1',
      goals: Array.isArray(item.goals) ? item.goals : []
    };
    
    return member;
  });
};

// Функція для валідації даних
export const validateTeamData = (members: TeamMember[]): { valid: TeamMember[], invalid: any[] } => {
  const valid: TeamMember[] = [];
  const invalid: any[] = [];
  
  members.forEach((member, index) => {
    if (member.fullName && member.department && member.role) {
      valid.push(member);
    } else {
      invalid.push({ index, member, reason: 'Missing required fields' });
    }
  });
  
  return { valid, invalid };
};

// Функція для завантаження даних в Firestore (якщо потрібно)
export const uploadTeamDataToFirestore = async (members: TeamMember[]) => {
  // Тут буде логіка завантаження в Firestore
  // Поки що просто логуємо
  console.log('Uploading team data to Firestore:', members.length, 'members');
  
  // TODO: Implement Firestore upload
  // const batch = firestore.batch();
  // members.forEach(member => {
  //   const docRef = firestore.collection('team').doc(member.id);
  //   batch.set(docRef, member);
  // });
  // await batch.commit();
  
  return { success: true, count: members.length };
};

// Функція для експорту даних в різних форматах
export const exportTeamData = (members: TeamMember[], format: 'csv' | 'json' | 'excel') => {
  switch (format) {
    case 'csv':
      return exportToCSV(members);
    case 'json':
      return exportToJSON(members);
    case 'excel':
      return exportToExcel(members);
    default:
      return exportToJSON(members);
  }
};

const exportToCSV = (members: TeamMember[]): string => {
  const headers = [
    'Full Name', 'Department', 'Role', 'Leader', 'Access', 'Email',
    'CV', 'Seniority', 'Industries', 'LinkedIn', 'Experience Started',
    'Joined Cieden', 'In Cieden', 'Total Experience', 'English Level'
  ];
  
  const csvLines = [headers.join(',')];
  
  members.forEach(member => {
    const values = [
      member.fullName,
      member.department,
      member.role,
      member.leader,
      member.access,
      member.email,
      member.cv || '',
      member.seniority,
      member.industries.join(';'),
      member.linkedin || '',
      member.experienceStarted,
      member.joinedCieden,
      member.inCieden,
      member.totalExperience,
      member.englishLevel
    ];
    
    csvLines.push(values.map(v => `"${v}"`).join(','));
  });
  
  return csvLines.join('\n');
};

const exportToJSON = (members: TeamMember[]): string => {
  return JSON.stringify(members, null, 2);
};

const exportToExcel = (members: TeamMember[]): any[] => {
  return members.map(member => ({
    'Full Name': member.fullName,
    'Department': member.department,
    'Role': member.role,
    'Leader': member.leader,
    'Access': member.access,
    'Email': member.email,
    'CV': member.cv || '',
    'Seniority': member.seniority,
    'Industries': member.industries.join(';'),
    'LinkedIn': member.linkedin || '',
    'Experience Started': member.experienceStarted,
    'Joined Cieden': member.joinedCieden,
    'In Cieden': member.inCieden,
    'Total Experience': member.totalExperience,
    'English Level': member.englishLevel
  }));
};
