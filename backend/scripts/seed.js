/**
 * MongoDB seed script — run once after MongoDB is up
 * Usage: node --experimental-vm-modules scripts/seed.js
 *
 * Prerequisites:
 *   1. Start MongoDB: mongod --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --port 27017 --nounixsocket
 *   2. Start Redis:   redis-server
 *   3. Start backend: npm run dev  (backend must be running for this to work)
 *
 * This script:
 *   - Creates MongoDB text indexes for search
 *   - Creates sample data via the API endpoints
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/internship_platform';
const API_BASE = process.env.API_URL || 'http://localhost:4000/api/v1';

async function createIndexes() {
  console.log('[seed] Creating MongoDB text indexes...');
  const db = mongoose.connection.db;

  // Drop existing text indexes before recreating (tags can't be in text indexes)
  for (const coll of ['questions', 'faqs']) {
    try {
      const idxs = await db.collection(coll).indexes();
      for (const idx of idxs) {
        if (idx.key && typeof idx.key === 'object' && Object.values(idx.key).includes('text')) {
          await db.collection(coll).dropIndex(idx.name);
        }
      }
    } catch (_) {}
  }

  try {
    await db.collection('questions').createIndex(
      { title: 'text', body: 'text' },
      { name: 'question_text_search' }
    );
    console.log('[seed] ✓ questions text index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('[seed] ℹ questions text index already exists (skipping)');
    } else throw err;
  }

  try {
    await db.collection('faqs').createIndex(
      { question: 'text', answer: 'text' },
      { name: 'faq_text_search' }
    );
    console.log('[seed] ✓ faqs text index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('[seed] ℹ faqs text index already exists (skipping)');
    } else throw err;
  }
}

async function createSampleData() {
  console.log('[seed] Creating sample data via API...');

  // Register admin user
  const adminRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Admin User',
      email: 'admin@internfaq.ai',
      password: 'Admin123!',
    }),
  });

  let adminToken = '';
  if (adminRes.ok) {
    const data = await adminRes.json();
    adminToken = data.token;
    console.log('[seed] ✓ Admin user created');
  } else {
    // Try logging in if already exists
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@internfaq.ai', password: 'Admin123!' }),
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      adminToken = data.token;
      console.log('[seed] ✓ Admin user logged in');
    } else {
      console.log('[seed] ⚠ Could not create/login admin user — may already exist');
    }
  }

  if (!adminToken) {
    console.log('[seed] Skipping sample data — no admin token');
    return;
  }

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };

  // Register a student
  const studentRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Jane Smith', email: 'jane@university.edu', password: 'Student123!' }),
  });
  const studentData = studentRes.ok ? await studentRes.json() : null;
  const studentToken = studentData?.token;
  if (studentToken) {
    console.log('[seed] ✓ Student user created');
  }

  // Sample questions
  const questions = [
    { title: 'How do I prepare for a technical interview at a startup?', body: "I have an interview coming up at a Series A startup. I've done LeetCode problems but I'm not sure if startup interviews focus on different things. What should I focus on?", tags: ['interview', 'technical', 'startup'] },
    { title: 'Are remote internships worth it for CS students?', body: "I'm weighing a remote internship vs an in-person one at a big tech company. The remote one pays more and is at a more interesting company. Is the networking loss from remote work significant?", tags: ['remote', 'career'] },
    { title: 'How do I negotiate a return offer salary?', body: "I'm finishing an internship and they've hinted at a return offer. I want to negotiate but I'm not sure what's appropriate. When do I bring it up? What numbers should I say?", tags: ['salary', 'negotiation', 'return-offer'] },
  ];

  for (const q of questions) {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(q),
    });
    if (res.ok) {
      const qData = await res.json();
      console.log(`[seed] ✓ Question created: "${q.title.slice(0, 40)}..."`);

      // Submit an answer
      const answerBody = `Great question! Here's my experience with this situation. The key thing to remember is that ${q.tags[0]} is really about demonstrating your thought process more than getting the "right" answer.`;
      await fetch(`${API_BASE}/questions/${qData.data.id}/answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: answerBody }),
      });
    }
  }

  console.log('[seed] ✓ Sample data complete');
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[seed] Connected to MongoDB');

    await createIndexes();
    await createSampleData();

    console.log('[seed] Done!');
  } catch (err) {
    console.error('[seed] Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();