const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['tech-app', 'web-app', 'physical-business', 'service-business', 'automation', 'marketing', 'content', 'general'],
    default: 'general'
  },
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
  // Ownership and collaboration
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
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
  dueDate: Date,
  notes: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  // Analytics
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
      enum: ['created', 'updated', 'status_changed', 'shared', 'commented']
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
ideaSchema.index({ owner: 1, createdAt: -1 });
ideaSchema.index({ project: 1 });
ideaSchema.index({ type: 1 });
ideaSchema.index({ priority: 1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ tags: 1 });
ideaSchema.index({ 'sharedWith.user': 1 });

// Virtual for full name
ideaSchema.virtual('ownerName').get(function() {
  return this.owner ? `${this.owner.firstName} ${this.owner.lastName}` : '';
});

// Check if user can view this idea
ideaSchema.methods.canView = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => share.user.toString() === userId.toString());
};

// Check if user can edit this idea
ideaSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => 
    share.user.toString() === userId.toString() && 
    ['edit', 'admin'].includes(share.permission)
  );
};

// Check if user can admin this idea
ideaSchema.methods.canAdmin = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => 
    share.user.toString() === userId.toString() && 
    share.permission === 'admin'
  );
};

// Add activity log
ideaSchema.methods.addActivity = function(action, userId, details = '') {
  this.activity.push({
    action,
    user: userId,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Add view
ideaSchema.methods.addView = function(userId) {
  const existingView = this.views.find(view => 
    view.user.toString() === userId.toString()
  );
  
  if (!existingView) {
    this.views.push({
      user: userId,
      viewedAt: new Date()
    });
  } else {
    existingView.viewedAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Idea', ideaSchema);
