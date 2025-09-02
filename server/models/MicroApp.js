const mongoose = require('mongoose');

const microAppSchema = new mongoose.Schema({
  // App Identity
  appId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // App Metadata
  version: {
    type: String,
    default: '1.0.0'
  },
  category: {
    type: String,
    enum: ['personal', 'business', 'all'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // App Configuration
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  route: {
    type: String,
    required: true,
    unique: true
  },
  
  // App Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isBeta: {
    type: Boolean,
    default: false
  },
  
  // Subscription Requirements
  subscriptionRequired: {
    type: Boolean,
    default: false
  },
  requiredPlan: {
    type: String,
    enum: ['free', 'personal', 'business', 'enterprise'],
    default: 'free'
  },
  
  // App Features
  features: [{
    name: String,
    description: String,
    isEnabled: {
      type: Boolean,
      default: true
    }
  }],
  
  // App Settings
  settings: {
    allowSharing: {
      type: Boolean,
      default: true
    },
    allowCollaboration: {
      type: Boolean,
      default: true
    },
    maxUsers: {
      type: Number,
      default: 1
    },
    storageLimit: {
      type: Number, // in MB
      default: 100
    }
  },
  
  // App Statistics
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    totalUsage: {
      type: Number,
      default: 0
    }
  },
  
  // App Dependencies
  dependencies: [{
    appId: String,
    required: Boolean,
    description: String
  }],
  
  // App Permissions
  permissions: [{
    name: String,
    description: String,
    required: Boolean
  }],
  
  // App API Endpoints
  apiEndpoints: [{
    path: String,
    method: String,
    description: String,
    requiresAuth: {
      type: Boolean,
      default: true
    }
  }],
  
  // App Data Models
  dataModels: [{
    name: String,
    description: String,
    schema: mongoose.Schema.Types.Mixed
  }],
  
  // App Configuration
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlatformUser'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
microAppSchema.index({ appId: 1 });
microAppSchema.index({ category: 1 });
microAppSchema.index({ isActive: 1 });
microAppSchema.index({ isPublic: 1 });
microAppSchema.index({ tags: 1 });

// Instance methods
microAppSchema.methods.isAccessibleByUser = function(user) {
  // Check if app is active and public
  if (!this.isActive || !this.isPublic) {
    return false;
  }
  
  // Check subscription requirements
  if (this.subscriptionRequired) {
    const userPlan = user.subscription.plan;
    const planHierarchy = ['free', 'personal', 'business', 'enterprise'];
    const userPlanIndex = planHierarchy.indexOf(userPlan);
    const requiredPlanIndex = planHierarchy.indexOf(this.requiredPlan);
    
    if (userPlanIndex < requiredPlanIndex) {
      return false;
    }
  }
  
  return true;
};

microAppSchema.methods.getRequiredPermissions = function() {
  return this.permissions.filter(p => p.required).map(p => p.name);
};

// Static methods
microAppSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true, 
    isPublic: true 
  }).sort({ name: 1 });
};

microAppSchema.statics.findAccessibleByUser = function(user) {
  return this.find({ isActive: true, isPublic: true }).then(apps => {
    return apps.filter(app => app.isAccessibleByUser(user));
  });
};

module.exports = mongoose.model('MicroApp', microAppSchema);
