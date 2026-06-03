import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);

  // Import all models to register schemas with mongoose
  await import('../src/models/User.js');
  await import('../src/models/Question.js');
  const { Answer } = await import('../src/models/Answer.js');
  const { Question } = await import('../src/models/Question.js');
  const { Vote } = await import('../src/models/Vote.js');

  console.log('=== ANSWERS IN DB ===');
  const answers = await Answer.find({}).populate('authorId', 'name').populate('questionId', 'title');
  console.log('Total:', answers.length);
  for (const a of answers) {
    console.log('---');
    console.log('  ID:', a._id.toString());
    console.log('  Question:', a.questionId?.title);
    console.log('  Author:', a.authorId?.name);
    console.log('  Status:', a.status, '| isApproved:', a.isApproved);
    console.log('  Body:', a.body.slice(0, 60), '...');
  }

  console.log('\n=== VOTES IN DB ===');
  const votes = await Vote.find({});
  console.log('Total votes:', votes.length);
  for (const v of votes) {
    console.log('  userId:', v.userId?.toString(), '| targetId:', v.targetId?.toString(), '| type:', v.type);
  }

  console.log('\n=== QUESTIONS ===');
  const qs = await Question.find({}).populate('authorId', 'name');
  for (const q of qs) {
    const answerCount = await Answer.countDocuments({ questionId: q._id });
    console.log('ID:', q._id.toString(), '| Title:', q.title.slice(0, 40), '| Author:', q.authorId?.name, '| answerCount:', answerCount);
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });