const express = require('express');
const { body, validationResult } = require('express-validator');
const Idea = require('../models/Idea');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/ideas
// @desc    Get user's ideas with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      type,
      priority,
      status,
      project,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    };

    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (project) query.project = project;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [ideas, total] = await Promise.all([
      Idea.find(query)
        .populate('owner', 'firstName lastName username')
        .populate('project', 'name color')
        .populate('sharedWith.user', 'firstName lastName username')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Idea.countDocuments(query)
    ]);

    res.json({
      ideas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/ideas
// @desc    Create a new idea
// @access  Private
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('type').isIn(['tech-app', 'web-app', 'physical-business', 'service-business', 'automation', 'marketing', 'content', 'general']),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']),
  body('status').isIn(['backlog', 'research', 'planning', 'in-progress', 'completed', 'archived']),
  body('project').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().trim().isLength({ max: 5000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const idea = new Idea({
      ...req.body,
      owner: req.user._id
    });

    await idea.save();
    await idea.addActivity('created', req.user._id, 'Idea created');

    const populatedIdea = await Idea.findById(idea._id)
      .populate('owner', 'firstName lastName username')
      .populate('project', 'name color');

    res.status(201).json({
      message: 'Idea created successfully',
      idea: populatedIdea
    });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/ideas/:id
// @desc    Get a specific idea
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('owner', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('sharedWith.user', 'firstName lastName username')
      .populate('activity.user', 'firstName lastName username');

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (!idea.canView(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add view
    await idea.addView(req.user._id);

    res.json({ idea });
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/ideas/:id
// @desc    Update an idea
// @access  Private
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('type').optional().isIn(['tech-app', 'web-app', 'physical-business', 'service-business', 'automation', 'marketing', 'content', 'general']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['backlog', 'research', 'planning', 'in-progress', 'completed', 'archived']),
  body('project').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().trim().isLength({ max: 5000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (!idea.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Edit access denied' });
    }

    Object.assign(idea, req.body);
    await idea.save();
    await idea.addActivity('updated', req.user._id, 'Idea updated');

    const updatedIdea = await Idea.findById(idea._id)
      .populate('owner', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('sharedWith.user', 'firstName lastName username');

    res.json({
      message: 'Idea updated successfully',
      idea: updatedIdea
    });
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/ideas/:id
// @desc    Delete an idea
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (!idea.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Delete access denied' });
    }

    await Idea.findByIdAndDelete(req.params.id);

    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/ideas/:id/share
// @desc    Share an idea with another user
// @access  Private
router.post('/:id/share', [
  body('userId').isMongoId(),
  body('permission').isIn(['view', 'edit', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, permission } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (!idea.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Share access denied' });
    }

    // Check if already shared
    const existingShare = idea.sharedWith.find(share => 
      share.user.toString() === userId
    );

    if (existingShare) {
      existingShare.permission = permission;
    } else {
      idea.sharedWith.push({
        user: userId,
        permission,
        addedAt: new Date()
      });
    }

    await idea.save();
    await idea.addActivity('shared', req.user._id, `Shared with user ${userId}`);

    res.json({ message: 'Idea shared successfully' });
  } catch (error) {
    console.error('Share idea error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/ideas/:id/convert-to-task
// @desc    Convert an idea to a task
// @access  Private
router.post('/:id/convert-to-task', [
  body('dueDate').optional().isISO8601(),
  body('assignedTo').optional().isMongoId(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dueDate, assignedTo, priority } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (!idea.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Edit access denied' });
    }

    // Create task from idea
    const Task = require('../models/Task');
    const task = new Task({
      title: idea.title,
      description: idea.description,
      idea: idea._id,
      project: idea.project,
      priority: priority || idea.priority,
      status: 'planning',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo,
      owner: req.user._id,
      tags: idea.tags
    });

    await task.save();
    await task.addActivity('created', req.user._id, 'Task created from idea');

    // Update idea status to indicate it's been converted
    idea.status = 'in-progress';
    await idea.save();
    await idea.addActivity('status_changed', req.user._id, 'Converted to task');

    const populatedTask = await Task.findById(task._id)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title');

    res.status(201).json({
      message: 'Idea converted to task successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Convert idea to task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
