import React, { useState } from 'react';
import { AppState, Idea, Project, Task } from '../types';
import { calculateDashboardStats, filterIdeas, sortIdeas } from '../utils/helpers';
import DashboardStats from './DashboardStats';
import IdeasGrid from './IdeasGrid';
import TasksList from './TasksList';
import ProjectsOverview from './ProjectsOverview';
import AddIdeaModal from './AddIdeaModal';
import AddTaskModal from './AddTaskModal';

interface DashboardProps {
  state: AppState;
  onAddIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIdea: (id: string, updates: Partial<Idea>) => void;
  onDeleteIdea: (id: string) => void;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onSearchChange: (searchTerm: string) => void;
  onFiltersChange: (filters: AppState['filters']) => void;
  onProjectSelect: (projectId?: string) => void;
  onIdeaSelect: (ideaId?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  state,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSearchChange,
  onFiltersChange,
  onProjectSelect,
  onIdeaSelect,
}) => {
  const [showAddIdeaModal, setShowAddIdeaModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ideas' | 'tasks' | 'projects'>('overview');

  const stats = calculateDashboardStats(state.ideas, state.projects, state.tasks);
  
  const filteredIdeas = filterIdeas(state.ideas, {
    ...state.filters,
    searchTerm: state.searchTerm,
    projectId: state.selectedProject,
  });
  
  const sortedIdeas = sortIdeas(filteredIdeas, 'priority');
  
  const projectTasks = state.tasks.filter(task => 
    task.projectId === state.selectedProject || !state.selectedProject
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {state.selectedProject 
              ? state.projects.find(p => p.id === state.selectedProject)?.name || 'Project'
              : 'Dashboard'
            }
          </h1>
          <p className="text-gray-600">
            {state.selectedProject 
              ? 'Project overview and management'
              : 'Your ideas, projects, and tasks at a glance'
            }
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="btn btn-secondary"
          >
            Add Task
          </button>
          <button
            onClick={() => setShowAddIdeaModal(true)}
            className="btn btn-primary"
          >
            Add Idea
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ideas', label: 'Ideas' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'projects', label: 'Projects' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Ideas</h3>
                <IdeasGrid
                  ideas={sortedIdeas.slice(0, 6)}
                  projects={state.projects}
                  onUpdateIdea={onUpdateIdea}
                  onDeleteIdea={onDeleteIdea}
                  onIdeaSelect={onIdeaSelect}
                  compact
                />
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h3>
                <ProjectsOverview
                  projects={state.projects.filter(p => p.isActive)}
                  ideas={state.ideas}
                  tasks={state.tasks}
                  onProjectSelect={onProjectSelect}
                  onUpdateProject={onUpdateProject}
                  onDeleteProject={onDeleteProject}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
                <TasksList
                  tasks={projectTasks.filter(t => t.status !== 'completed').slice(0, 8)}
                  ideas={state.ideas}
                  projects={state.projects}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  compact
                />
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddIdeaModal(true)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Capture New Idea</div>
                    <div className="text-sm text-gray-500">Quickly add a new idea to your vault</div>
                  </button>
                  
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Create Task</div>
                    <div className="text-sm text-gray-500">Convert an idea into actionable task</div>
                  </button>
                  
                  <button
                    onClick={() => onProjectSelect(undefined)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">View All Ideas</div>
                    <div className="text-sm text-gray-500">Browse your complete ideas collection</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">All Ideas</h3>
              <div className="flex space-x-3">
                <select
                  className="input w-auto"
                  onChange={(e) => onFiltersChange({ ...state.filters, type: e.target.value as any || undefined })}
                  value={state.filters.type || ''}
                >
                  <option value="">All Types</option>
                  <option value="tech-app">Tech App</option>
                  <option value="web-app">Web App</option>
                  <option value="physical-business">Physical Business</option>
                  <option value="service-business">Service Business</option>
                  <option value="automation">Automation</option>
                  <option value="marketing">Marketing</option>
                  <option value="content">Content</option>
                  <option value="general">General</option>
                </select>
                
                <select
                  className="input w-auto"
                  onChange={(e) => onFiltersChange({ ...state.filters, priority: e.target.value as any || undefined })}
                  value={state.filters.priority || ''}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <IdeasGrid
              ideas={sortedIdeas}
              projects={state.projects}
              onUpdateIdea={onUpdateIdea}
              onDeleteIdea={onDeleteIdea}
              onIdeaSelect={onIdeaSelect}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
              <div className="flex space-x-3">
                <select
                  className="input w-auto"
                  onChange={(e) => onFiltersChange({ ...state.filters, status: e.target.value as any || undefined })}
                  value={state.filters.status || ''}
                >
                  <option value="">All Status</option>
                  <option value="backlog">Backlog</option>
                  <option value="research">Research</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <TasksList
              tasks={projectTasks}
              ideas={state.ideas}
              projects={state.projects}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">All Projects</h3>
            <ProjectsOverview
              projects={state.projects}
              ideas={state.ideas}
              tasks={state.tasks}
              onProjectSelect={onProjectSelect}
              onUpdateProject={onUpdateProject}
              onDeleteProject={onDeleteProject}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddIdeaModal && (
        <AddIdeaModal
          projects={state.projects}
          onAddIdea={onAddIdea}
          onClose={() => setShowAddIdeaModal(false)}
        />
      )}

      {showAddTaskModal && (
        <AddTaskModal
          ideas={state.ideas}
          projects={state.projects}
          onAddTask={onAddTask}
          onClose={() => setShowAddTaskModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
