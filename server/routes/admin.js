const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Idea = require('../models/Idea');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and super admin middleware to all routes
router.use(authenticateToken, requireSuperAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Super Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalIdeas,
      totalProjects,
      totalTasks,
      recentUsers,
      systemStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Idea.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password'),
      {
        totalStorage: 0, // TODO: Implement file storage tracking
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    ]);

    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const ideaStats = await Idea.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: userStats
        },
        content: {
          ideas: totalIdeas,
          projects: totalProjects,
          tasks: totalTasks,
          ideasByType: ideaStats,
          tasksByStatus: taskStats
        }
      },
      recentUsers,
      systemStats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Super Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const query = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin only)
// @access  Super Admin
router.put('/users/:id', [
  body('role').optional().isIn(['user', 'admin', 'superadmin']),
  body('isActive').optional().isBoolean(),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, isActive, firstName, lastName } = req.body;
    const updates = {};

    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin only)
// @access  Super Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting super admin
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    // Delete user's content
    await Promise.all([
      Idea.deleteMany({ owner: user._id }),
      Project.deleteMany({ owner: user._id }),
      Task.deleteMany({ owner: user._id })
    ]);

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User and all associated content deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/impersonate
// @desc    Impersonate user (for debugging)
// @access  Super Admin
router.post('/users/:id/impersonate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate impersonation token
    const token = jwt.sign(
      { 
        userId: user._id,
        impersonatedBy: req.user._id,
        isImpersonation: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Impersonation token generated',
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
    console.error('Impersonation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/system/logs
// @desc    Get system logs (placeholder)
// @access  Super Admin
router.get('/system/logs', async (req, res) => {
  try {
    // TODO: Implement actual log retrieval
    res.json({
      message: 'System logs endpoint - implement actual logging system',
      logs: []
    });
  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/system/backup
// @desc    Create system backup
// @access  Super Admin
router.post('/system/backup', async (req, res) => {
  try {
    // TODO: Implement actual backup system
    res.json({
      message: 'Backup initiated - implement actual backup system',
      backupId: Date.now().toString()
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get system analytics
// @access  Super Admin
router.get('/analytics', async (req, res) => {
  try {
    const [
      userGrowth,
      contentGrowth,
      topUsers,
      popularIdeas
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Content growth over time
      Promise.all([
        Idea.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        Project.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]),
      // Top users by content
      User.aggregate([
        {
          $lookup: {
            from: 'ideas',
            localField: '_id',
            foreignField: 'owner',
            as: 'ideas'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: 'owner',
            as: 'projects'
          }
        },
        {
          $project: {
            username: 1,
            firstName: 1,
            lastName: 1,
            totalContent: { $add: [{ $size: '$ideas' }, { $size: '$projects' }] }
          }
        },
        { $sort: { totalContent: -1 } },
        { $limit: 10 }
      ]),
      // Popular idea types
      Idea.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      userGrowth,
      contentGrowth: {
        ideas: contentGrowth[0],
        projects: contentGrowth[1]
      },
      topUsers,
      popularIdeas
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
