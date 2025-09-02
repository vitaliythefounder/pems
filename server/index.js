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
