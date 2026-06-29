import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Role } from '../models/Role';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

async function createSuperAdmin() {
  const email = 'amit@sys.com';
  const password = 'saas245';
  const name = 'Super Admin';

  console.log('\n🚀 Creating Super Admin account...\n');
  console.log(`📦 Database: ${MONGODB_DB_NAME}`);

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log('Updating password and ensuring super_admin role...');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const superAdminRole = await Role.findOne({ name: 'Super Admin' });

      existingUser.password = hashedPassword;
      existingUser.role = 'super_admin';
      existingUser.roleId = superAdminRole?._id;
      existingUser.isActive = true;
      await existingUser.save();

      console.log('✅ User updated successfully!\n');
    } else {
      // Get Super Admin role
      const superAdminRole = await Role.findOne({ name: 'Super Admin' });

      if (!superAdminRole) {
        console.log('⚠️  Super Admin role not found. Please run the main seed script first.');
        process.exit(1);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: 'super_admin',
        roleId: superAdminRole._id,
        isActive: true
      });

      await user.save();
      console.log('✅ Super Admin created successfully!\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('  Super Admin Credentials:');
    console.log('  ────────────────────────');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

createSuperAdmin();
