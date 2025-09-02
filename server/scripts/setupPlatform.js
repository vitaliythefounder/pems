const mongoose = require('mongoose');
const PlatformUser = require('../models/PlatformUser');
const MicroApp = require('../models/MicroApp');
require('dotenv').config({ path: './config.env' });

const setupPlatform = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create platform super admin
    const existingAdmin = await PlatformUser.findOne({ email: 'admin@justeverything.com' });
    if (!existingAdmin) {
      const platformAdmin = new PlatformUser({
        email: 'admin@justeverything.com',
        username: 'platformadmin',
        password: 'admin123456',
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'superadmin',
        isEmailVerified: true,
        subscription: {
          plan: 'enterprise',
          status: 'active'
        }
      });

      await platformAdmin.save();
      console.log('✅ Platform super admin created');
    } else {
      console.log('ℹ️ Platform super admin already exists');
    }

    // Create PIMS micro app
    const existingPims = await MicroApp.findOne({ appId: 'pims' });
    if (!existingPims) {
      const pimsApp = new MicroApp({
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
          {
            name: 'Idea Management',
            description: 'Create, organize, and categorize ideas',
            isEnabled: true
          },
          {
            name: 'Project Organization',
            description: 'Group ideas into projects and track progress',
            isEnabled: true
          },
          {
            name: 'Task Conversion',
            description: 'Convert ideas into actionable tasks',
            isEnabled: true
          },
          {
            name: 'Team Collaboration',
            description: 'Invite team members and assign tasks',
            isEnabled: true
          },
          {
            name: 'Progress Tracking',
            description: 'Monitor project and task completion',
            isEnabled: true
          }
        ],
        settings: {
          allowSharing: true,
          allowCollaboration: true,
          maxUsers: 10,
          storageLimit: 100
        },
        permissions: [
          {
            name: 'read',
            description: 'View ideas, projects, and tasks',
            required: true
          },
          {
            name: 'write',
            description: 'Create and edit ideas, projects, and tasks',
            required: true
          },
          {
            name: 'admin',
            description: 'Manage projects and invite users',
            required: false
          }
        ],
        apiEndpoints: [
          {
            path: '/api/ideas',
            method: 'GET',
            description: 'Get all ideas',
            requiresAuth: true
          },
          {
            path: '/api/projects',
            method: 'GET',
            description: 'Get all projects',
            requiresAuth: true
          },
          {
            path: '/api/tasks',
            method: 'GET',
            description: 'Get all tasks',
            requiresAuth: true
          }
        ],
        dataModels: [
          {
            name: 'Idea',
            description: 'Ideas with categories, priorities, and status',
            schema: {}
          },
          {
            name: 'Project',
            description: 'Projects that group ideas and tasks',
            schema: {}
          },
          {
            name: 'Task',
            description: 'Actionable tasks with deadlines and assignments',
            schema: {}
          }
        ],
        config: {
          defaultCategories: ['tech-app', 'web-app', 'physical-business', 'service-business', 'automation', 'marketing', 'content', 'general'],
          defaultPriorities: ['low', 'medium', 'high', 'urgent'],
          defaultStatuses: ['backlog', 'planning', 'in-progress', 'completed']
        }
      });

      await pimsApp.save();
      console.log('✅ PIMS micro app created');
    } else {
      console.log('ℹ️ PIMS micro app already exists');
    }

    // Create additional sample micro apps
    const sampleApps = [
      {
        appId: 'task-manager',
        name: 'task-manager',
        displayName: 'Task Manager',
        description: 'Advanced task management with time tracking, priorities, and team collaboration.',
        category: 'personal',
        icon: '✅',
        color: '#10B981',
        route: '/apps/task-manager',
        features: [
          { name: 'Task Creation', description: 'Create and organize tasks', isEnabled: true },
          { name: 'Time Tracking', description: 'Track time spent on tasks', isEnabled: true },
          { name: 'Priority Management', description: 'Set and manage task priorities', isEnabled: true }
        ]
      },
      {
        appId: 'note-taking',
        name: 'note-taking',
        displayName: 'Note Taking',
        description: 'Capture, organize, and search your notes with rich text and multimedia support.',
        category: 'personal',
        icon: '📝',
        color: '#F59E0B',
        route: '/apps/note-taking',
        features: [
          { name: 'Rich Text Editor', description: 'Create formatted notes', isEnabled: true },
          { name: 'Note Organization', description: 'Organize notes with tags and folders', isEnabled: true },
          { name: 'Search', description: 'Search through all notes', isEnabled: true }
        ]
      },
      {
        appId: 'crm',
        name: 'crm',
        displayName: 'Customer Relationship Manager',
        description: 'Manage customer relationships, track leads, and monitor sales pipeline.',
        category: 'business',
        icon: '👥',
        color: '#8B5CF6',
        route: '/apps/crm',
        subscriptionRequired: true,
        requiredPlan: 'business',
        features: [
          { name: 'Contact Management', description: 'Manage customer contacts', isEnabled: true },
          { name: 'Lead Tracking', description: 'Track and manage leads', isEnabled: true },
          { name: 'Sales Pipeline', description: 'Monitor sales progress', isEnabled: true }
        ]
      },
      {
        appId: 'project-management',
        name: 'project-management',
        displayName: 'Project Management',
        description: 'Advanced project management with Gantt charts, resource allocation, and team collaboration.',
        category: 'business',
        icon: '📊',
        color: '#EF4444',
        route: '/apps/project-management',
        subscriptionRequired: true,
        requiredPlan: 'business',
        features: [
          { name: 'Gantt Charts', description: 'Visual project timelines', isEnabled: true },
          { name: 'Resource Allocation', description: 'Manage team resources', isEnabled: true },
          { name: 'Team Collaboration', description: 'Real-time team collaboration', isEnabled: true }
        ]
      }
    ];

    for (const appData of sampleApps) {
      const existingApp = await MicroApp.findOne({ appId: appData.appId });
      if (!existingApp) {
        const app = new MicroApp({
          ...appData,
          version: '1.0.0',
          tags: ['productivity'],
          isActive: true,
          isPublic: true,
          isBeta: false,
          settings: {
            allowSharing: true,
            allowCollaboration: true,
            maxUsers: 5,
            storageLimit: 50
          },
          permissions: [
            { name: 'read', description: 'View data', required: true },
            { name: 'write', description: 'Create and edit data', required: true }
          ],
          config: {}
        });

        await app.save();
        console.log(`✅ ${appData.displayName} micro app created`);
      } else {
        console.log(`ℹ️ ${appData.displayName} micro app already exists`);
      }
    }

    // Activate PIMS for platform admin
    const admin = await PlatformUser.findOne({ email: 'admin@justeverything.com' });
    if (admin && !admin.hasAppAccess('pims')) {
      await admin.activateApp('pims', ['read', 'write', 'admin']);
      console.log('✅ PIMS activated for platform admin');
    }

    console.log('\n🎉 Platform setup completed successfully!');
    console.log('\n📋 Platform Information:');
    console.log('   • Platform Admin: admin@justeverything.com / admin123456');
    console.log('   • Available Apps: PIMS, Task Manager, Note Taking, CRM, Project Management');
    console.log('   • Categories: Personal, Business');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the platform frontend');
    console.log('   2. Login with platform admin credentials');
    console.log('   3. Activate micro apps as needed');

  } catch (error) {
    console.error('❌ Platform setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the setup
setupPlatform();
