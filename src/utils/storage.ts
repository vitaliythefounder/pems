import { Idea, Project, Task } from '../types';

const STORAGE_KEYS = {
  IDEAS: 'pims_ideas',
  PROJECTS: 'pims_projects',
  TASKS: 'pims_tasks',
  SETTINGS: 'pims_settings',
};

export const storage = {
  // Ideas
  getIdeas: (): Idea[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IDEAS);
      if (!data) return [];
      const ideas = JSON.parse(data);
      return ideas.map((idea: any) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
        dueDate: idea.dueDate ? new Date(idea.dueDate) : undefined,
      }));
    } catch (error) {
      console.error('Error loading ideas:', error);
      return [];
    }
  },

  saveIdeas: (ideas: Idea[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
    } catch (error) {
      console.error('Error saving ideas:', error);
    }
  },

  // Projects
  getProjects: (): Project[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) return [];
      const projects = JSON.parse(data);
      return projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  },

  saveProjects: (projects: Project[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  },

  // Tasks
  getTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) return [];
      const tasks = JSON.parse(data);
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  saveTasks: (tasks: Task[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  // Settings
  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  },

  saveSettings: (settings: any): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Clear all data
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
