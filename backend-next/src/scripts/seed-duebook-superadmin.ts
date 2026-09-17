/**
 * Seed / reset a DueBook super-admin user.
 *
 * Usage:
 *   npx ts-node src/scripts/seed-duebook-superadmin.ts \
 *     --email=admin@duebook.local --password='ChangeMe!123' --name='DueBook Admin'
 *
 * Env fallbacks: DUEBOOK_ADMIN_EMAIL, DUEBOOK_ADMIN_PASSWORD, DUEBOOK_ADMIN_NAME.
 *
 * If the user already exists, this script updates the password, ensures
 * role=super_admin and isActive=true — safe to re-run.
 */
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const parseArg = (flag: string) => {
  const found = process.argv.find(a => a.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : undefined;
};

const email = (parseArg('--email') || process.env.DUEBOOK_ADMIN_EMAIL || 'admin@duebook.local').toLowerCase();
const password = parseArg('--password') || process.env.DUEBOOK_ADMIN_PASSWORD;
const name = parseArg('--name') || process.env.DUEBOOK_ADMIN_NAME || 'DueBook Super Admin';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'my_api_db';

const run = async () => {
  if (!password) {
    console.error('❌ Password required. Pass --password=... or set DUEBOOK_ADMIN_PASSWORD.');
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI env is not set.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log(`✅ Connected: ${MONGODB_DB_NAME}`);

  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = hashed;
    existing.role = 'super_admin';
    existing.isActive = true;
    if (!existing.name) existing.name = name;
    await existing.save();
    console.log(`✅ Updated existing user → super_admin: ${email}`);
  } else {
    const user = new User({
      name,
      email,
      password: hashed,
      role: 'super_admin',
      isActive: true,
      provider: 'local',
    });
    await user.save();
    user.tenantId = user._id.toString();
    await user.save();
    console.log(`✅ Created super_admin: ${email}`);
  }

  console.log(`\n────────────────────────────────`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Sign in at /login on duebook.shopbdit.com`);
  console.log(`────────────────────────────────\n`);

  await mongoose.disconnect();
};

run().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
