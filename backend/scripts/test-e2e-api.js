import 'dotenv/config';
import mongoose from 'mongoose';

// Register all models
import '../src/models/User.js';
import '../src/models/Question.js';
import '../src/models/Answer.js';
import '../src/models/Vote.js';

import { getQuestionById, submitAnswer } from '../src/services/question.service.js';
import { voteAnswer } from '../src/services/answer.service.js';

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);

  const venkyUser = await mongoose.connection.db.collection('users').findOne({ email: 'venky@gmail.com' });
  const anand2User = await mongoose.connection.db.collection('users').findOne({ email: 'anand2@gmail.com' });
  const questionId = '6a1fffd876d93feeda67f5a3';

  console.log('=== Anand2 views Venky question ===');
  const q1 = await getQuestionById(questionId);
  console.log('Title:', q1?.title);
  console.log('answerCount:', q1?.answerCount);
  console.log('answers.length:', q1?.answers?.length);
  q1?.answers?.forEach((a, i) => console.log(`  [${i}] id=${a.id} authorId=${a.authorId} author.name=${a.author?.name} upvotes=${a.upvotes} status=${a.status}`));

  console.log('\n=== Anand2 submits new answer ===');
  const newAns = await submitAnswer({
    body: 'Practice mock interviews daily. Focus on communication skills as much as coding. Use Pramp and InterviewBit for realistic practice.',
    questionId,
    authorId: anand2User._id.toString(),
  });
  console.log('Returned answer: id=', newAns.id, 'status=', newAns.status, 'upvotes=', newAns.upvotes);

  console.log('\n=== Anand2 views question again ===');
  const q2 = await getQuestionById(questionId);
  console.log('answerCount:', q2?.answerCount);
  console.log('answers.length:', q2?.answers?.length);
  q2?.answers?.forEach((a, i) => console.log(`  [${i}] id=${a.id} authorId=${a.authorId} author.name=${a.author?.name} upvotes=${a.upvotes} status=${a.status}`));

  if (q2?.answers?.length > 0) {
    const firstAnsId = q2.answers[0].id;
    console.log('\n=== Anand2 upvotes first answer ===');
    const voted = await voteAnswer(firstAnsId, anand2User._id.toString(), 'UP');
    console.log('voteAnswer returned:', voted?._id?.toString(), 'voteScore=', voted?.voteScore);
  }

  console.log('\n=== Venky views question after all activity ===');
  const q3 = await getQuestionById(questionId);
  console.log('answerCount:', q3?.answerCount);
  console.log('answers.length:', q3?.answers?.length);
  q3?.answers?.forEach((a, i) => console.log(`  [${i}] id=${a.id} authorId=${a.authorId} author.name=${a.author?.name} upvotes=${a.upvotes} status=${a.status}`));

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

main().catch(err => { console.error(err); process.exit(1); });