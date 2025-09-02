import React, { useState } from 'react';
import { Project, Idea, Task } from '../types';
import { getProjectColor } from '../utils/helpers';
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  Folder,
  Lightbulb,
  Target,
  Calendar,
  UserPlus
} from 'lucide-react';
import InviteUserModal from './InviteUserModal';

interface ProjectsOverviewProps {
  projects: Project[];
  ideas: Idea[];
  tasks: Task[];
  onProjectSelect: (projectId?: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({
  projects,
  ideas,
  tasks,
  onProjectSelect,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const getProjectStats = (projectId: string) => {
    const projectIdeas = ideas.filter(idea => idea.projectId === projectId);
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const activeTasks = projectTasks.filter(task => task.status !== 'completed').length;

    return {
      ideas: projectIdeas.length,
      tasks: projectTasks.length,
      completedTasks,
      activeTasks,
    };
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📁</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500">Create projects to organize your ideas and tasks</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const stats = getProjectStats(project.id);
        const projectColor = getProjectColor(project.id, projects);

        return (
          <div
            key={project.id}
            className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProjectSelect(project.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${projectColor}20` }}
                >
                  <Folder 
                    className="w-5 h-5" 
                    style={{ color: projectColor }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(showMenu === project.id ? null : project.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                
                {showMenu === project.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                        setShowMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setInviteModalOpen(true);
                        setShowMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Invite User</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                        setShowMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-lg font-bold">{stats.ideas}</span>
                </div>
                <p className="text-xs text-gray-600">Ideas</p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-lg font-bold">{stats.tasks}</span>
                </div>
                <p className="text-xs text-gray-600">Tasks</p>
              </div>
            </div>

            {/* Progress */}
            {stats.tasks > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{stats.completedTasks}/{stats.tasks} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: projectColor,
                      width: `${(stats.completedTasks / stats.tasks) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: projectColor }}
                />
                <span>{project.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      
      {inviteModalOpen && selectedProject && (
        <InviteUserModal
          project={selectedProject}
          onInvite={() => {
            // Handle invitation sent
            console.log('Invitation sent for project:', selectedProject.name);
          }}
          onClose={() => {
            setInviteModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectsOverview;
