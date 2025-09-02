import axios from 'axios';
import { Idea, Project, Task, AppState } from '../types';
import { 
  convertApiIdea, 
  convertApiProject, 
  convertApiTask,
  convertToApiIdea,
  convertToApiProject,
  convertToApiTask
} from '../utils/apiHelpers';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

// Ideas API
export const ideasAPI = {
  getAll: async (filters?: any) => {
    console.log('Making API call to /ideas with filters:', filters);
    const response = await api.get('/ideas', { params: filters });
    console.log('API response for ideas:', response.data);
    return {
      ...response.data,
      ideas: response.data.ideas?.map(convertApiIdea) || []
    };
  },
  convertToTask: async (ideaId: string, data: any) => {
    const response = await api.post(`/ideas/${ideaId}/convert-to-task`, data);
    return {
      ...response.data,
      task: convertApiTask(response.data.task)
    };
  },

  getById: async (id: string) => {
    const response = await api.get(`/ideas/${id}`);
    return {
      ...response.data,
      idea: convertApiIdea(response.data.idea)
    };
  },

  create: async (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
    const apiData = convertToApiIdea(ideaData);
    const response = await api.post('/ideas', apiData);
    return {
      ...response.data,
      idea: convertApiIdea(response.data.idea)
    };
  },

  update: async (id: string, ideaData: Partial<Idea>) => {
    const response = await api.put(`/ideas/${id}`, ideaData);
    return {
      ...response.data,
      idea: convertApiIdea(response.data.idea)
    };
  },

  delete: async (id: string) => {
    const response = await api.delete(`/ideas/${id}`);
    return response.data;
  },

  share: async (id: string, userId: string, permission: string) => {
    const response = await api.post(`/ideas/${id}/share`, { userId, permission });
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    const response = await api.get('/projects');
    return {
      ...response.data,
      projects: response.data.projects?.map(convertApiProject) || []
    };
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return {
      ...response.data,
      project: convertApiProject(response.data.project)
    };
  },

  create: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const apiData = convertToApiProject(projectData);
    const response = await api.post('/projects', apiData);
    return {
      ...response.data,
      project: convertApiProject(response.data.project)
    };
  },

  update: async (id: string, projectData: Partial<Project>) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return {
      ...response.data,
      project: convertApiProject(response.data.project)
    };
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  addMember: async (id: string, userId: string, role: string) => {
    const response = await api.post(`/projects/${id}/members`, { userId, role });
    return response.data;
  },

  removeMember: async (id: string, userId: string) => {
    const response = await api.delete(`/projects/${id}/members/${userId}`);
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getAll: async () => {
    const response = await api.get('/tasks');
    return {
      ...response.data,
      tasks: response.data.tasks?.map(convertApiTask) || []
    };
  },

  getById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return {
      ...response.data,
      task: convertApiTask(response.data.task)
    };
  },

  create: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const apiData = convertToApiTask(taskData);
    const response = await api.post('/tasks', apiData);
    return {
      ...response.data,
      task: convertApiTask(response.data.task)
    };
  },

  update: async (id: string, taskData: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return {
      ...response.data,
      task: convertApiTask(response.data.task)
    };
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await api.post(`/tasks/${id}/complete`);
    return {
      ...response.data,
      task: convertApiTask(response.data.task)
    };
  },

  addComment: async (id: string, content: string) => {
    const response = await api.post(`/tasks/${id}/comments`, { content });
    return {
      ...response.data,
      task: convertApiTask(response.data.task)
    };
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Invitations API
export const invitationsAPI = {
  sendInvitation: async (data: { email: string; projectId: string; role: string }) => {
    const response = await api.post('/invitations', data);
    return response.data;
  },
  
  checkInvitation: async (token: string) => {
    const response = await api.get(`/invitations/check/${token}`);
    return response.data;
  },
  
  acceptInvitation: async (token: string, userData: any) => {
    const response = await api.post(`/invitations/accept/${token}`, userData);
    return response.data;
  },
  
  getProjectInvitations: async (projectId: string) => {
    const response = await api.get(`/invitations/project/${projectId}`);
    return response.data;
  }
};

export default api;
