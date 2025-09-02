import React, { useState } from 'react';
import { Task, Idea, Project, Priority } from '../types';
import { 
  priorityColors, 
  statusColors, 
  formatDate, 
  isOverdueDate,
  getProjectColor
} from '../utils/helpers';
import { 
  CheckCircle, 
  Circle, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar,
  Lightbulb
} from 'lucide-react';

interface TasksListProps {
  tasks: Task[];
  ideas: Idea[];
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  compact?: boolean;
}

const TasksList: React.FC<TasksListProps> = ({
  tasks,
  ideas,
  projects,
  onUpdateTask,
  onDeleteTask,
  compact = false,
}) => {
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const handleStatusToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
      onUpdateTask(taskId, { 
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : undefined
      });
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
        <p className="text-gray-500">Create tasks to start executing on your ideas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const relatedIdea = task.ideaId ? ideas.find(i => i.id === task.ideaId) : null;
        const relatedProject = task.projectId ? projects.find(p => p.id === task.projectId) : null;
        const isCompleted = task.status === 'completed';
        const isOverdue = task.dueDate && isOverdueDate(task.dueDate) && !isCompleted;

        return (
          <div
            key={task.id}
            className={`card p-4 transition-all ${
              isCompleted 
                ? 'bg-gray-50 opacity-75' 
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Status Checkbox */}
              <button
                onClick={() => handleStatusToggle(task.id)}
                className="mt-1 flex-shrink-0"
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium text-gray-900 ${
                      isCompleted ? 'line-through' : ''
                    }`}>
                      {task.title}
                    </h4>
                    
                    {!compact && task.description && (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Related Items */}
                    <div className="flex items-center space-x-3 mt-2">
                      {relatedIdea && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <Lightbulb className="w-3 h-3" />
                          <span>{relatedIdea.title}</span>
                        </div>
                      )}
                      
                      {relatedProject && (
                        <div
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getProjectColor(task.projectId!, projects)}20`,
                            color: getProjectColor(task.projectId!, projects),
                            border: `1px solid ${getProjectColor(task.projectId!, projects)}40`,
                          }}
                        >
                          {relatedProject.name}
                        </div>
                      )}
                    </div>

                    {/* Tags and Due Date */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${priorityColors[task.priority]}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                        <span className={`badge ${statusColors[task.status]}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      {task.dueDate && (
                        <div className={`flex items-center space-x-1 text-xs ${
                          isOverdue ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.dueDate)}</span>
                          {isOverdue && <span className="text-red-500">(Overdue)</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === task.id ? null : task.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showMenu === task.id && (
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
                            onDeleteTask(task.id);
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TasksList;
