const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  acceptedAt: Date,
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better performance
invitationSchema.index({ email: 1, project: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Check if invitation is expired
invitationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Mark invitation as accepted
invitationSchema.methods.accept = function(userId) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Invitation', invitationSchema);
