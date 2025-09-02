const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pims');

    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create super admin user
    const superAdmin = new User({
      email: 'admin@pims.com',
      username: 'superadmin',
      password: 'admin123456',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      isActive: true,
      isEmailVerified: true
    });

    await superAdmin.save();

    console.log('🎉 Super admin created successfully!');
    console.log('📧 Email: admin@pims.com');
    console.log('🔑 Password: admin123456');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
