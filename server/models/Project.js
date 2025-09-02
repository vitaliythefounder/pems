const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  color: {
    type: String,
    default: '#3b82f6',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color'
    }
  },
  // Ownership and collaboration
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Team members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Project settings
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Project metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  // Progress tracking
  progress: {
    totalIdeas: { type: Number, default: 0 },
    completedIdeas: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 }
  },
  // Timeline
  startDate: Date,
  endDate: Date,
  // Activity tracking
  activity: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'member_added', 'member_removed', 'idea_added', 'task_added']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ isActive: 1 });
projectSchema.index({ isPublic: 1 });

// Virtual for progress percentage
projectSchema.virtual('progressPercentage').get(function() {
  if (this.progress.totalTasks === 0) return 0;
  return Math.round((this.progress.completedTasks / this.progress.totalTasks) * 100);
});

// Check if user is member of this project
projectSchema.methods.isMember = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Check if user can view this project
projectSchema.methods.canView = function(userId) {
  if (this.isPublic) return true;
  return this.isMember(userId);
};

// Check if user can edit this project
projectSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.members.some(member => 
    member.user.toString() === userId.toString() && 
    ['editor', 'admin'].includes(member.role)
  );
};

// Check if user can admin this project
projectSchema.methods.canAdmin = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.members.some(member => 
    member.user.toString() === userId.toString() && 
    member.role === 'admin'
  );
};

// Add member to project
projectSchema.methods.addMember = function(userId, role = 'viewer', addedBy) {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.role = role;
  } else {
    this.members.push({
      user: userId,
      role,
      addedBy: addedBy || this.owner
    });
  }
  
  return this.save();
};

// Remove member from project
projectSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Add activity log
projectSchema.methods.addActivity = function(action, userId, details = '') {
  this.activity.push({
    action,
    user: userId,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Update progress
projectSchema.methods.updateProgress = function() {
  // This will be called when ideas/tasks are added/updated
  // Implementation will be in the service layer
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);
