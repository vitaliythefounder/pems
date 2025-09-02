export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'backlog' | 'research' | 'planning' | 'in-progress' | 'completed' | 'archived';
export type IdeaType = 'tech-app' | 'web-app' | 'physical-business' | 'service-business' | 'automation' | 'marketing' | 'content' | 'general';

export interface Idea {
  id: string;
  title: string;
  description: string;
  type: IdeaType;
  priority: Priority;
  status: Status;
  projectId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  ideaId?: string;
  projectId?: string;
  priority: Priority;
  status: Status;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface DashboardStats {
  totalIdeas: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  ideasByType: Record<IdeaType, number>;
  ideasByPriority: Record<Priority, number>;
  ideasByStatus: Record<Status, number>;
}

export interface AppState {
  ideas: Idea[];
  projects: Project[];
  tasks: Task[];
  selectedProject?: string;
  selectedIdea?: string;
  searchTerm: string;
  filters: {
    type?: IdeaType;
    priority?: Priority;
    status?: Status;
    projectId?: string;
  };
}
