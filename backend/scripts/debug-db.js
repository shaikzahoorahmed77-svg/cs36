import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Question } from '../src/models/Question.js';
import { Answer } from '../src/models/Answer.js';
import { FAQ } from '../src/models/FAQ.js';

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);

  const users = await User.find({}, { name: 1, email: 1, role: 1 });
  const questions = await Question.find({}).populate('authorId', 'name');
  const answers = await Answer.find({}).populate('authorId', 'name').populate('questionId', 'title');
  const faqs = await FAQ.find({}).select('question');

  console.log('=== USERS ===');
  users.forEach(u => console.log(u.email, '-', u.role));
  console.log('\n=== QUESTIONS ===');
  questions.forEach(q => console.log(q._id.toString(), '|', q.title.slice(0,60), '| author:', q.authorId?.name, '| status:', q.status));
  console.log('\n=== ANSWERS ===');
  answers.forEach(a => console.log(a._id.toString(), '| q:', a.questionId.toString(), '| author:', a.authorId?.name, '| status:', a.status, '| approved:', a.isApproved));
  console.log('\n=== FAQ COUNT ===', await FAQ.countDocuments());

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });