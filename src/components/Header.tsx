import React from 'react';
import { Brain, Plus, Search, Filter, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onSearchChange?: (searchTerm: string) => void;
  onAddIdea?: () => void;
  onFilter?: () => void;
  onLogout?: () => void;
  user?: any;
}

const Header: React.FC<HeaderProps> = ({ onSearchChange, onAddIdea, onFilter, onLogout, user }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PIMS</h1>
            <p className="text-sm text-gray-500">Personal Ideas Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ideas, projects, tasks..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          
          <button 
            className="btn btn-primary flex items-center space-x-2"
            onClick={onAddIdea}
          >
            <Plus className="w-4 h-4" />
            <span>New Idea</span>
          </button>
          
          <button 
            className="btn btn-secondary flex items-center space-x-2"
            onClick={onFilter}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>

          {user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <button 
                className="btn btn-secondary flex items-center space-x-2"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
