import React, { useState } from 'react';
import { Idea, Project, Priority } from '../types';
import { 
  priorityColors, 
  statusColors, 
  ideaTypeIcons,
  formatDate,
  isOverdueDate,
  getProjectColor
} from '../utils/helpers';
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  Calendar,
  Tag,
  CheckSquare
} from 'lucide-react';
import ConvertToTaskModal from './ConvertToTaskModal';

interface IdeasGridProps {
  ideas: Idea[];
  projects: Project[];
  onUpdateIdea: (id: string, updates: Partial<Idea>) => void;
  onDeleteIdea: (id: string) => void;
  onIdeaSelect: (ideaId?: string) => void;
  compact?: boolean;
}

const IdeasGrid: React.FC<IdeasGridProps> = ({
  ideas,
  projects,
  onUpdateIdea,
  onDeleteIdea,
  onIdeaSelect,
  compact = false,
}) => {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (ideas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">💡</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
        <p className="text-gray-500">Start capturing your ideas to see them here</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {ideas.map((idea) => (
        <div
          key={idea.id}
          className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onIdeaSelect(idea.id)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{ideaTypeIcons[idea.type]}</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm">{getPriorityIcon(idea.priority)}</span>
                <span className={`badge ${priorityColors[idea.priority]}`}>
                  {idea.priority}
                </span>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(showMenu === idea.id ? null : idea.id);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
              
              {showMenu === idea.id && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
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
                      setSelectedIdea(idea);
                      setConvertModalOpen(true);
                      setShowMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Convert to Task</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteIdea(idea.id);
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

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {idea.title}
          </h3>

          {/* Description */}
          {!compact && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {idea.description}
            </p>
          )}

          {/* Project Badge */}
          {idea.projectId && (
            <div className="mb-3">
              <div
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${getProjectColor(idea.projectId, projects)}20`,
                  color: getProjectColor(idea.projectId, projects),
                  border: `1px solid ${getProjectColor(idea.projectId, projects)}40`,
                }}
              >
                {projects.find(p => p.id === idea.projectId)?.name}
              </div>
            </div>
          )}

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {idea.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {idea.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{idea.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span className={`badge ${statusColors[idea.status]}`}>
                {idea.status.replace('-', ' ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {idea.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span className={isOverdueDate(idea.dueDate) ? 'text-red-500' : ''}>
                    {formatDate(idea.dueDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {convertModalOpen && selectedIdea && (
        <ConvertToTaskModal
          idea={selectedIdea}
          projects={projects}
          onConvert={(task) => {
            // Handle task conversion - you might want to add the task to your state
            console.log('Task created:', task);
            setConvertModalOpen(false);
            setSelectedIdea(null);
          }}
          onClose={() => {
            setConvertModalOpen(false);
            setSelectedIdea(null);
          }}
        />
      )}
    </div>
  );
};

export default IdeasGrid;
