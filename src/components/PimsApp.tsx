import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import { ideasAPI, projectsAPI, tasksAPI } from '../services/api';
import { storage } from '../utils/storage';
import { AppState, Idea, Project, Task } from '../types';

interface PimsAppProps {
  platformUser: any;
  onBackToPlatform: () => void;
}

const PimsApp: React.FC<PimsAppProps> = ({ platformUser, onBackToPlatform }) => {
  const [state, setState] = useState<AppState>({
    ideas: [],
    projects: [],
    tasks: [],
    selectedProject: undefined,
    selectedIdea: undefined,
    searchTerm: '',
    filters: {},
  });

  // Load data from API when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading PIMS data for platform user:', platformUser);
        
        const [ideasResponse, projectsResponse, tasksResponse] = await Promise.all([
          ideasAPI.getAll(),
          projectsAPI.getAll(),
          tasksAPI.getAll()
        ]);
        
        console.log('PIMS API responses:', { ideasResponse, projectsResponse, tasksResponse });
        
        setState(prev => ({
          ...prev,
          ideas: ideasResponse.ideas || [],
          projects: projectsResponse.projects || [],
          tasks: tasksResponse.tasks || [],
        }));
        
        console.log('PIMS state updated with API data');
      } catch (error) {
        console.error('Error loading PIMS data:', error);
        // Fallback to local storage if API fails
        const ideas = storage.getIdeas();
        const projects = storage.getProjects();
        const tasks = storage.getTasks();
        
        setState(prev => ({
          ...prev,
          ideas,
          projects,
          tasks,
        }));
        
        console.log('PIMS fallback to local storage data');
      }
    };
    
    loadData();
  }, [platformUser]);

  // CRUD Operations
  const addIdea = async (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await ideasAPI.create(idea);
      setState(prev => ({
        ...prev,
        ideas: [...prev.ideas, response.idea],
      }));
    } catch (error) {
      console.error('Error creating idea:', error);
      // Fallback to local storage
      const newIdea: Idea = {
        ...idea,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setState(prev => ({
        ...prev,
        ideas: [...prev.ideas, newIdea],
      }));
    }
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    try {
      await ideasAPI.update(id, updates);
      setState(prev => ({
        ...prev,
        ideas: prev.ideas.map(idea => 
          idea.id === id ? { ...idea, ...updates, updatedAt: new Date() } : idea
        ),
      }));
    } catch (error) {
      console.error('Error updating idea:', error);
      // Still update local state even if API fails
      setState(prev => ({
        ...prev,
        ideas: prev.ideas.map(idea => 
          idea.id === id ? { ...idea, ...updates, updatedAt: new Date() } : idea
        ),
      }));
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      await ideasAPI.delete(id);
      setState(prev => ({
        ...prev,
        ideas: prev.ideas.filter(idea => idea.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting idea:', error);
      // Still remove from local state even if API fails
      setState(prev => ({
        ...prev,
        ideas: prev.ideas.filter(idea => idea.id !== id),
      }));
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await projectsAPI.create(project);
      setState(prev => ({
        ...prev,
        projects: [...prev.projects, response.project],
      }));
    } catch (error) {
      console.error('Error creating project:', error);
      // Fallback to local storage
      const newProject: Project = {
        ...project,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setState(prev => ({
        ...prev,
        projects: [...prev.projects, newProject],
      }));
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await projectsAPI.update(id, updates);
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(project => 
          project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
        ),
      }));
    } catch (error) {
      console.error('Error updating project:', error);
      // Still update local state even if API fails
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(project => 
          project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
        ),
      }));
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectsAPI.delete(id);
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(project => project.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting project:', error);
      // Still remove from local state even if API fails
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(project => project.id !== id),
      }));
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await tasksAPI.create(task);
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, response.task],
      }));
    } catch (error) {
      console.error('Error creating task:', error);
      // Fallback to local storage
      const newTask: Task = {
        ...task,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await tasksAPI.update(id, updates);
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      // Still update local state even if API fails
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
        ),
      }));
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksAPI.delete(id);
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      // Still remove from local state even if API fails
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
      }));
    }
  };

  // State setters
  const setSearchTerm = (searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
  };

  const setFilters = (filters: AppState['filters']) => {
    setState(prev => ({ ...prev, filters }));
  };

  const setSelectedProject = (projectId?: string) => {
    setState(prev => ({ ...prev, selectedProject: projectId }));
  };

  const setSelectedIdea = (ideaId?: string) => {
    setState(prev => ({ ...prev, selectedIdea: ideaId }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Platform Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToPlatform}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Platform</span>
            </button>
            
            <div className="w-px h-6 bg-gray-300"></div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">PIMS</h1>
                <p className="text-sm text-gray-500">Personal Ideas Management System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Platform User:</span>
            <span className="font-medium">{platformUser.firstName} {platformUser.lastName}</span>
          </div>
        </div>
      </div>

      {/* PIMS Content */}
      <div className="flex">
        <Sidebar
          projects={state.projects}
          selectedProject={state.selectedProject}
          onProjectSelect={setSelectedProject}
          onAddProject={addProject}
        />
        <main className="flex-1 p-6">
          <Dashboard
            state={state}
            onAddIdea={addIdea}
            onUpdateIdea={updateIdea}
            onDeleteIdea={deleteIdea}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onSearchChange={setSearchTerm}
            onFiltersChange={setFilters}
            onProjectSelect={setSelectedProject}
            onIdeaSelect={setSelectedIdea}
          />
        </main>
      </div>
    </div>
  );
};

export default PimsApp;
