const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Get user's projects
router.get('/', async (req, res) => {
  try {
    const query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
        { isPublic: true }
      ]
    };

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName username')
      .populate('members.user', 'firstName lastName username')
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new project
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = new Project({
      ...req.body,
      owner: req.user._id
    });

    await project.save();
    await project.addActivity('created', req.user._id, 'Project created');

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName username');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName username')
      .populate('members.user', 'firstName lastName username')
      .populate('activity.user', 'firstName lastName username');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canView(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Edit access denied' });
    }

    Object.assign(project, req.body);
    await project.save();
    await project.addActivity('updated', req.user._id, 'Project updated');

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName username')
      .populate('members.user', 'firstName lastName username');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Delete access denied' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', [
  body('userId').isMongoId(),
  body('role').isIn(['viewer', 'editor', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Add member access denied' });
    }

    await project.addMember(userId, role, req.user._id);
    await project.addActivity('member_added', req.user._id, `Added member with role: ${role}`);

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Remove member access denied' });
    }

    await project.removeMember(req.params.userId);
    await project.addActivity('member_removed', req.user._id, 'Removed member');

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
