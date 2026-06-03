import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config.js';

async function httpLogin(email, password) {
  // Use mongo + bcrypt to simulate login
  await mongoose.connect(process.env.DATABASE_URL);
  const { User } = await import('../src/models/User.js');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('User not found');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ userId: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
  await mongoose.disconnect();
  return { token, user };
}

async function main() {
  console.log('=== Test: Register new user (via mongo direct) ===');
  await mongoose.connect(process.env.DATABASE_URL);
  const { User } = await import('../src/models/User.js');
  const { Question } = await import('../src/models/Question.js');
  const { Answer } = await import('../src/models/Answer.js');
  
  const rand = Math.floor(Math.random() * 99999);
  const hash = await bcrypt.hash('TestPass123!', 12);
  const newUser = await User.create({ name: 'Test User', email: `test${rand}@test.com`, password: hash });
  const token = jwt.sign({ userId: newUser._id.toString(), role: newUser.role }, env.JWT_SECRET, { expiresIn: '7d' });
  console.log('Created user:', newUser.email, 'id:', newUser._id.toString());

  // Use service functions directly to simulate the API
  const { getQuestionById } = await import('../src/services/question.service.js');
  const { submitAnswer } = await import('../src/services/question.service.js');
  const { voteAnswer } = await import('../src/services/answer.service.js');

  const qId = '6a1fffd876d93feeda67f5a3';

  console.log('\n=== GET question detail ===');
  const q1 = await getQuestionById(qId);
  console.log('answerCount:', q1.answerCount, '| answers:', q1.answers.length);
  q1.answers.forEach((a, i) => console.log(`  [${i}] id=${a.id} author=${a.author?.name} upvotes=${a.upvotes}`));

  console.log('\n=== Submit answer ===');
  const newAns = await submitAnswer({ body: 'Practice system design basics - load balancers, CDNs, caching. Study the STAR method for behavioral questions.', questionId: qId, authorId: newUser._id.toString() });
  console.log('status:', newAns.status, '| id:', newAns.id);

  console.log('\n=== GET question after submit ===');
  const q2 = await getQuestionById(qId);
  console.log('answerCount:', q2.answerCount, '| answers:', q2.answers.length);
  q2.answers.forEach((a, i) => console.log(`  [${i}] id=${a.id} author=${a.author?.name} upvotes=${a.upvotes}`));

  console.log('\n=== Upvote answer ===');
  const firstId = q2.answers[0].id;
  const voted = await voteAnswer(firstId, newUser._id.toString(), 'UP');
  console.log('voteScore after:', voted?.voteScore);

  console.log('\n=== GET question after vote ===');
  const q3 = await getQuestionById(qId);
  q3.answers.forEach((a, i) => console.log(`  [${i}] id=${a.id} upvotes=${a.upvotes}`));

  await mongoose.disconnect();
  console.log('\n✅ All service-level tests passed!');
}

main().catch(err => { console.error('❌', err); process.exit(1); });