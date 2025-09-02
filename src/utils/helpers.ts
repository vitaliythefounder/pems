import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Priority, Status, IdeaType, DashboardStats, Idea, Project, Task } from '../types';

export const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  urgent: 'bg-red-200 text-red-900 border-red-300',
};

export const statusColors = {
  backlog: 'bg-gray-100 text-gray-800 border-gray-200',
  research: 'bg-blue-100 text-blue-800 border-blue-200',
  planning: 'bg-purple-100 text-purple-800 border-purple-200',
  'in-progress': 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const ideaTypeLabels = {
  'tech-app': 'Tech App',
  'web-app': 'Web App',
  'physical-business': 'Physical Business',
  'service-business': 'Service Business',
  'automation': 'Automation',
  'marketing': 'Marketing',
  'content': 'Content',
  'general': 'General',
};

export const ideaTypeIcons = {
  'tech-app': '📱',
  'web-app': '🌐',
  'physical-business': '🏪',
  'service-business': '🛠️',
  'automation': '⚙️',
  'marketing': '📢',
  'content': '📝',
  'general': '💡',
};

export const formatDate = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const isOverdueDate = (date: Date): boolean => {
  return isPast(date);
};

export const getDaysUntilDue = (date: Date): number => {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateDashboardStats = (
  ideas: Idea[],
  projects: Project[],
  tasks: Task[]
): DashboardStats => {
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overdueTasks = tasks.filter(task => 
    task.dueDate && isOverdueDate(task.dueDate) && task.status !== 'completed'
  ).length;

  const ideasByType = ideas.reduce((acc, idea) => {
    acc[idea.type] = (acc[idea.type] || 0) + 1;
    return acc;
  }, {} as Record<IdeaType, number>);

  const ideasByPriority = ideas.reduce((acc, idea) => {
    acc[idea.priority] = (acc[idea.priority] || 0) + 1;
    return acc;
  }, {} as Record<Priority, number>);

  const ideasByStatus = ideas.reduce((acc, idea) => {
    acc[idea.status] = (acc[idea.status] || 0) + 1;
    return acc;
  }, {} as Record<Status, number>);

  return {
    totalIdeas: ideas.length,
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks,
    overdueTasks,
    ideasByType,
    ideasByPriority,
    ideasByStatus,
  };
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getProjectColor = (projectId: string, projects: Project[]): string => {
  const project = projects.find(p => p.id === projectId);
  return project?.color || '#6b7280';
};

export const filterIdeas = (
  ideas: Idea[],
  filters: {
    type?: IdeaType;
    priority?: Priority;
    status?: Status;
    projectId?: string;
    searchTerm?: string;
  }
): Idea[] => {
  return ideas.filter(idea => {
    if (filters.type && idea.type !== filters.type) return false;
    if (filters.priority && idea.priority !== filters.priority) return false;
    if (filters.status && idea.status !== filters.status) return false;
    if (filters.projectId && idea.projectId !== filters.projectId) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesTitle = idea.title.toLowerCase().includes(searchLower);
      const matchesDescription = idea.description.toLowerCase().includes(searchLower);
      const matchesTags = idea.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!matchesTitle && !matchesDescription && !matchesTags) return false;
    }
    return true;
  });
};

export const sortIdeas = (ideas: Idea[], sortBy: 'priority' | 'date' | 'title' = 'date'): Idea[] => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  return [...ideas].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
};
