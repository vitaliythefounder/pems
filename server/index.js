const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Use PORT from environment variable or default to 5001
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pims')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Platform routes
console.log('🔧 Registering platform routes...');
console.log('📁 Platform auth routes file:', typeof platformAuthRoutes);
console.log('📁 Micro apps routes file:', typeof microAppRoutes);

app.use('/api/platform/auth', platformAuthRoutes);
console.log('✅ Platform auth routes registered at /api/platform/auth');

app.use('/api/platform/apps', microAppRoutes);
console.log('✅ Micro apps routes registered at /api/platform/apps');

// Legacy PIMS routes (for backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitations', invitationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PIMS API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug route to test platform routes
app.get('/api/debug/routes', (req, res) => {
  res.json({
    message: 'Debug routes working',
    platformAuth: 'Should be at /api/platform/auth/*',
    microApps: 'Should be at /api/platform/apps/*',
    timestamp: new Date().toISOString()
  });
});

// Test platform route directly
app.get('/api/platform/test', (req, res) => {
  res.json({
    message: 'Platform test route working',
    timestamp: new Date().toISOString()
  });
});

// Test platform auth route directly
app.get('/api/platform/auth/test', (req, res) => {
  res.json({
    message: 'Platform auth test route working',
    timestamp: new Date().toISOString()
  });
});

// Debug: List all registered routes
app.get('/api/debug/routes-list', (req, res) => {
  const routes = [];
  
  // Get all registered routes
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
        type: 'direct'
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source.replace(/\\\//g, '/').replace(/\\\?/g, '?').replace(/\\\*/g, '*'),
            methods: Object.keys(handler.route.methods),
            type: 'router',
            basePath: middleware.regexp.source
          });
        }
      });
    }
  });
  
  res.json({
    message: 'All registered routes',
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 PIMS Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
