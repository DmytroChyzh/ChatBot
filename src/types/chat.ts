export type MessageRole = 'user' | 'assistant';

export type ConversationType = 'general' | 'project' | 'estimate';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  suggestedAnswers?: string[];
}

export interface ProjectEstimate {
  currentRange: { min: number; max: number };
  initialRange: { min: number; max: number };
  currency: string;
  confidence: 'low' | 'medium' | 'high';
  estimatedAt: Date;
  timeline: string;
  team: {
    designers: string[];
    contactPerson: string;
    contactEmail: string;
  };
  phases: {
    'ux-research': string;
    'ui-design': string;
    'prototyping': string;
    'design-system': string;
    'mobile-adaptive': string;
  };
  phaseDescriptions?: {
    'ux-research': string;
    'ui-design': string;
    'prototyping': string;
    'design-system': string;
    'mobile-adaptive': string;
  };
  accuracyPercentage?: number; // Додаємо точність для відображення
}

// Нові типи для розширеної функціональності
export interface ProjectSummary {
  id: string;
  content: string;
  generatedAt: Date;
  model: string; // 'gpt-4' | 'llama' | etc.
}

export interface PhaseEstimate {
  phase: 'ux-research' | 'ui-design' | 'prototyping' | 'design-system' | 'mobile-adaptive';
  estimatedHours: number;
  estimatedCost: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProjectEstimates {
  id: string;
  phases: PhaseEstimate[];
  totalHours: number;
  totalCost: number;
  currentRange?: string;
  timeline?: string;
  teamSize?: number;
  currency?: string;
  generatedAt: Date;
  model: string;
}

export interface ResearchHighlights {
  id: string;
  source: string; // URL або джерело
  highlights: string[];
  insights: string;
  generatedAt: Date;
  model: string;
}

export interface SessionMetadata {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'active' | 'completed' | 'archived';
  startedAt: Date;
  completedAt?: Date;
  totalMessages: number;
  lastActivity: Date;
}

export interface ProjectCardField<T = string | string[]> {
  value: T;
  status: 'draft' | 'final';
}

export interface ProjectCardState {
  projectName?: ProjectCardField;
  projectType?: ProjectCardField;
  description?: ProjectCardField;
  targetAudience?: ProjectCardField;
  features?: ProjectCardField<string[]>;
  budget?: ProjectCardField;
  timeline?: ProjectCardField;
  competitors?: ProjectCardField<string[]>;
  website?: ProjectCardField;
  // Проміжні дані для воркерів
  summary?: ProjectSummary;
  estimates?: ProjectEstimates;
  research?: ResearchHighlights[];
  // Статуси воркерів
  workerStatus: {
    summarizer: 'idle' | 'running' | 'completed' | 'error';
    estimator: 'idle' | 'running' | 'completed' | 'error';
    researcher: 'idle' | 'running' | 'completed' | 'error';
  };
  // Додаткові поля для розширення
  notes?: string;
  history?: Array<{ field: string; oldValue: any; newValue: any; timestamp: Date }>;
}

export interface Chat {
  id: string;
  userId: string;
  messages: Message[];
  projectEstimate?: ProjectEstimate;
  createdAt: Date;
  updatedAt: Date;
}

// Новий тип для швидкого естімейту
export interface QuickEstimate {
  totalRange: { min: number; max: number };
  phases: {
    discovery: { min: number; max: number; description: string };
    design: { min: number; max: number; description: string };
    development: { min: number; max: number; description: string };
    testing: { min: number; max: number; description: string };
  };
  currency: string;
  confidence: 'low' | 'medium' | 'high';
  estimatedAt: Date;
}

// Новий тип для повної сесії
export interface ChatSession {
  id: string;
  metadata: SessionMetadata;
  messages: Message[];
  projectCard: ProjectCardState;
  conversationType: ConversationType;
  quickEstimate?: QuickEstimate;
  projectEstimate?: ProjectEstimate; // НОВЕ ПОЛЕ
  estimateStep: number;
  createdAt: Date;
  updatedAt: Date;
} 