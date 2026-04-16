const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const connectDB = require('../utils/database');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Helper function to ask for password (show input as typed)
const askPassword = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  return password.length >= 6;
};

// Main function
const createSuperUser = async () => {
  try {
    console.log('🔐 Creating Super Admin User');
    console.log('============================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database successfully\n');

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Warning: An admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      
      const continueCreate = await askQuestion('\nDo you want to create another admin? (y/N): ');
      if (continueCreate.toLowerCase() !== 'y' && continueCreate.toLowerCase() !== 'yes') {
        console.log('❌ Admin creation cancelled.');
        process.exit(0);
      }
      console.log();
    }

    // Get user input
    const name = await askQuestion('Enter admin name: ');
    if (!name) {
      console.log('❌ Name is required!');
      process.exit(1);
    }

    const email = await askQuestion('Enter admin email: ');
    if (!email) {
      console.log('❌ Email is required!');
      process.exit(1);
    }

    if (!isValidEmail(email)) {
      console.log('❌ Invalid email format!');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User with this email already exists!');
      process.exit(1);
    }

    const password = await askPassword('Enter password: ');
    if (!password) {
      console.log('❌ Password is required!');
      process.exit(1);
    }

    if (!isValidPassword(password)) {
      console.log('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }

    const confirmPassword = await askPassword('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      process.exit(1);
    }

    const phone = await askQuestion('Enter phone number (optional): ');
    const address = await askQuestion('Enter address (optional): ');

    console.log('\n🔄 Creating admin user...');

    // Create admin user
    const adminUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      phone: phone || undefined,
      address: address || undefined,
      isActive: true
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('=====================================');
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log(`📱 Phone: ${adminUser.phone || 'Not provided'}`);
    console.log(`🏠 Address: ${adminUser.address || 'Not provided'}`);
    console.log(`✅ Status: ${adminUser.isActive ? 'Active' : 'Inactive'}`);
    console.log(`📅 Created: ${adminUser.createdAt}`);
    console.log('\n🎉 You can now login with these credentials!');

  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    
    if (error.code === 11000) {
      console.error('💡 This email is already registered!');
    }
    
    process.exit(1);
  } finally {
    rl.close();
    mongoose.connection.close();
    console.log('\n📡 Database connection closed.');
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n❌ Admin creation cancelled by user.');
  rl.close();
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n❌ Admin creation terminated.');
  rl.close();
  mongoose.connection.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  createSuperUser();
}

module.exports = createSuperUser;
