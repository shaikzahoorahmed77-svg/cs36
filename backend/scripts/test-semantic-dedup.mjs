import 'dotenv/config';
import axios from 'axios';
import { MongoClient, ObjectId } from 'mongodb';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const api = axios.create({ baseURL: 'http://localhost:4000/api/v1' });

const r1 = await api.post('/auth/login', { email: 'venky@gmail.com', password: 'Test@123' });
const token = r1.data.token;
api.defaults.headers.common['Authorization'] = 'Bearer ' + token;

const client = new MongoClient(DATABASE_URL);
await client.connect();
const db = client.db();
const studenta = await db.collection('users').findOne({ email: 'studenta@test.com' });

// Create question semantically similar to existing Amazon FAQ
const qId = new ObjectId();
await db.collection('questions').insertOne({
  _id: qId, title: "Best strategy to crack Amazon SWE internship coding interview?",
  body: "Targeting Amazon 2025 summer SWE internship", tags: ["amazon"],
  status: 'OPEN', upvotes: 3, views: 10, answerCount: 1,
  authorId: studenta._id, createdAt: new Date(), updatedAt: new Date(),
});

const aId = new ObjectId();
await db.collection('answers').insertOne({
  _id: aId, questionId: qId,
  body: "Focus on arrays, strings, trees, graphs, and dynamic programming. Amazon's interview typically has 1 phone screen + 2-3 onsite algorithm problems. Also study the 14 leadership principles.",
  status: 'PENDING', isApproved: false, voteScore: 0, moderationScore: null,
  authorId: studenta._id, createdAt: new Date(), updatedAt: new Date(),
});

console.log('Q:', qId.toString(), '| A:', aId.toString());
console.log('\n--- Approving (expect: 409 Similar FAQ blocked) ---');

try {
  const r = await api.patch('/admin/answers/' + aId.toString() + '/approve');
  console.log('Status:', r.status, '| duplicate:', r.data.duplicate);
  if (r.data.duplicate) console.log('Existing FAQ:', r.data.existingFAQ?.question);
} catch (err) {
  const status = err.response?.status;
  const sim = err.response?.data?.existingFAQ;
  if (status === 409) {
    console.log('✅ 409 — Similar FAQ BLOCKED:');
    console.log('   Existing:', sim?.question);
    console.log('   Similarity:', Math.round(sim?.similarity * 100) + '%');
  } else {
    console.log('Error', status + ':', JSON.stringify(err.response?.data));
  }
}

await client.close();
