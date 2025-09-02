const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Get user's tasks
router.get('/', async (req, res) => {
  try {
    const query = {
      $or: [
        { owner: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    };

    const tasks = await Task.find(query)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']),
  body('status').isIn(['backlog', 'research', 'planning', 'in-progress', 'completed', 'archived']),
  body('project').optional().isMongoId(),
  body('idea').optional().isMongoId(),
  body('assignedTo').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = new Task({
      ...req.body,
      owner: req.user._id
    });

    await task.save();
    await task.addActivity('created', req.user._id, 'Task created');

    const populatedTask = await Task.findById(task._id)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title');

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title')
      .populate('sharedWith.user', 'firstName lastName username')
      .populate('comments.user', 'firstName lastName username')
      .populate('activity.user', 'firstName lastName username');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.canView(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['backlog', 'research', 'planning', 'in-progress', 'completed', 'archived']),
  body('project').optional().isMongoId(),
  body('idea').optional().isMongoId(),
  body('assignedTo').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Edit access denied' });
    }

    Object.assign(task, req.body);
    await task.save();
    await task.addActivity('updated', req.user._id, 'Task updated');

    const updatedTask = await Task.findById(task._id)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title');

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.canAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Delete access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark task as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Complete access denied' });
    }

    await task.markCompleted(req.user._id);

    const updatedTask = await Task.findById(task._id)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title');

    res.json({
      message: 'Task marked as completed',
      task: updatedTask
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to task
router.post('/:id/comments', [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.canView(req.user._id)) {
      return res.status(403).json({ error: 'Comment access denied' });
    }

    await task.addComment(req.user._id, content);

    const updatedTask = await Task.findById(task._id)
      .populate('owner', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('project', 'name color')
      .populate('idea', 'title')
      .populate('comments.user', 'firstName lastName username');

    res.json({
      message: 'Comment added successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
