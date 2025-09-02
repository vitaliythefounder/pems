import React, { useState, useEffect } from 'react';
import { Idea, Project } from '../types';
import { ideasAPI, usersAPI } from '../services/api';
import { X, Calendar, User } from 'lucide-react';

interface ConvertToTaskModalProps {
  idea: Idea;
  projects: Project[];
  onConvert: (task: any) => void;
  onClose: () => void;
}

const ConvertToTaskModal: React.FC<ConvertToTaskModalProps> = ({
  idea,
  projects,
  onConvert,
  onClose
}) => {
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState(idea.priority);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Load available users for assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await usersAPI.getAll();
        setAvailableUsers(response.users || []);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await ideasAPI.convertToTask(idea.id, {
        dueDate: dueDate || undefined,
        assignedTo: assignedTo || undefined,
        priority
      });

      onConvert(response.task);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to convert idea to task');
    } finally {
      setLoading(false);
    }
  };

  const getProjectUsers = () => {
    if (!idea.projectId) return availableUsers;
    
    const project = projects.find(p => p.id === idea.projectId);
    if (!project) return availableUsers;

    // Return project members + all users
    return availableUsers;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Convert Idea to Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-1">{idea.title}</h3>
          <p className="text-sm text-gray-600">{idea.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assign To */}
          {getProjectUsers().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select user...</option>
                  {getProjectUsers().map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} (@{user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Converting...' : 'Convert to Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertToTaskModal;
