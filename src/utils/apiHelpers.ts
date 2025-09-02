import { Idea, Project, Task } from '../types';

// Convert API response to frontend format
export const convertApiIdea = (apiIdea: any): Idea => ({
  id: apiIdea._id || apiIdea.id,
  title: apiIdea.title,
  description: apiIdea.description,
  type: apiIdea.type,
  priority: apiIdea.priority,
  status: apiIdea.status,
  projectId: apiIdea.project?._id || apiIdea.projectId,
  tags: apiIdea.tags || [],
  createdAt: new Date(apiIdea.createdAt),
  updatedAt: new Date(apiIdea.updatedAt),
  dueDate: apiIdea.dueDate ? new Date(apiIdea.dueDate) : undefined,
  notes: apiIdea.notes,
});

export const convertApiProject = (apiProject: any): Project => ({
  id: apiProject._id || apiProject.id,
  name: apiProject.name,
  description: apiProject.description,
  color: apiProject.color,
  createdAt: new Date(apiProject.createdAt),
  updatedAt: new Date(apiProject.updatedAt),
  isActive: apiProject.isActive !== false,
});

export const convertApiTask = (apiTask: any): Task => ({
  id: apiTask._id || apiTask.id,
  title: apiTask.title,
  description: apiTask.description,
  ideaId: apiTask.idea?._id || apiTask.ideaId,
  projectId: apiTask.project?._id || apiTask.projectId,
  priority: apiTask.priority,
  status: apiTask.status,
  dueDate: apiTask.dueDate ? new Date(apiTask.dueDate) : undefined,
  completedAt: apiTask.completedAt ? new Date(apiTask.completedAt) : undefined,
  createdAt: new Date(apiTask.createdAt),
  updatedAt: new Date(apiTask.updatedAt),
  notes: apiTask.notes,
});

// Convert frontend format to API format
export const convertToApiIdea = (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => ({
  title: idea.title,
  description: idea.description,
  type: idea.type,
  priority: idea.priority,
  status: idea.status,
  project: idea.projectId,
  tags: idea.tags,
  dueDate: idea.dueDate,
  notes: idea.notes,
});

export const convertToApiProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => ({
  name: project.name,
  description: project.description,
  color: project.color,
  isActive: project.isActive,
});

export const convertToApiTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => ({
  title: task.title,
  description: task.description,
  idea: task.ideaId,
  project: task.projectId,
  priority: task.priority,
  status: task.status,
  dueDate: task.dueDate,
  notes: task.notes,
});
