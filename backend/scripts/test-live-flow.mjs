import 'dotenv/config';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api/v1' });

async function main() {
  // Login as Student A
  let r = await api.post('/auth/login', { email: 'playwright_student_a@test.com', password: 'Test@123' });
  const A_TOKEN = r.data.token;
  console.log('A logged in:', r.data.user?.name);

  // Login as Student B
  r = await api.post('/auth/login', { email: 'playwright_student_b@test.com', password: 'Test@123' });
  const B_TOKEN = r.data.token;
  console.log('B logged in:', r.data.user?.name);

  // A creates a question
  api.defaults.headers.common['Authorization'] = `Bearer ${A_TOKEN}`;
  r = await api.post('/questions', {
    title: 'How to prepare for Google STEP internship interviews as a first-year?',
    body: 'I am a first-year CS student. What data structures, algorithms and topics should I focus on for Google STEP interviews?',
    tags: ['google', 'interviews']
  });
  const Q_ID = r.data.id;
  console.log(`A created question ${Q_ID} (${r.data.status})`);

  // B views the question
  delete api.defaults.headers.common['Authorization'];
  api.defaults.headers.common['Authorization'] = `Bearer ${B_TOKEN}`;
  r = await api.get(`/questions/${Q_ID}`);
  console.log(`B viewed question — status: ${r.data.status}, answers: ${r.data.answers?.length ?? 0}`);

  // B submits an answer
  r = await api.post(`/questions/${Q_ID}/answers`, {
    body: 'Focus on arrays, strings, binary trees and dynamic programming. Practice Leetcode easy/medium. Google STEP typically has 2 technical rounds and 1 behavioral. Review the STAR method and Google leadership principles.'
  });
  const A_ID = r.data.id;
  console.log(`B submitted answer ${A_ID} (status: ${r.data.status})`);

  // Wait for BullMQ auto-moderation
  console.log('Waiting 4s for BullMQ moderation...');
  await new Promise(res => setTimeout(res, 4000));

  // Check question + answer after moderation
  r = await api.get(`/questions/${Q_ID}`);
  const answer = r.data.answers?.[0];
  console.log(`\nAfter moderation: Q status=${r.data.status}, answerCount=${r.data.answerCount}`);
  console.log(`Answer status=${answer?.status}, isApproved=${answer?.isApproved}, upvotes=${answer?.upvotes}`);

  // B upvotes the answer
  r = await api.patch(`/answers/${A_ID}/upvote`);
  console.log(`\nB upvoted answer: voteScore=${r.data.voteScore}`);

  // Final check
  r = await api.get(`/questions/${Q_ID}`);
  const finalAnswer = r.data.answers?.[0];
  console.log(`Final: Q status=${r.data.status}, answer upvotes=${finalAnswer?.upvotes}, isApproved=${finalAnswer?.isApproved}`);

  console.log('\n✅ Full flow succeeded!');
}

main().catch(e => {
  console.error('FAILED:', e.response?.data ?? e.message);
  process.exit(1);
});