import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Question } from '../src/models/Question.js';
import { Answer } from '../src/models/Answer.js';
import { FAQ } from '../src/models/FAQ.js';

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Connected to MongoDB');

  const pwHash = await bcrypt.hash('Test@123', 12);
  const adminPwHash = await bcrypt.hash('Admin123!', 12);

  // 1. Ensure/create test users
  const usersToSeed = [
    { name: 'Venky Admin', email: 'venky@gmail.com', password: pwHash, role: 'ADMIN' },
    { name: 'Student A', email: 'studenta@test.com', password: pwHash, role: 'STUDENT' },
    { name: 'Student B', email: 'studentb@test.com', password: pwHash, role: 'STUDENT' },
    { name: 'Anand 2', email: 'anand2@gmail.com', password: pwHash, role: 'STUDENT' },
    { name: 'Playwright Student A', email: 'playwright_student_a@test.com', password: pwHash, role: 'STUDENT' },
    { name: 'Playwright Student B', email: 'playwright_student_b@test.com', password: pwHash, role: 'STUDENT' },
  ];

  const userMap = new Map();

  for (const u of usersToSeed) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
      console.log(`Created user: ${u.email} (${u.role})`);
    } else {
      user.role = u.role;
      user.password = u.password;
      await user.save();
      console.log(`Updated user: ${u.email} (${u.role})`);
    }
    userMap.set(u.email, user);
  }

  // Also ensure admin@internfaq.ai is ADMIN
  let localAdmin = await User.findOne({ email: 'admin@internfaq.ai' });
  if (localAdmin) {
    localAdmin.role = 'ADMIN';
    localAdmin.password = adminPwHash;
    await localAdmin.save();
    console.log('Updated admin@internfaq.ai to ADMIN role');
  } else {
    localAdmin = await User.create({
      name: 'Admin User',
      email: 'admin@internfaq.ai',
      password: adminPwHash,
      role: 'ADMIN'
    });
    console.log('Created admin@internfaq.ai as ADMIN');
  }

  // 2. Ensure target questions exist with the hardcoded IDs
  const venkyUser = userMap.get('venky@gmail.com');
  const studentA = userMap.get('studenta@test.com');
  const studentB = userMap.get('studentb@test.com');

  const questionsToSeed = [
    {
      _id: new mongoose.Types.ObjectId('6a1fffd876d93feeda67f5a3'),
      title: 'How to prepare for a Google SWE internship interview as a second-year student?',
      body: 'I am in my second year of Computer Science and want to apply for Google internships. What topics should I focus on? How many rounds of interviews are there?',
      tags: ['google', 'interview-prep', 'internship'],
      status: 'OPEN',
      upvotes: 0,
      views: 0,
      answerCount: 0,
      authorId: studentA._id
    },
    {
      _id: new mongoose.Types.ObjectId('6a20013c76d93feeda67f5a8'),
      title: 'What is the best way to get referral for tech internships?',
      body: 'I am looking for referrals for tech internships. What is the best way? How should I message alumni on LinkedIn?',
      tags: ['referrals', 'linkedin', 'networking'],
      status: 'OPEN',
      upvotes: 0,
      views: 0,
      answerCount: 0,
      authorId: studentB._id
    },
    {
      _id: new mongoose.Types.ObjectId('6a20165595f01393cf080cd2'),
      title: 'Amazon SWE internship coding interview preparation strategy?',
      body: 'Targeting Amazon 2025 summer SWE internship preparation. What data structures, algorithms, and leadership principles should I focus on?',
      tags: ['amazon', 'interview', 'technical'],
      status: 'OPEN',
      upvotes: 0,
      views: 0,
      answerCount: 0,
      authorId: studentA._id
    }
  ];

  for (const q of questionsToSeed) {
    let question = await Question.findById(q._id);
    if (!question) {
      question = await Question.create(q);
      console.log(`Created question: ${q._id} (${q.title.slice(0, 40)}...)`);
    } else {
      console.log(`Question already exists: ${q._id}`);
    }
  }

  // Clean up ALL questions except our 3 seeded ones
  await Question.deleteMany({
    _id: {
      $nin: [
        new mongoose.Types.ObjectId('6a1fffd876d93feeda67f5a3'),
        new mongoose.Types.ObjectId('6a20013c76d93feeda67f5a8'),
        new mongoose.Types.ObjectId('6a20165595f01393cf080cd2')
      ]
    }
  });

  // Clean up ALL answers
  await Answer.deleteMany({});

  // Clean up ALL votes and notifications
  const { Vote } = await import('../src/models/Vote.js');
  const { Notification } = await import('../src/models/Notification.js');
  await Vote.deleteMany({});
  await Notification.deleteMany({});

  // Clean up ALL FAQs created by users (those that have an authorId)
  await FAQ.deleteMany({ authorId: { $exists: true } });
  
  // Also delete FAQs matching test questions to be absolutely sure
  await FAQ.deleteMany({
    $or: [
      { question: /Amazon/i },
      { question: /Jane Street/i },
      { question: /quant/i },
      { question: /Google/i },
      { question: /STEP/i }
    ]
  });
  console.log('Cleaned up questions, answers, votes, notifications, and test FAQs');

  // Insert a pending answer for the Amazon question so that e2e-final can approve it
  await Answer.create({
    body: "Focus on arrays, strings, trees, graphs, and dynamic programming. Amazon's interview typically has 1 phone screen + 2-3 onsite algorithm problems. Also study the 14 leadership principles.",
    questionId: new mongoose.Types.ObjectId('6a20165595f01393cf080cd2'),
    authorId: studentB._id,
    status: 'PENDING',
    isApproved: false,
    voteScore: 0
  });
  console.log('Created pending answer for Amazon question (6a20165595f01393cf080cd2)');

  // Set correct answer count on Amazon question
  await Question.findByIdAndUpdate('6a20165595f01393cf080cd2', { answerCount: 1 });
  // Reset answer count on other seeded questions
  await Question.findByIdAndUpdate('6a1fffd876d93feeda67f5a3', { answerCount: 0 });
  await Question.findByIdAndUpdate('6a20013c76d93feeda67f5a8', { answerCount: 0 });

  await mongoose.disconnect();
  console.log('Database initialization done!');
}

main().catch(err => { console.error(err); process.exit(1); });
