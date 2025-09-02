const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const platformUserSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  // Profile Info
  age: {
    type: Number,
    min: 13,
    max: 120
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: 20
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Platform Settings
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'personal', 'business', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Micro App Access
  activatedApps: [{
    appId: {
      type: String,
      required: true
    },
    activatedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: [String],
      default: ['read', 'write']
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Activity Tracking
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Security
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Metadata
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
platformUserSchema.index({ email: 1 });
platformUserSchema.index({ username: 1 });
platformUserSchema.index({ 'subscription.status': 1 });
platformUserSchema.index({ 'activatedApps.appId': 1 });

// Pre-save middleware
platformUserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  this.updatedAt = new Date();
  next();
});

// Instance methods
platformUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

platformUserSchema.methods.hasAppAccess = function(appId) {
  return this.activatedApps.some(app => app.appId === appId);
};

platformUserSchema.methods.getAppPermissions = function(appId) {
  const app = this.activatedApps.find(app => app.appId === appId);
  return app ? app.permissions : [];
};

platformUserSchema.methods.activateApp = function(appId, permissions = ['read', 'write']) {
  if (!this.hasAppAccess(appId)) {
    this.activatedApps.push({
      appId,
      activatedAt: new Date(),
      permissions
    });
  }
  return this.save();
};

platformUserSchema.methods.deactivateApp = function(appId) {
  this.activatedApps = this.activatedApps.filter(app => app.appId !== appId);
  return this.save();
};

// Static methods
platformUserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

platformUserSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

module.exports = mongoose.model('PlatformUser', platformUserSchema);
