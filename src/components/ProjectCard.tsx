import { useState, useEffect } from 'react';
import { ProjectCardState, ProjectCardField } from '../types/chat';
import { CheckCircle, Info, Users, Globe, DollarSign, Calendar, List, Award } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectCardProps {
  projectData: ProjectCardState;
  onComplete: () => void;
  onConfirmField?: (field: keyof ProjectCardState) => void;
  onUpdateField?: (field: keyof ProjectCardState, value: any) => void;
  onSaveProject?: () => void;
}

const FIELD_CONFIG: Array<{
  key: keyof ProjectCardState;
  labelKey: string;
  icon: React.ReactNode;
}> = [
  { key: 'projectName', labelKey: 'projectCard.projectName', icon: <Award className="w-5 h-5 text-accent" /> },
  { key: 'projectType', labelKey: 'projectCard.projectType', icon: <Info className="w-5 h-5 text-accent" /> },
  { key: 'description', labelKey: 'projectCard.description', icon: <List className="w-5 h-5 text-accent" /> },
  { key: 'targetAudience', labelKey: 'projectCard.targetAudience', icon: <Users className="w-5 h-5 text-accent" /> },
  { key: 'features', labelKey: 'projectCard.features', icon: <CheckCircle className="w-5 h-5 text-accent" /> },
  { key: 'budget', labelKey: 'projectCard.budget', icon: <DollarSign className="w-5 h-5 text-accent" /> },
  { key: 'timeline', labelKey: 'projectCard.timeline', icon: <Calendar className="w-5 h-5 text-accent" /> },
  { key: 'competitors', labelKey: 'projectCard.competitors', icon: <Users className="w-5 h-5 text-accent" /> },
  { key: 'website', labelKey: 'projectCard.website', icon: <Globe className="w-5 h-5 text-accent" /> },
];

function isProjectCardField(obj: any): obj is ProjectCardField<any> {
  return obj && typeof obj === 'object' && 'value' in obj && 'status' in obj;
}

export default function ProjectCard({ projectData, onComplete, onConfirmField, onUpdateField, onSaveProject }: ProjectCardProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [editingField, setEditingField] = useState<keyof ProjectCardState | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { t } = useLanguage();

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

  // Show highlight for new or updated fields with smart logic
  const shouldHighlight = (fieldKey: keyof ProjectCardState) => {
    const field = projectData[fieldKey];
    if (!isProjectCardField(field)) return false;
    
    // Show highlight for draft status (new data)
    if (field.status === 'draft') {
      // Additional check: only highlight if the field has meaningful content
      if (Array.isArray(field.value)) {
        return field.value.length > 0 && field.value.some(item => item.trim().length > 0);
      } else if (typeof field.value === 'string') {
        return field.value.trim().length > 0;
      }
    }
    
    return false;
  };

  // Start editing a field
  const startEditing = (fieldKey: keyof ProjectCardState) => {
    const field = projectData[fieldKey];
    if (isProjectCardField(field)) {
      setEditingField(fieldKey);
      if (Array.isArray(field.value)) {
        setEditValue(field.value.join(', '));
      } else {
        setEditValue(field.value.toString());
      }
    }
  };

  // Save edited field
  const saveEdit = () => {
    if (editingField && onUpdateField) {
      const field = projectData[editingField];
      if (isProjectCardField(field)) {
        let newValue: any;
        if (editingField === 'features' || editingField === 'competitors') {
          newValue = editValue.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          newValue = editValue.trim();
        }
        
        onUpdateField(editingField, {
          value: newValue,
          status: 'final'
        });
      }
    }
    setEditingField(null);
    setEditValue('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };



  return (
    <div className="w-full max-w-2xl mx-auto bg-white/90 dark:bg-[#23232B]/90 rounded-3xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-8 flex flex-col gap-8 transition-colors duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#8B5CF6] to-[#6030FE] flex items-center justify-center text-white font-bold text-3xl rounded-2xl shadow-md">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">{t('projectCard.title')}</h2>
          <p className="text-base text-[#8B5CF6] font-medium">{t('projectCard.subtitle')}</p>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-base font-semibold text-gray-700 dark:text-gray-200">{t('projectCard.completion')}</span>
          <span className="text-base font-bold text-[#8B5CF6]">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
          <div 
            className="h-3 transition-all duration-500 bg-gradient-to-r from-[#8B5CF6] to-[#6030FE] rounded-full"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        {FIELD_CONFIG.map(({ key, labelKey, icon }) => {
          const data = projectData[key];
          return (
            <div key={key} className={`flex flex-col gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#23232B]/70 shadow-sm transition-all duration-300 ${shouldHighlight(key) ? 'ring-2 ring-yellow-400/60 bg-yellow-50/50 dark:bg-yellow-900/20' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t(labelKey)}</span>
                {isProjectCardField(data) && data.status === 'draft' && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">{t('projectCard.draft')}</span>
                )}
                {isProjectCardField(data) && data.status === 'final' && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">{t('projectCard.confirmed')}</span>
                )}
              </div>
              <div className="text-base text-gray-900 dark:text-white min-h-[24px] break-words whitespace-pre-line">
                {editingField === key ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      rows={3}
                      placeholder={t('projectCard.editPlaceholder')}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition"
                      >
                        {t('projectCard.save')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600 transition"
                      >
                        {t('projectCard.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <div className="flex-1">
                      {isProjectCardField(data) ? (
                        Array.isArray(data.value)
                          ? (data.value.length > 0 ? data.value.join(', ') : <span className="text-muted-foreground italic">{t('projectCard.waitingForInfo')}</span>)
                          : (typeof data.value === 'string' && data.value.trim() !== '' ? data.value : <span className="text-muted-foreground italic">{t('projectCard.waitingForInfo')}</span>)
                      ) : <span className="text-muted-foreground italic">{t('projectCard.waitingForInfo')}</span>}
                    </div>
                    {isProjectCardField(data) && data.value && (
                      <button
                        onClick={() => startEditing(key)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('projectCard.edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isProjectCardField(data) && data.status === 'draft' && onConfirmField && (
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition"
                    onClick={() => onConfirmField(key)}
                  >
                    {t('projectCard.confirm')}
                  </button>
                  <button
                    className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600 transition"
                    onClick={() => {
                      // Remove the field if user doesn't confirm it
                      if (onConfirmField) {
                        // We'll need to add a remove function to props
                        console.log('Field rejected:', key);
                      }
                    }}
                  >
                    {t('projectCard.reject')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Project Button */}
      {completionPercentage >= 80 && onSaveProject && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              {t('projectCard.completionMessage')}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300 mb-4">
              {t('projectCard.completionDescription')}
            </p>
            <button
              onClick={onSaveProject}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {t('projectCard.sendProject')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 