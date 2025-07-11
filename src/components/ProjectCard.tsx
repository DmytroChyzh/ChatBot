import { useState, useEffect } from 'react';
import { ProjectCardState, ProjectCardField } from '../types/chat';
import { CheckCircle, Clock, Info, Users, Globe, DollarSign, Calendar, List, Award, Link2 } from 'lucide-react';

interface ProjectCardProps {
  projectData: ProjectCardState;
  workerStatus: {
    summarizer: 'idle' | 'running' | 'completed' | 'error';
    estimator: 'idle' | 'running' | 'completed' | 'error';
    researcher: 'idle' | 'running' | 'completed' | 'error';
  };
  onComplete: () => void;
  onConfirmField?: (field: keyof ProjectCardState) => void;
}

const FIELD_CONFIG: Array<{
  key: keyof ProjectCardState;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: 'projectName', label: 'Назва проєкту', icon: <Award className="w-5 h-5 text-accent" /> },
  { key: 'projectType', label: 'Тип проєкту', icon: <Info className="w-5 h-5 text-accent" /> },
  { key: 'description', label: 'Опис', icon: <List className="w-5 h-5 text-accent" /> },
  { key: 'targetAudience', label: 'Цільова аудиторія', icon: <Users className="w-5 h-5 text-accent" /> },
  { key: 'features', label: 'Функціонал', icon: <CheckCircle className="w-5 h-5 text-accent" /> },
  { key: 'budget', label: 'Бюджет', icon: <DollarSign className="w-5 h-5 text-accent" /> },
  { key: 'timeline', label: 'Термін', icon: <Calendar className="w-5 h-5 text-accent" /> },
  { key: 'competitors', label: 'Конкуренти', icon: <Users className="w-5 h-5 text-accent" /> },
  { key: 'website', label: 'Вебсайт', icon: <Globe className="w-5 h-5 text-accent" /> },
];

function isProjectCardField(obj: any): obj is ProjectCardField<any> {
  return obj && typeof obj === 'object' && 'value' in obj && 'status' in obj;
}

export default function ProjectCard({ projectData, workerStatus, onComplete, onConfirmField }: ProjectCardProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const fields = FIELD_CONFIG.map(f => projectData[f.key]);
    const filledFields = fields.filter((field, idx) => {
      if (!field) return false;
      if (isProjectCardField(field)) {
        const value = field.value;
        if ((idx === 4 || idx === 7) && Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        return false;
      }
      if (typeof field === 'string') return field.trim() !== '';
      return false;
    }).length;
    const percentage = Math.round((filledFields / fields.length) * 100);
    setCompletionPercentage(percentage);
    if (percentage >= 80) onComplete();
  }, [projectData, onComplete]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/90 dark:bg-[#23232B]/90 rounded-3xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 p-8 flex flex-col gap-8 transition-colors duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#8B5CF6] to-[#6030FE] flex items-center justify-center text-white font-bold text-3xl rounded-2xl shadow-lg">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">Проєкт</h2>
          <p className="text-base text-[#8B5CF6] font-medium">Live-картка</p>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-base font-semibold text-gray-700 dark:text-gray-200">Заповненість</span>
          <span className="text-base font-bold text-[#8B5CF6]">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
          <div 
            className="h-3 transition-all duration-500 bg-gradient-to-r from-[#8B5CF6] to-[#6030FE] rounded-full"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      {/* Worker Status */}
      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-4 h-4 text-accent" /> Summary:
          <span className={getStatusColor(workerStatus.summarizer)}>{workerStatus.summarizer}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <List className="w-4 h-4 text-accent" /> Estimates:
          <span className={getStatusColor(workerStatus.estimator)}>{workerStatus.estimator}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-4 h-4 text-accent" /> Research:
          <span className={getStatusColor(workerStatus.researcher)}>{workerStatus.researcher}</span>
        </div>
      </div>
      {/* Fields */}
      <div className="flex flex-col gap-4">
        {FIELD_CONFIG.map(({ key, label, icon }) => {
          const data = projectData[key];
          return (
            <div key={key} className={`flex flex-col gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#23232B]/70 shadow-sm transition-all duration-300 ${isProjectCardField(data) && data.status === 'draft' ? 'ring-2 ring-yellow-400/60' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                {isProjectCardField(data) && data.status === 'draft' && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">Чернетка</span>
                )}
                {isProjectCardField(data) && data.status === 'final' && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">Підтверджено</span>
                )}
              </div>
              <div className="text-base text-gray-900 dark:text-white min-h-[24px] break-words whitespace-pre-line">
                {isProjectCardField(data) ? (
                  Array.isArray(data.value)
                    ? (data.value.length > 0 ? data.value.join(', ') : <span className="text-muted-foreground italic">Чекаємо інформацію...</span>)
                    : (typeof data.value === 'string' && data.value.trim() !== '' ? data.value : <span className="text-muted-foreground italic">Чекаємо інформацію...</span>)
                ) : <span className="text-muted-foreground italic">Чекаємо інформацію...</span>}
              </div>
              {isProjectCardField(data) && data.status === 'draft' && onConfirmField && (
                <button
                  className="mt-2 px-3 py-1 text-xs rounded bg-accent text-white hover:bg-accent/80 transition"
                  onClick={() => onConfirmField(key)}
                >Підтвердити</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 