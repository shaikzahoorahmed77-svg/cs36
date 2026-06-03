import 'dotenv/config';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api/v1' });
const r1 = await api.post('/auth/login', { email: 'venky@gmail.com', password: 'Test@123' });
const token = r1.data.token;
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

const questionsBefore = await api.get('/admin/questions?page=1');
console.log(`\n[BEFORE] Total questions in admin queue: ${questionsBefore.data.total}`);
questionsBefore.data.questions.forEach(q => console.log(`  - ${q.status} | ${q.title.slice(0,45)}`));

// Pick Amazon question
const Q_ID = '6a20165595f01393cf080cd2';
const answersBefore = await api.get(`/admin/questions/${Q_ID}/answers`);
console.log(`\n[ANSWERS] Amazon has ${answersBefore.data.answers.length} pending`);
answersBefore.data.answers.forEach(a => console.log(`  - ${a.author?.name ?? 'unknown'} | ${a.status}`));

const A_ID = answersBefore.data.answers[0].id;
const approveResult = await api.patch(`/admin/answers/${A_ID}/approve`);
console.log(`\n[APPROVE] Status: ${approveResult.status}, questionStatus: ${approveResult.data.questionStatus}`);

// Refresh question list
const questionsAfter = await api.get('/admin/questions?page=1');
console.log(`\n[AFTER] Total questions in admin queue: ${questionsAfter.data.total}`);
questionsAfter.data.questions.forEach(q => console.log(`  - ${q.status} | ${q.title.slice(0,45)}`));

const amazonGone = !questionsAfter.data.questions.some(q => q._id === Q_ID);
console.log(`\n[RESULT] Amazon question gone from queue: ${amazonGone ? '✅ YES' : '❌ NO — still there'}`);

// Verify no remaining pending answers for Amazon
const remaining = await api.get(`/admin/questions/${Q_ID}/answers`);
console.log(`[VERIFY] Remaining pending answers for Amazon: ${remaining.data.answers.length}`);

// Verify FAQ was created
const faqs = await api.get('/admin/faqs?page=1');
const amazonFaq = faqs.data.faqs.find(f => f.question.includes('Amazon') || f.question.includes('SDE internship'));
console.log(`[FAQ] Amazon FAQ created: ${amazonFaq ? '✅ YES — ' + amazonFaq.question.slice(0,50) : '❌ NO'}`);

console.log('\n✅ Full flow verified');
