import 'dotenv/config';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api/v1' });

async function main() {
  console.log('=== E2E: Student A creates Q, Student B replies + votes ===\n');

  // 1. Login as A
  let r = await api.post('/auth/login', { email: 'studenta@test.com', password: 'Test@123' });
  console.log('1. A login:', r.status, r.data.user?.name);
  const A_TOKEN = r.data.token;
  api.defaults.headers.common['Authorization'] = `Bearer ${A_TOKEN}`;

  // 2. A creates question
  r = await api.post('/questions', {
    title: 'How to prepare for a Google SWE internship interview as a second-year student?',
    body: 'I am in my second year of Computer Science and want to apply for Google internships. What topics should I focus on? How many rounds of interviews are there?',
    tags: ['google', 'interview-prep', 'internship']
  });
  console.log('2. A creates question:', r.status, '| id:', r.data.id, '| status:', r.data.status);
  const Q_ID = r.data.id;

  // 3. A logs out, B logs in
  delete api.defaults.headers.common['Authorization'];
  r = await api.post('/auth/login', { email: 'studentb@test.com', password: 'Test@123' });
  console.log('3. B login:', r.status, r.data.user?.name);
  const B_TOKEN = r.data.token;
  api.defaults.headers.common['Authorization'] = `Bearer ${B_TOKEN}`;

  // 4. B views A's question
  r = await api.get(`/questions/${Q_ID}`);
  console.log('4. B views Q: answerCount=', r.data.answerCount, '| status=', r.data.status);

  // 5. B submits answer
  r = await api.post(`/questions/${Q_ID}/answers`, {
    body: 'For Google SWE internships: focus on arrays, strings, trees, graphs, and dynamic programming. Practice medium difficulty Leetcode. The interview typically has a phone screen followed by onsite rounds. For behavioral, study the STAR method and Google 14 leadership principles.'
  });
  console.log('5. B submits answer:', r.status, '| id:', r.data.id, '| status:', r.data.status);
  const ANSWER_ID = r.data.id;

  // 6. Wait for BullMQ moderation
  console.log('6. Waiting 4s for BullMQ auto-approval...');
  await new Promise(res => setTimeout(res, 4000));

  // 7. Check question is now ANSWERED
  r = await api.get(`/questions/${Q_ID}`);
  console.log('7. After moderation — Q status:', r.data.status, '| answers:', r.data.answers?.length, '| isApproved:', r.data.answers?.[0]?.isApproved);

  // 8. B upvotes the answer
  r = await api.patch(`/answers/${ANSWER_ID}/upvote`);
  console.log('8. B upvotes answer:', r.status, '| voteScore:', r.data.voteScore);

  // 9. Verify vote persisted
  r = await api.get(`/questions/${Q_ID}`);
  console.log('9. Final answer upvotes:', r.data.answers?.[0]?.upvotes);

  // 10. Try to submit another answer (should be 403)
  r = await api.post(`/questions/${Q_ID}/answers`, {
    body: 'This should be blocked because the question is already answered!'
  }).catch(e => ({ status: e.response?.status, data: e.response?.data }));
  console.log('10. B tries 2nd answer:', r.status, '(expect 403) |', r.data?.error ?? '');

  console.log('\n✅ E2E test complete!');
}

main().catch(e => {
  console.error('FAILED:', e.response?.data ?? e.message);
  process.exit(1);
});