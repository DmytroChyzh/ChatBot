import React from 'react';
import { TeamMember, TeamGoal } from '../types/team';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
  Building2, 
  User, 
  Mail, 
  Linkedin, 
  FileText, 
  Target,
  Calendar,
  Globe,
  Award,
  ExternalLink
} from 'lucide-react';

interface TeamInfoProps {
  member: TeamMember;
  onClose: () => void;
}

const TeamInfo: React.FC<TeamInfoProps> = ({ member, onClose }) => {
  const { language } = useLanguage();

  const getSeniorityColor = (seniority: string) => {
    switch (seniority.toLowerCase()) {
      case 'junior': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'middle': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'senior': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'lead': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'principal': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getEnglishLevelColor = (level: string) => {
    switch (level) {
      case 'A1': case 'A2': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'B1': case 'B2': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'C1': case 'C2': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {member.fullName}
                </h2>
                <p className="text-white/80 text-sm">
                  {member.role} • {member.department}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Основна інформація */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'uk' ? 'Відділ' : 'Department'}
                </span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white">
                {member.department}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'uk' ? 'Керівник' : 'Leader'}
                </span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white">
                {member.leader}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'uk' ? 'Рівень' : 'Seniority'}
                </span>
              </div>
              <div className={`text-sm px-2 py-1 rounded-full inline-block ${getSeniorityColor(member.seniority)}`}>
                {member.seniority}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'uk' ? 'Англійська' : 'English'}
                </span>
              </div>
              <div className={`text-sm px-2 py-1 rounded-full inline-block ${getEnglishLevelColor(member.englishLevel)}`}>
                {member.englishLevel}
              </div>
            </div>
          </div>

          {/* Досвід */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {language === 'uk' ? 'Досвід роботи' : 'Work Experience'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {language === 'uk' ? 'Загальний:' : 'Total:'}
                </span>
                <div className="text-blue-800 dark:text-blue-200">{member.totalExperience}</div>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {language === 'uk' ? 'В Cieden:' : 'At Cieden:'}
                </span>
                <div className="text-blue-800 dark:text-blue-200">{member.inCieden}</div>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {language === 'uk' ? 'З:' : 'Since:'}
                </span>
                <div className="text-blue-800 dark:text-blue-200">{member.joinedCieden}</div>
              </div>
            </div>
          </div>

          {/* Індустрії */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'uk' ? 'Галузі досвіду' : 'Industry Experience'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {member.industries.map((industry, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>

          {/* Цілі та навички */}
          {member.goals && member.goals.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                {language === 'uk' ? 'Цілі та навички' : 'Goals & Skills'}
              </h3>
              <div className="space-y-3">
                {member.goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {goal.goalName}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {goal.goalType}
                        </p>
                      </div>
                      {goal.link && (
                        <a
                          href={goal.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {goal.goalDescription}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {goal.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Контакти */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'uk' ? 'Контакти' : 'Contacts'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900 dark:text-white">{member.email}</span>
              </div>
              {member.linkedin && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {member.cv && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <a
                    href={member.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:text-green-700 transition-colors"
                  >
                    {language === 'uk' ? 'Резюме' : 'CV'}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {language === 'uk' ? 'Закрити' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamInfo;
