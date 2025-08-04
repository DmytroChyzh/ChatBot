import React from 'react';
import ProjectCard from './ProjectCard';

interface ProjectSidebarProps {
  projectData: any;
  onComplete: () => void;
  wide?: boolean;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projectData, onComplete, wide }) => (
  <div
    className={
      `${wide ? 'w-[440px] min-w-[360px] max-w-[440px]' : 'w-80'} h-screen flex-shrink-0 transition-all duration-300 bg-[#F7F8F9] dark:bg-[#18181C] shadow-2xl border-l border-gray-600/50 flex flex-col`
    }
  >
    <div
      className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-sidebar-scrollbar"
      style={{ maxHeight: '100vh' }}
    >
      <ProjectCard 
        projectData={projectData}
        onComplete={onComplete}
      />
    </div>
  </div>
);

export default ProjectSidebar; 