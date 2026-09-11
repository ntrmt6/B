/**
 * Seeds DueBook Social with a set of Bengali joke posts, authored by a
 * dedicated "DueBook Fun" demo user. Idempotent: running twice will not
 * duplicate the demo user, and skips jokes whose exact text already exists.
 *
 *   npx ts-node src/scripts/seed-social-jokes.ts
 */
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { SocialPost } from '../models/SocialPost';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

const DEMO_EMAIL = 'fun@duebook.demo';
const DEMO_NAME = 'DueBook Fun 🎉';

const JOKES: string[] = [
  `শিক্ষক: বলো তো, "আমি এসেছিলাম" — এটা কোন কাল?\nছাত্র: স্যার, এটা হলো "দেরি হয়ে যাওয়া" কাল! 😄`,

  `স্ত্রী: তুমি আজকাল আমাকে একদম সময় দাও না!\nস্বামী: দিলে তো ফেরত চাইবা না — তাই দিচ্ছি না! 😅`,

  `বাবা: বাবু, তুমি বড় হয়ে কী হতে চাও?\nবাবু: বাবা, তোমার মতো — সোফায় শুয়ে TV দেখা professional! 📺`,

  `দোকানদার: ভাই, বাকি রাখলে ব্যবসা টিকবে কী করে?\nকাস্টমার: টিকবে ভাই — আমি তো নিয়মিত বাকি নিচ্ছি! 😂\n\n(সে জন্যই DueBook — বাকি খাতা মোবাইলেই রাখুন!)`,

  `বন্ধু ১: তুই এত রোগা কেন?\nবন্ধু ২: চিন্তায়!\nবন্ধু ১: কীসের চিন্তা?\nবন্ধু ২: মোটা হওয়ার চিন্তায়! 😆`,

  `ছাত্র: স্যার, আমি কি ভবিষ্যতে বড়লোক হবো?\nশিক্ষক: হ্যাঁ হবে — কিন্তু "ভবিষ্যৎ" শব্দটা যতদিন দূরে থাকবে ততদিন! ⏳`,

  `রোগী: ডাক্তার সাহেব, আমি ঘুমের মধ্যে হাঁটি!\nডাক্তার: এই ওষুধ খান।\nরোগী: এটা কি ঘুম আনবে?\nডাক্তার: না, হাঁটা বন্ধ করবে! 🚶‍♂️😴`,

  `স্ত্রী: আমাদের বিয়ের দিন মনে আছে?\nস্বামী: মনে আছে — সেদিন থেকে ঘুমটা ঠিকঠাক হয় না! 😜`,

  `প্রশ্ন: সবচেয়ে দ্রুত কী চলে?\nউত্তর: মায়ের হাতের চপ্পল — সেকেন্ডের মধ্যে target hit! 🩴💨`,

  `কাস্টমার: ভাই, এই মাছটা কি টাটকা?\nদোকানদার: টাটকা মানে, এখনো সাঁতার কাটার চেষ্টা করছে! 🐟😂`,
];

async function main() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log(`Connected to Mongo (${MONGODB_DB_NAME})`);

  let demo = await User.findOne({ email: DEMO_EMAIL });
  if (!demo) {
    const passwordHash = await bcrypt.hash(`demo-${Date.now()}-${Math.random()}`, 10);
    demo = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: passwordHash,
      role: 'staff',
      bio: 'DueBook-এর অফিসিয়াল মজার পোস্ট — Bengali jokes, memes, moments 😊',
      isActive: true,
      provider: 'local',
    });
    console.log(`Created demo author ${demo._id}`);
  } else {
    console.log(`Reusing demo author ${demo._id}`);
  }

  let created = 0;
  for (let i = 0; i < JOKES.length; i++) {
    const text = JOKES[i];
    const exists = await SocialPost.findOne({ authorId: demo._id, text });
    if (exists) continue;
    // Stagger createdAt so jokes don't all clump at the same instant.
    const createdAt = new Date(Date.now() - (JOKES.length - i) * 60 * 60 * 1000);
    const post = await SocialPost.create({
      authorId: demo._id,
      kind: 'post',
      text,
      images: [],
    });
    // Mongoose `timestamps: true` overrides createdAt on create; patch after.
    await SocialPost.updateOne({ _id: post._id }, { $set: { createdAt, updatedAt: createdAt } });
    created++;
  }
  await User.updateOne({ _id: demo._id }, { $set: { postCount: JOKES.length } });

  console.log(`Seeded ${created} new joke post(s). Total in feed for demo user: ${JOKES.length}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
