import 'dotenv/config';
import mongoose from 'mongoose';
import { Answer } from '../src/models/Answer.js';
import { Question } from '../src/models/Question.js';
import { User } from '../src/models/User.js';

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);

  // Get Student B's userId
  const studentB = await User.findOne({ email: 'studentb@test.com' });
  const questionId = '6a20013c76d93feeda67f5a8';

  // Create answer directly
  const ans = await Answer.create({
    body: 'Direct DB insert test answer - focus on DS algo and projects',
    questionId: new mongoose.Types.ObjectId(questionId),
    authorId: studentB._id,
  });
  console.log('Answer created:', ans._id.toString());

  // Now check it
  const q = await Question.findById(questionId);
  console.log('Question upvotes:', q?.upvotes, 'views:', q?.views, 'answerCount:', q?.answerCount);

  const allAnswers = await Answer.find({ questionId });
  console.log('Answers in DB for this question:', allAnswers.length);

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });