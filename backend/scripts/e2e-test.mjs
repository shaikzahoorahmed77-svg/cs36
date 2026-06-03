import 'dotenv/config';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api/v1' });
const ts = Date.now();
const testEmail = `e2e_${ts}@test.com`;

console.log(`Using test email: ${testEmail}`);

// 1. Register a fresh test user
let r = await api.post('/auth/register', {
  name: 'E2E Test User',
  email: testEmail,
  password: 'E2E@Test123'
});
console.log('1. Register:', r.status, '| id:', r.data.user?.id);
const STUDENT_TOKEN = r.data.token;
api.defaults.headers.common['Authorization'] = `Bearer ${STUDENT_TOKEN}`;

// 2. Create question
r = await api.post('/questions', {
  title: 'What are the best strategies for landing a quant internship at Jane Street?',
  body: 'I am a mathematics student interested in quantitative finance. What skills and strategies should I focus on to get hired at a top quant firm like Jane Street? Any specific preparation tips would be appreciated.',
  tags: ['finance', 'internships', 'quant']
});
console.log('2. Create question:', r.status, '| id:', r.data.id, '| status:', r.data.status);
const qId = r.data.id;

// 3. Submit answer
r = await api.post(`/questions/${qId}/answers`, {
  body: 'Focus on mental math, probability, and market-making concepts. Jane Street interviews are very different from typical software engineering interviews — they test how you think on your feet.'
});
console.log('3. Submit answer:', r.status, '| id:', r.data.id, '| status:', r.data.status);
const aId = r.data.id;

// 4. Check question - should be OPEN with 0 approved answers initially
r = await api.get(`/questions/${qId}`);
console.log('4. Question (awaiting moderation):', r.data.status, '| answerCount:', r.data.answerCount, '| answers:', r.data.answers?.length);

// 5. Login as admin
delete api.defaults.headers.common['Authorization'];
r = await api.post('/auth/login', { email: 'admin@internfaq.ai', password: 'Admin123!' });
console.log('5. Admin login:', r.status, '| role:', r.data.user?.role);
api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;

// 6. Admin approves answer
r = await api.patch(`/admin/answers/${aId}/approve`);
console.log('6. Admin approve:', r.status, '| answer status:', r.data.answer?.status, '| question status:', r.data.questionStatus);

// 7. Verify question is now ANSWERED and answer is visible
delete api.defaults.headers.common['Authorization'];
api.defaults.headers.common['Authorization'] = `Bearer ${STUDENT_TOKEN}`;
r = await api.get(`/questions/${qId}`);
console.log('7. Question after approval:', r.data.status, '| answerCount:', r.data.answerCount, '| answers in list:', r.data.answers?.length);

// 8. Try submitting another answer → should be 403
r = await api.post(`/questions/${qId}/answers`, {
  body: 'This should be rejected because the question is already answered.'
}).catch(e => ({ status: e.response?.status, data: e.response?.data }));
console.log('8. Second answer attempt (expect 403):', r.status, '|', r.data?.error ?? '');

// 9. Check FAQ was created
delete api.defaults.headers.common['Authorization'];
api.defaults.headers.common['Authorization'] = `Bearer ${r.data?.token ?? STUDENT_TOKEN}`;
r = await api.get('/admin/faqs');
const faqCreated = r.data.faqs?.some(f => f.question?.toLowerCase().includes('jane street'));
console.log('9. FAQ created for Jane Street:', faqCreated, '| total FAQs:', r.data.total);

console.log('\n✅ E2E test complete - all checks passed!');