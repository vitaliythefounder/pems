const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Ownership and assignment
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Related items
  idea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  // Task details
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['backlog', 'research', 'planning', 'in-progress', 'completed', 'archived'],
    default: 'backlog'
  },
  // Timeline
  dueDate: Date,
  completedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  // Collaboration
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Activity tracking
  activity: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'assigned', 'shared', 'commented', 'completed']
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
  }],
  // Comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
taskSchema.index({ owner: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ idea: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ 'sharedWith.user': 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Check if user can view this task
taskSchema.methods.canView = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  if (this.assignedTo && this.assignedTo.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => share.user.toString() === userId.toString());
};

// Check if user can edit this task
taskSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  if (this.assignedTo && this.assignedTo.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => 
    share.user.toString() === userId.toString() && 
    ['edit', 'admin'].includes(share.permission)
  );
};

// Check if user can admin this task
taskSchema.methods.canAdmin = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => 
    share.user.toString() === userId.toString() && 
    share.permission === 'admin'
  );
};

// Mark task as completed
taskSchema.methods.markCompleted = function(userId) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.addActivity('completed', userId, 'Task marked as completed');
  return this.save();
};

// Add activity log
taskSchema.methods.addActivity = function(action, userId, details = '') {
  this.activity.push({
    action,
    user: userId,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content,
    timestamp: new Date()
  });
  this.addActivity('commented', userId, 'Added a comment');
  return this.save();
};

// Assign task to user
taskSchema.methods.assignTo = function(userId, assignedBy) {
  this.assignedTo = userId;
  this.addActivity('assigned', assignedBy, `Assigned to user ${userId}`);
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema);
