const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const ideaRoutes = require('./routes/ideas');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const invitationRoutes = require('./routes/invitations');

// Platform routes
const platformAuthRoutes = require('./routes/platform-auth');
const microAppRoutes = require('./routes/micro-apps');

const app = express();

// Trust proxy for Railway
app.set('trust proxy', 1);

// Use PORT from environment variable or default to 5001
const PORT = process.env.PORT || 5001;

// Simple middleware - no complex stuff that can crash
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pims')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Create default micro apps if they don't exist
const createDefaultMicroApps = async () => {
  try {
    const MicroApp = require('./models/MicroApp');
    
    // Check if PIMS app exists
    let pimsApp = await MicroApp.findOne({ appId: 'pims' });
    if (!pimsApp) {
      pimsApp = new MicroApp({
        appId: 'pims',
        name: 'pims',
        displayName: 'Personal Ideas Management',
        description: 'Organize and manage your ideas, projects, and tasks in one place. Convert ideas to actionable tasks and collaborate with team members.',
        version: '1.0.0',
        category: 'personal',
        tags: ['productivity', 'ideas', 'projects', 'tasks', 'collaboration'],
        icon: '💡',
        color: '#3B82F6',
        route: '/apps/pims',
        isActive: true,
        isPublic: true,
        isBeta: false,
        subscriptionRequired: false,
        requiredPlan: 'free',
        features: [
          { name: 'Idea Management', description: 'Create, organize, and categorize ideas', isEnabled: true },
          { name: 'Project Organization', description: 'Group ideas into projects and track progress', isEnabled: true },
          { name: 'Task Conversion', description: 'Convert ideas into actionable tasks', isEnabled: true },
          { name: 'Team Collaboration', description: 'Invite team members and assign tasks', isEnabled: true },
          { name: 'Progress Tracking', description: 'Monitor project and task completion', isEnabled: true }
        ],
        settings: { allowSharing: true, allowCollaboration: true, maxUsers: 10, storageLimit: 100 },
        permissions: ['read', 'write', 'admin']
      });
      await pimsApp.save();
      console.log('✅ PIMS micro app created');
    }

    // Check if Task Manager app exists
    let taskManagerApp = await MicroApp.findOne({ appId: 'task-manager' });
    if (!taskManagerApp) {
      taskManagerApp = new MicroApp({
        appId: 'task-manager',
        name: 'task-manager',
        displayName: 'Task Manager',
        description: 'Manage and organize your tasks with priority levels, due dates, and progress tracking.',
        version: '1.0.0',
        category: 'personal',
        tags: ['productivity', 'tasks', 'organization', 'time-management'],
        icon: '✅',
        color: '#10B981',
        route: '/apps/task-manager',
        isActive: true,
        isPublic: true,
        isBeta: false,
        subscriptionRequired: false,
        requiredPlan: 'free',
        features: [
          { name: 'Task Creation', description: 'Create and organize tasks', isEnabled: true },
          { name: 'Priority Management', description: 'Set and manage task priorities', isEnabled: true },
          { name: 'Due Date Tracking', description: 'Track task deadlines', isEnabled: true },
          { name: 'Progress Monitoring', description: 'Monitor task completion', isEnabled: true }
        ],
        settings: { allowSharing: true, allowCollaboration: true, maxUsers: 10, storageLimit: 100 },
        permissions: ['read', 'write', 'admin']
      });
      await taskManagerApp.save();
      console.log('✅ Task Manager micro app created');
    }

    console.log('✅ Default micro apps ready');
  } catch (error) {
    console.error('❌ Error creating default micro apps:', error);
  }
};

// Create default apps after database connection
setTimeout(createDefaultMicroApps, 1000);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PIMS API is running',
    timestamp: new Date().toISOString()
  });
});

// Test platform route
app.get('/api/platform/test', (req, res) => {
  res.json({
    message: 'Platform test route working',
    timestamp: new Date().toISOString()
  });
});

// Test micro apps endpoint
app.get('/api/test/micro-apps', async (req, res) => {
  try {
    const MicroApp = require('./models/MicroApp');
    const apps = await MicroApp.find({});
    res.json({
      message: 'Micro apps test',
      count: apps.length,
      apps: apps.map(app => ({
        appId: app.appId,
        displayName: app.displayName,
        isActive: app.isActive
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch micro apps',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual micro app creation endpoint
app.post('/api/create-micro-apps', async (req, res) => {
  try {
    console.log('🔧 Manually creating micro apps...');
    const MicroApp = require('./models/MicroApp');
    
    // Create PIMS app
    const pimsApp = new MicroApp({
      appId: 'pims',
      name: 'pims',
      displayName: 'Personal Ideas Management',
      description: 'Organize and manage your ideas, projects, and tasks in one place.',
      version: '1.0.0',
      category: 'personal',
      tags: ['productivity', 'ideas', 'projects', 'tasks'],
      icon: '💡',
      color: '#3B82F6',
      route: '/apps/pims',
      isActive: true,
      isPublic: true,
      subscriptionRequired: false,
      requiredPlan: 'free',
      features: [
        { name: 'Idea Management', description: 'Create and organize ideas', isEnabled: true },
        { name: 'Project Organization', description: 'Group ideas into projects', isEnabled: true },
        { name: 'Task Conversion', description: 'Convert ideas to tasks', isEnabled: true }
      ],
      settings: { allowSharing: true, allowCollaboration: true },
      permissions: ['read', 'write', 'admin']
    });
    await pimsApp.save();
    console.log('✅ PIMS app created manually');

    // Create Task Manager app
    const taskManagerApp = new MicroApp({
      appId: 'task-manager',
      name: 'task-manager',
      displayName: 'Task Manager',
      description: 'Manage and organize your tasks with priorities and due dates.',
      version: '1.0.0',
      category: 'personal',
      tags: ['productivity', 'tasks', 'organization'],
      icon: '✅',
      color: '#10B981',
      route: '/apps/task-manager',
      isActive: true,
      isPublic: true,
      subscriptionRequired: false,
      requiredPlan: 'free',
      features: [
        { name: 'Task Creation', description: 'Create and organize tasks', isEnabled: true },
        { name: 'Priority Management', description: 'Set task priorities', isEnabled: true },
        { name: 'Due Date Tracking', description: 'Track deadlines', isEnabled: true }
      ],
      settings: { allowSharing: true, allowCollaboration: true },
      permissions: ['read', 'write', 'admin']
    });
    await taskManagerApp.save();
    console.log('✅ Task Manager app created manually');

    res.json({
      message: 'Micro apps created successfully',
      count: 2,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Manual creation failed:', error);
    res.status(500).json({
      error: 'Failed to create micro apps',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Register routes
app.use('/api/platform/auth', platformAuthRoutes);
app.use('/api/platform/apps', microAppRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitations', invitationRoutes);

// Simple error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 PIMS Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
