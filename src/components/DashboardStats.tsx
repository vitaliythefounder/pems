import React from 'react';
import { DashboardStats as Stats } from '../types';
import { 
  Lightbulb, 
  Folder, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Target
} from 'lucide-react';

interface DashboardStatsProps {
  stats: Stats;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Ideas',
      value: stats.totalIdeas,
      icon: Lightbulb,
      color: 'bg-blue-500',
      description: 'Ideas in your vault',
    },
    {
      title: 'Active Projects',
      value: stats.totalProjects,
      icon: Folder,
      color: 'bg-green-500',
      description: 'Projects you\'re working on',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: Target,
      color: 'bg-purple-500',
      description: 'Actionable tasks',
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'Tasks finished',
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Tasks past due',
    },
    {
      title: 'In Progress',
      value: stats.ideasByStatus['in-progress'] || 0,
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Ideas being worked on',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <div key={stat.title} className="card p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
