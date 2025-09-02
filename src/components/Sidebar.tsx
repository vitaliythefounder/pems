import React, { useState } from 'react';
import { Plus, Settings, Home, Target, Calendar, Archive } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  selectedProject?: string;
  onProjectSelect: (projectId?: string) => void;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
  onAddProject,
}) => {
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject({
        name: newProjectName.trim(),
        description: '',
        color: newProjectColor,
        isActive: true,
      });
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  const projectColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          <button
            onClick={() => onProjectSelect(undefined)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              !selectedProject
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
            <Target className="w-5 h-5" />
            <span className="font-medium">All Ideas</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Tasks</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
            <Archive className="w-5 h-5" />
            <span className="font-medium">Archived</span>
          </button>
        </nav>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
            <button
              onClick={() => setShowAddProject(true)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {showAddProject && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="input mb-3"
                onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
              />
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  {projectColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewProjectColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newProjectColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleAddProject}
                  className="btn btn-primary text-sm px-3 py-1"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddProject(false)}
                  className="btn btn-secondary text-sm px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedProject === project.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: project.color }}
                />
                <span className="font-medium truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
