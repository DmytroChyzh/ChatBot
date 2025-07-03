import React from 'react';
import ProjectCard from './ProjectCard';

interface ProjectSidebarProps {
  projectData: any;
  workerStatus: any;
  onComplete: () => void;
  wide?: boolean;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projectData, workerStatus, onComplete, wide }) => (
  <div
    className={
      `${wide ? 'w-[440px] min-w-[400px]' : 'w-80'} h-screen flex-shrink-0 transition-all duration-300 bg-[#F7F8F9] dark:bg-[#18181C] shadow-2xl border-l border-gray-600/50 flex flex-col`
    }
  >
    <div
      className="flex-1 overflow-y-auto p-6 md:p-8 custom-sidebar-scrollbar"
      style={{ maxHeight: '100vh' }}
    >
      <ProjectCard 
        projectData={projectData}
        workerStatus={workerStatus}
        onComplete={onComplete}
      />
    </div>
  </div>
);

export default ProjectSidebar; 