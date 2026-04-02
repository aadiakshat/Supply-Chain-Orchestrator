import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Pass plain-text passwords — the User model's pre('save') hook
    // in User.js will automatically bcrypt.hash() them before saving.
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });

    await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
    });

    console.log('🌱 Seeded users:');
    console.log(`   👑 Admin  → email: admin@example.com | password: admin123`);
    console.log(`   👤 User   → email: user@example.com  | password: user123`);
    console.log('\nDone! You can now log in to the frontend.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedUsers();
