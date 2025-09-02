const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes except public ones
router.use((req, res, next) => {
  // Skip authentication for public routes
  if (req.path.startsWith('/check/') || req.path.startsWith('/accept/')) {
    return next();
  }
  // Apply authentication for all other routes
  authenticateToken(req, res, next);
});

// Generate invitation token
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// @route   POST /api/invitations
// @desc    Send project invitation
// @access  Private
router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('projectId').isMongoId(),
  body('role').optional().isIn(['viewer', 'editor', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, projectId, role = 'viewer' } = req.body;

    // Check if project exists and user has admin access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Admin access required to invite users' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Check if user is already a member
      const isMember = project.members.some(member => 
        member.user.toString() === existingUser._id.toString()
      );
      
      if (isMember) {
        return res.status(400).json({ error: 'User is already a member of this project' });
      }
    }

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      email,
      project: projectId,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const invitation = new Invitation({
      email,
      project: projectId,
      invitedBy: req.user._id,
      role,
      token: generateInvitationToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await invitation.save();

    // TODO: Send email invitation (implement email service later)
    console.log(`Invitation sent to ${email} for project ${project.name}`);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/invitations/check/:token
// @desc    Check invitation validity
// @access  Public
router.get('/check/:token', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token })
      .populate('project', 'name description')
      .populate('invitedBy', 'firstName lastName');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    res.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        project: invitation.project,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Check invitation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/invitations/accept/:token
// @desc    Accept invitation and create user account
// @access  Public
router.post('/accept/:token', [
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 }),
  body('age').isInt({ min: 13, max: 120 }),
  body('phoneNumber').optional().trim(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, age, phoneNumber, password, username } = req.body;

    // Find invitation
    const invitation = await Invitation.findOne({ token: req.params.token })
      .populate('project');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: invitation.email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create new user
    const user = new User({
      email: invitation.email,
      username,
      password,
      firstName,
      lastName,
      age,
      phoneNumber,
      invitedBy: invitation.invitedBy,
      isEmailVerified: true // Since they came through invitation
    });

    await user.save();

    // Add user to project
    await invitation.project.addMember(user._id, invitation.role, invitation.invitedBy);

    // Mark invitation as accepted
    await invitation.accept(user._id);

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Account created and invitation accepted successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/invitations/project/:projectId
// @desc    Get project invitations
// @access  Private
router.get('/project/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const invitations = await Invitation.find({ project: req.params.projectId })
      .populate('invitedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ invitations });
  } catch (error) {
    console.error('Get project invitations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
