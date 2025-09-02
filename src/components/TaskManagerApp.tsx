import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckSquare, Plus, Calendar, Clock, User, Search, Lightbulb, RefreshCw } from 'lucide-react';
import { tasksAPI } from '../services/api';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'planning';
  dueDate?: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  source?: 'pims' | 'task-manager';
  projectId?: string;
  projectName?: string;
}

interface TaskManagerAppProps {
  platformUser: any;
  onBackToPlatform: () => void;
}

const TaskManagerApp: React.FC<TaskManagerAppProps> = ({ platformUser, onBackToPlatform }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tasksToDelete, setTasksToDelete] = useState<string[]>([]);

  // Load tasks from both Task Manager and PIMS
  // Helper function to save Task Manager tasks to localStorage with debouncing
  const saveTaskManagerTasksToStorage = (() => {
    let timeoutId: NodeJS.Timeout;
    
    return (allTasks: Task[]) => {
      // Clear any pending save
      clearTimeout(timeoutId);
      
      // Debounce the save by 100ms to avoid rapid successive saves
      timeoutId = setTimeout(() => {
        try {
          const taskManagerTasks = allTasks.filter(task => task.source === 'task-manager');
          localStorage.setItem('taskManagerTasks', JSON.stringify(taskManagerTasks));
          console.log('Debounced save - Task Manager tasks to localStorage:', taskManagerTasks.length);
          
          // Verify the save worked
          const verify = localStorage.getItem('taskManagerTasks');
          if (verify) {
            const parsed = JSON.parse(verify);
            console.log('Verified save - localStorage now contains:', parsed.length, 'tasks');
          } else {
            console.error('localStorage save failed - item not found after saving');
          }
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }, 100);
    };
  })();

  const loadAllTasks = async () => {
    try {
      console.log('Loading tasks from API...');
      // Load PIMS tasks from API
      const pimsTasksResponse = await tasksAPI.getAll();
      console.log('PIMS API response:', pimsTasksResponse);
      
      const pimsTasks = (pimsTasksResponse.tasks || []).map((task: any) => ({
        ...task,
        source: 'pims' as const,
        status: task.status === 'planning' ? 'todo' : task.status, // Map PIMS status to Task Manager status
      }));

      console.log('Processed PIMS tasks:', pimsTasks);

      // Load Task Manager tasks from localStorage (persistent)
      const storedTaskManagerTasks = localStorage.getItem('taskManagerTasks');
      console.log('Raw localStorage content:', storedTaskManagerTasks);
      let taskManagerTasks: Task[] = [];
      
      if (storedTaskManagerTasks) {
        try {
          const parsed = JSON.parse(storedTaskManagerTasks);
          console.log('Successfully parsed localStorage:', parsed);
          // Convert date strings back to Date objects
          taskManagerTasks = parsed.map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          }));
          console.log('Loaded Task Manager tasks from localStorage:', taskManagerTasks.length);
        } catch (error) {
          console.error('Error parsing stored Task Manager tasks:', error);
        }
      } else {
        console.log('No taskManagerTasks found in localStorage');
      }
      
      // If no stored tasks, create initial sample tasks (ONLY ONCE)
      const hasInitializedKey = 'taskManagerInitialized';
      if (taskManagerTasks.length === 0 && !localStorage.getItem(hasInitializedKey)) {
        console.log('First time loading, creating initial sample tasks');
        taskManagerTasks = [
          {
            id: 'tm-1',
            title: 'Complete project proposal',
            description: 'Write and submit the Q4 project proposal document',
            priority: 'high',
            status: 'in-progress',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            assignedTo: 'John Doe',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'task-manager'
          },
          {
            id: 'tm-2',
            title: 'Review team performance',
            description: 'Analyze team metrics and prepare quarterly review',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedTo: 'Jane Smith',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'task-manager'
          },
          {
            id: 'tm-3',
            title: 'Update documentation',
            description: 'Update API documentation with new endpoints',
            priority: 'low',
            status: 'completed',
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            assignedTo: 'Mike Johnson',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'task-manager'
          }
        ];
        // Save initial tasks to localStorage and mark as initialized
        saveTaskManagerTasksToStorage([...pimsTasks, ...taskManagerTasks]);
        localStorage.setItem(hasInitializedKey, 'true');
        console.log('Marked as initialized, sample tasks will not be recreated');
      } else if (taskManagerTasks.length === 0 && localStorage.getItem(hasInitializedKey)) {
        console.log('Already initialized but no stored tasks - this means they were all deleted');
      }

      // Combine all tasks
      const allTasks = [...pimsTasks, ...taskManagerTasks];
      setTasks(allTasks);
      
      console.log('Final task state:', { 
        pimsTasks: pimsTasks.length, 
        taskManagerTasks: taskManagerTasks.length, 
        total: allTasks.length,
        allTasks: allTasks.map(t => ({ id: t.id, title: t.title, source: t.source }))
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Fallback to stored tasks if API fails
      const storedTasks = localStorage.getItem('taskManagerTasks');
      if (storedTasks) {
        try {
          const parsed = JSON.parse(storedTasks);
          setTasks(parsed.map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          })));
        } catch (error) {
          console.error('Error parsing stored tasks:', error);
        }
      }
    }
  };

  useEffect(() => {
    loadAllTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'task-manager' as const
    };
    setTasks(prev => {
      const newTasks = [...prev, newTask];
      // Save updated Task Manager tasks to localStorage
      saveTaskManagerTasksToStorage(newTasks);
      return newTasks;
    });
    setShowAddModal(false);
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If it's a PIMS task, update it via API first
    if (task.source === 'pims') {
      try {
        // Map Task Manager status to PIMS status
        const pimsStatus = status === 'todo' ? 'planning' : status;
        await tasksAPI.update(taskId, { status: pimsStatus });
        console.log('PIMS task status updated via API');
        // Only update local state after successful API update
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status, updatedAt: new Date() }
            : task
        ));
      } catch (error) {
        console.error('Error updating PIMS task:', error);
        alert('Failed to update task status. Please try again.');
        return; // Don't update local state if API call failed
      }
    } else {
      // For Task Manager tasks, update local state immediately
      setTasks(prev => {
        const newTasks = prev.map(task => 
          task.id === taskId 
            ? { ...task, status, updatedAt: new Date() }
            : task
        );
        // Save updated tasks to localStorage
        saveTaskManagerTasksToStorage(newTasks);
        return newTasks;
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    console.log('Deleting task:', { taskId, source: task.source, title: task.title });

    // If it's a PIMS task, delete it via API first
    if (task.source === 'pims') {
      try {
        console.log('Deleting PIMS task via API...');
        await tasksAPI.delete(taskId);
        console.log('PIMS task deleted successfully via API');
        // Only remove from local state after successful API deletion
        setTasks(prev => prev.filter(task => task.id !== taskId));
        console.log('Task removed from local state');
      } catch (error) {
        console.error('Error deleting PIMS task:', error);
        // Show error to user (you could add a toast notification here)
        alert('Failed to delete task. Please try again.');
        return; // Don't remove from local state if API call failed
      }
    } else {
      // For Task Manager tasks, remove from local state immediately
      console.log('Deleting Task Manager task from local state');
      setTasks(prev => {
        const newTasks = prev.filter(task => task.id !== taskId);
        console.log('After deletion, new tasks:', newTasks);
        console.log('Task Manager tasks after deletion:', newTasks.filter(t => t.source === 'task-manager'));
        // Save updated tasks to localStorage
        saveTaskManagerTasksToStorage(newTasks);
        return newTasks;
      });
      console.log('Task Manager task removed from local state and saved to localStorage');
    }
  };

  // Batch delete function for multiple tasks
  const deleteMultipleTasks = async (taskIds: string[]) => {
    console.log('Batch deleting tasks:', taskIds);
    
    // Separate PIMS and Task Manager tasks
    const pimsTasks = taskIds.filter(id => {
      const task = tasks.find(t => t.id === id);
      return task?.source === 'pims';
    });
    


    // Delete PIMS tasks via API first
    for (const taskId of pimsTasks) {
      try {
        await tasksAPI.delete(taskId);
        console.log('PIMS task deleted via API:', taskId);
      } catch (error) {
        console.error('Error deleting PIMS task:', taskId, error);
        alert(`Failed to delete PIMS task. Please try again.`);
        return; // Stop if any PIMS deletion fails
      }
    }

    // Remove all tasks from state and save Task Manager tasks to localStorage
    setTasks(prev => {
      const newTasks = prev.filter(task => !taskIds.includes(task.id));
      console.log('After batch deletion, new tasks:', newTasks);
      console.log('Task Manager tasks after batch deletion:', newTasks.filter(t => t.source === 'task-manager'));
      
      // Save updated Task Manager tasks to localStorage
      saveTaskManagerTasksToStorage(newTasks);
      return newTasks;
    });
    
    console.log('Batch deletion completed');
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'todo': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesSource = filterSource === 'all' || task.source === filterSource;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    pimsTasks: tasks.filter(t => t.source === 'pims').length,
    taskManagerTasks: tasks.filter(t => t.source === 'task-manager').length
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
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Task Manager</h1>
                <p className="text-sm text-gray-500">Advanced task management with time tracking</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={loadAllTasks}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Refresh tasks"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Refresh</span>
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('taskManagerTasks');
                console.log('Cleared Task Manager tasks from localStorage');
                loadAllTasks();
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              title="Reset Task Manager tasks"
            >
              <span className="text-sm">Reset</span>
            </button>
            
            <button
              onClick={() => {
                // Test localStorage directly
                const testKey = 'testKey';
                localStorage.setItem(testKey, 'testValue');
                const retrieved = localStorage.getItem(testKey);
                console.log('localStorage test:', { testKey, retrieved });
                localStorage.removeItem(testKey);
                
                // Test our specific key
                const currentTasks = tasks.filter(t => t.source === 'task-manager');
                console.log('Current Task Manager tasks in state:', currentTasks);
                localStorage.setItem('taskManagerTasks', JSON.stringify(currentTasks));
                const stored = localStorage.getItem('taskManagerTasks');
                console.log('Stored and retrieved:', { stored, parsed: stored ? JSON.parse(stored) : null });
              }}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
              title="Test localStorage"
            >
              <span className="text-sm">Test</span>
            </button>
            
            <button
              onClick={() => {
                const taskManagerTaskIds = tasks
                  .filter(t => t.source === 'task-manager')
                  .map(t => t.id);
                
                if (taskManagerTaskIds.length > 0) {
                  setTasksToDelete(taskManagerTaskIds);
                  setShowDeleteConfirm(true);
                } else {
                  alert('No Task Manager tasks to delete');
                }
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              title="Delete all Task Manager tasks"
            >
              <span className="text-sm">Delete All TM</span>
            </button>
            
            <button
              onClick={() => {
                console.log('=== COMPREHENSIVE DEBUG ===');
                
                // Check localStorage
                const stored = localStorage.getItem('taskManagerTasks');
                const initialized = localStorage.getItem('taskManagerInitialized');
                console.log('localStorage status:', { 
                  taskManagerTasks: stored ? 'Has Data' : 'Empty',
                  taskManagerInitialized: initialized ? 'Yes' : 'No'
                });
                
                if (stored) {
                  try {
                    const parsed = JSON.parse(stored);
                    console.log('Parsed localStorage tasks:', parsed);
                    console.log('Number of stored tasks:', parsed.length);
                  } catch (error) {
                    console.error('Error parsing stored tasks:', error);
                  }
                } else {
                  console.log('No taskManagerTasks found in localStorage');
                }
                
                // Check current state
                console.log('Current tasks state:', tasks);
                console.log('Task Manager tasks in state:', tasks.filter(t => t.source === 'task-manager'));
                console.log('PIMS tasks in state:', tasks.filter(t => t.source === 'pims'));
                
                // Check if localStorage is working at all
                try {
                  localStorage.setItem('debugTest', 'testValue');
                  const testValue = localStorage.getItem('debugTest');
                  localStorage.removeItem('debugTest');
                  console.log('localStorage functionality test:', testValue === 'testValue' ? 'PASSED' : 'FAILED');
                } catch (error) {
                  console.error('localStorage functionality test FAILED:', error);
                }
                
                console.log('=== END DEBUG ===');
                
                // Show comprehensive alert
                const taskManagerCount = tasks.filter(t => t.source === 'task-manager').length;
                const pimsCount = tasks.filter(t => t.source === 'pims').length;
                const storedCount = stored ? JSON.parse(stored).length : 0;
                
                alert(`Debug Info:\n` +
                      `State: ${taskManagerCount} Task Manager + ${pimsCount} PIMS = ${tasks.length} total\n` +
                      `localStorage: ${storedCount} tasks\n` +
                      `Initialized: ${initialized ? 'Yes' : 'No'}\n` +
                      `Check console for full details.`);
              }}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              title="Debug localStorage"
            >
              <span className="text-sm">Debug</span>
            </button>
            
            <div className="w-px h-6 bg-gray-300"></div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Platform User:</span>
              <span className="font-medium">{platformUser.firstName} {platformUser.lastName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Tasks:</span> {tasks.length}
            </div>
            <div>
              <span className="font-medium">PIMS Tasks:</span> {tasks.filter(t => t.source === 'pims').length}
            </div>
            <div>
              <span className="font-medium">Task Manager Tasks:</span> {tasks.filter(t => t.source === 'task-manager').length}
            </div>
            <div>
              <span className="font-medium">localStorage:</span> {localStorage.getItem('taskManagerTasks') ? 'Has Data' : 'Empty'}
            </div>
            <div>
              <span className="font-medium">Initialized:</span> {localStorage.getItem('taskManagerInitialized') ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">localStorage Test:</span> 
              {(() => {
                try {
                  localStorage.setItem('tempTest', 'test');
                  const result = localStorage.getItem('tempTest') === 'test';
                  localStorage.removeItem('tempTest');
                  return result ? 'Working' : 'Failed';
                } catch {
                  return 'Error';
                }
              })()}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">To Do</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">From PIMS</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pimsTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Task Manager</p>
                <p className="text-2xl font-bold text-gray-900">{stats.taskManagerTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Sources</option>
                <option value="pims">From PIMS</option>
                <option value="task-manager">Task Manager</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    {task.source === 'pims' && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-600 border-blue-200 flex items-center space-x-1">
                        <Lightbulb className="w-3 h-3" />
                        <span>PIMS</span>
                      </span>
                    )}
                    {task.source === 'task-manager' && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-600 border-green-200 flex items-center space-x-1">
                        <CheckSquare className="w-3 h-3" />
                        <span>Task Manager</span>
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {task.dueDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {task.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{task.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Mark as completed"
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first task to get started!'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addTask({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as Task['priority'],
                status: 'todo',
                dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
                assignedTo: formData.get('assignedTo') as string || undefined
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all {tasksToDelete.length} Task Manager tasks? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMultipleTasks(tasksToDelete);
                  setShowDeleteConfirm(false);
                  setTasksToDelete([]);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagerApp;
