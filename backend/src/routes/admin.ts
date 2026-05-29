import { Router } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { listPendingAnswers, approveAnswer, rejectAnswer } from '../services/answer.service.js';
import { listFAQs, deleteFAQ } from '../services/faq.service.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /admin/answers/pending
router.get('/answers/pending', async (req: AuthRequest, res) => {
  try {
    const result = await listPendingAnswers(Number(req.query.page ?? 1));
    res.json(result);
  } catch (err) {
    console.error('[admin/answers/pending]', err);
    res.status(500).json({ error: 'Failed to list pending answers' });
  }
});

// PATCH /admin/answers/:id/approve
router.patch('/answers/:id/approve', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const answer = await approveAnswer(id);
    res.json(answer);
  } catch (err) {
    console.error('[admin/answers/approve]', err);
    res.status(500).json({ error: 'Failed to approve answer' });
  }
});

// PATCH /admin/answers/:id/reject
router.patch('/answers/:id/reject', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const answer = await rejectAnswer(id);
    res.json(answer);
  } catch (err) {
    console.error('[admin/answers/reject]', err);
    res.status(500).json({ error: 'Failed to reject answer' });
  }
});

// GET /admin/faqs
router.get('/faqs', async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    const result = await listFAQs(page, 20, tag);
    res.json(result);
  } catch (err) {
    console.error('[admin/faqs]', err);
    res.status(500).json({ error: 'Failed to list FAQs' });
  }
});

// DELETE /admin/faqs/:id
router.delete('/faqs/:id', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteFAQ(id);
    res.status(204).send();
  } catch (err) {
    console.error('[admin/faqs/delete]', err);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// GET /admin/questions/pending
router.get('/questions/pending', async (_req: AuthRequest, res) => {
  try {
    const questions = await Question.find({ status: 'OPEN' })
      .populate('author', 'name email').sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) {
    console.error('[admin/questions/pending]', err);
    res.status(500).json({ error: 'Failed to list pending questions' });
  }
});

// GET /admin/users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const skip = (page - 1) * 20;
    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(20),
      User.countDocuments(),
    ]);
    res.json({ users, total, page, limit: 20, totalPages: Math.ceil(total / 20) });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// GET /admin/analytics
router.get('/analytics', async (_req: AuthRequest, res) => {
  try {
    const [userCount, questionCount, answerCount, faqCount, recentQuestions] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      (await import('../models/Answer.js')).Answer.countDocuments(),
      (await import('../models/FAQ.js')).FAQ.countDocuments(),
      Question.find().sort({ createdAt: -1 }).limit(10).select('_id title createdAt'),
    ]);
    res.json({ userCount, questionCount, answerCount, faqCount, recentQuestions });
  } catch (err) {
    console.error('[admin/analytics]', err);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;