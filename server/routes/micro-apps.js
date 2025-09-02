const express = require('express');
const { body, validationResult } = require('express-validator');
const MicroApp = require('../models/MicroApp');
const PlatformUser = require('../models/PlatformUser');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/platform/apps
// @desc    Get all available micro apps for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = req.user;

    // Get all accessible apps
    const apps = await MicroApp.findAccessibleByUser(user);

    // Add activation status for each app
    const appsWithStatus = apps.map(app => ({
      ...app.toObject(),
      isActivated: user.hasAppAccess(app.appId),
      userPermissions: user.getAppPermissions(app.appId)
    }));

    res.json({ apps: appsWithStatus });
  } catch (error) {
    console.error('Get apps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/platform/apps/category/:category
// @desc    Get apps by category
// @access  Private
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const user = req.user;

    const apps = await MicroApp.findByCategory(category);
    
    // Filter by user access and add activation status
    const accessibleApps = apps
      .filter(app => app.isAccessibleByUser(user))
      .map(app => ({
        ...app.toObject(),
        isActivated: user.hasAppAccess(app.appId),
        userPermissions: user.getAppPermissions(app.appId)
      }));

    res.json({ apps: accessibleApps });
  } catch (error) {
    console.error('Get apps by category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/platform/apps/:appId
// @desc    Get specific micro app details
// @access  Private
router.get('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const user = req.user;

    const app = await MicroApp.findOne({ appId });
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    // Check if user can access this app
    if (!app.isAccessibleByUser(user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const appWithStatus = {
      ...app.toObject(),
      isActivated: user.hasAppAccess(app.appId),
      userPermissions: user.getAppPermissions(app.appId)
    };

    res.json({ app: appWithStatus });
  } catch (error) {
    console.error('Get app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/platform/apps/:appId/activate
// @desc    Activate a micro app for user
// @access  Private
router.post('/:appId/activate', async (req, res) => {
  try {
    const { appId } = req.params;
    const { permissions } = req.body;

    const user = req.user;

    const app = await MicroApp.findOne({ appId });
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    // Check if user can access this app
    if (!app.isAccessibleByUser(user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if app is already activated
    if (user.hasAppAccess(appId)) {
      return res.status(400).json({ error: 'App is already activated' });
    }

    // Activate the app
    await user.activateApp(appId, permissions || ['read', 'write']);

    // Update app statistics
    app.stats.totalUsers += 1;
    await app.save();

    res.json({
      message: 'App activated successfully',
      app: {
        appId: app.appId,
        name: app.name,
        displayName: app.displayName,
        isActivated: true,
        userPermissions: user.getAppPermissions(appId)
      }
    });
  } catch (error) {
    console.error('Activate app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/platform/apps/:appId/deactivate
// @desc    Deactivate a micro app for user
// @access  Private
router.post('/:appId/deactivate', async (req, res) => {
  try {
    const { appId } = req.params;

    const user = req.user;

    const app = await MicroApp.findOne({ appId });
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    // Check if app is activated
    if (!user.hasAppAccess(appId)) {
      return res.status(400).json({ error: 'App is not activated' });
    }

    // Deactivate the app
    await user.deactivateApp(appId);

    // Update app statistics
    app.stats.totalUsers = Math.max(0, app.stats.totalUsers - 1);
    await app.save();

    res.json({
      message: 'App deactivated successfully',
      app: {
        appId: app.appId,
        name: app.name,
        displayName: app.displayName,
        isActivated: false
      }
    });
  } catch (error) {
    console.error('Deactivate app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/platform/apps/user/activated
// @desc    Get user's activated apps
// @access  Private
router.get('/user/activated', async (req, res) => {
  try {
    const user = req.user;

    // Get details for all activated apps
    const activatedApps = [];
    for (const userApp of user.activatedApps) {
      const app = await MicroApp.findOne({ appId: userApp.appId });
      if (app && app.isActive) {
        activatedApps.push({
          ...app.toObject(),
          isActivated: true,
          userPermissions: userApp.permissions,
          activatedAt: userApp.activatedAt,
          settings: userApp.settings
        });
      }
    }

    res.json({ apps: activatedApps });
  } catch (error) {
    console.error('Get activated apps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/platform/apps/:appId/settings
// @desc    Update user's app settings
// @access  Private
router.put('/:appId/settings', [
  body('settings').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { appId } = req.params;
    const { settings } = req.body;

    const user = req.user;

    // Check if app is activated
    if (!user.hasAppAccess(appId)) {
      return res.status(400).json({ error: 'App is not activated' });
    }

    // Update app settings
    const userApp = user.activatedApps.find(app => app.appId === appId);
    if (userApp) {
      userApp.settings = { ...userApp.settings, ...settings };
      await user.save();
    }

    res.json({
      message: 'App settings updated successfully',
      settings: userApp.settings
    });
  } catch (error) {
    console.error('Update app settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes for managing micro apps
// @route   POST /api/platform/apps
// @desc    Create a new micro app (Admin only)
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appData = req.body;
    const app = new MicroApp({
      ...appData,
      createdBy: user._id
    });

    await app.save();

    res.status(201).json({
      message: 'Micro app created successfully',
      app
    });
  } catch (error) {
    console.error('Create app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/platform/apps/:appId
// @desc    Update micro app (Admin only)
// @access  Private (Admin)
router.put('/:appId', async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { appId } = req.params;
    const updateData = req.body;

    const app = await MicroApp.findOneAndUpdate(
      { appId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    res.json({
      message: 'Micro app updated successfully',
      app
    });
  } catch (error) {
    console.error('Update app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
