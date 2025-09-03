// Utility for reading XLSX files with estimation data
// Note: This will be used on the client side to read uploaded files

export interface EstimationData {
  projectType: string;
  complexity: string;
  minPrice: number;
  maxPrice: number;
  timeline: string;
  teamSize: number;
  features: string[];
  description: string;
}

export interface EstimationSheet {
  name: string;
  data: EstimationData[];
}

/**
 * Parse XLSX file and extract estimation data
 * This function will be called when user uploads an XLSX file
 */
export async function parseEstimationFile(file: File): Promise<EstimationSheet[]> {
  try {
    // Dynamic import to avoid bundling xlsx in main bundle
    const XLSX = await import('xlsx');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: EstimationSheet[] = [];
          
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Skip header row and process data
            const estimationData: EstimationData[] = [];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              if (row && row.length >= 6) {
                estimationData.push({
                  projectType: row[0] || '',
                  complexity: row[1] || '',
                  minPrice: parseFloat(row[2]) || 0,
                  maxPrice: parseFloat(row[3]) || 0,
                  timeline: row[4] || '',
                  teamSize: parseInt(row[5]) || 1,
                  features: row[6] ? row[6].split(',').map(f => f.trim()) : [],
                  description: row[7] || ''
                });
              }
            }
            
            if (estimationData.length > 0) {
              sheets.push({
                name: sheetName,
                data: estimationData
              });
            }
          });
          
          resolve(sheets);
        } catch (error) {
          reject(new Error(`Failed to parse XLSX file: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    throw new Error(`XLSX library not available: ${error}`);
  }
}

/**
 * Get estimation data for specific project type and complexity
 */
export function getEstimationForProject(
  sheets: EstimationSheet[],
  projectType: string,
  complexity: string
): EstimationData | null {
  for (const sheet of sheets) {
    const match = sheet.data.find(item => 
      item.projectType.toLowerCase().includes(projectType.toLowerCase()) &&
      item.complexity.toLowerCase() === complexity.toLowerCase()
    );
    
    if (match) return match;
  }
  
  // Fallback to default if no exact match
  for (const sheet of sheets) {
    const match = sheet.data.find(item => 
      item.projectType.toLowerCase().includes(projectType.toLowerCase())
    );
    
    if (match) return match;
  }
  
  return null;
}

/**
 * Get all available project types from sheets
 */
export function getAvailableProjectTypes(sheets: EstimationSheet[]): string[] {
  const types = new Set<string>();
  
  sheets.forEach(sheet => {
    sheet.data.forEach(item => {
      types.add(item.projectType);
    });
  });
  
  return Array.from(types);
}

/**
 * Get all available complexity levels
 */
export function getAvailableComplexityLevels(sheets: EstimationSheet[]): string[] {
  const levels = new Set<string>();
  
  sheets.forEach(sheet => {
    sheet.data.forEach(item => {
      levels.add(item.complexity);
    });
  });
  
  return Array.from(levels);
}
