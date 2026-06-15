import { Router } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { listPendingAnswers, approveAnswer, rejectAnswer, addAnswerToFAQ } from '../services/answer.service.js';
import { listFAQs, deleteFAQ, createFAQWithEmbedding, updateFAQ } from '../services/faq.service.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { Answer } from '../models/Answer.js';

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
    if (!answer) { res.status(404).json({ error: 'Answer not found' }); return; }
    if (answer.duplicate && answer.existingFAQ) {
      res.status(409).json({ error: 'Similar FAQ already exists', duplicate: true, existingFAQ: answer.existingFAQ });
      return;
    }
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

// POST /admin/answers/:id/faq — add to FAQ without approving
router.post('/answers/:id/faq', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const faq = await addAnswerToFAQ(id);
    if (!faq) { res.status(404).json({ error: 'Answer not found' }); return; }
    if ((faq as any).duplicate) {
      res.status(409).json({
        error: 'Similar FAQ already exists',
        duplicate: true,
        existingFAQ: { question: faq.question, answer: faq.answer, similarity: faq.existingSimilarity },
      });
      return;
    }
    res.json({ faq, message: 'Added to FAQ' });
  } catch (err) {
    console.error('[admin/answers/faq]', err);
    res.status(500).json({ error: 'Failed to add to FAQ' });
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

// POST /admin/faqs
router.post('/faqs', async (req: AuthRequest, res) => {
  try {
    const { question, answer, tags } = req.body;
    if (!question || !answer) {
      res.status(400).json({ error: 'Question and answer are required' });
      return;
    }
    const faq = await createFAQWithEmbedding(question, answer, tags ?? [], req.user?.id);
    res.status(201).json(faq);
  } catch (err) {
    console.error('[admin/faqs/create]', err);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// PATCH /admin/faqs/:id
router.patch('/faqs/:id', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { question, answer, tags } = req.body;
    const faq = await updateFAQ(id, { question, answer, tags });
    if (!faq) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }
    res.json(faq);
  } catch (err) {
    console.error('[admin/faqs/update]', err);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// GET /admin/questions/pending
router.get('/questions/pending', async (_req: AuthRequest, res) => {
  try {
    const questions = await Question.find({ status: 'OPEN' })
      .populate('authorId', 'name email').sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) {
    console.error('[admin/questions/pending]', err);
    res.status(500).json({ error: 'Failed to list pending questions' });
  }
});

// GET /admin/questions — questions that have pending answers, paginated
router.get('/questions', async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = 20;
    const skip = (page - 1) * limit;

    const matchStage: Record<string, unknown> = {};

    // Always filter to questions with at least one PENDING answer
    matchStage['pendingAnswers'] = { $ne: [] };

    // Search by title/body
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    const [questions, total] = await Promise.all([
      Question.aggregate([
        // Join with answers collection to find those with pending answers
        {
          $lookup: {
            from: 'answers',
            let: { qId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$questionId', '$$qId'] },
                  isApproved: false,
                  status: 'PENDING',
                },
              },
              { $limit: 1 },
            ],
            as: 'pendingAnswers',
          },
        },
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Look up author info
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'authorId',
          },
        },
        { $unwind: { path: '$authorId', preserveNullAndEmptyArrays: true } },
        // Project fields
        {
          $project: {
            _id: 1,
            title: 1,
            body: 1,
            status: 1,
            tags: 1,
            upvotes: 1,
            views: 1,
            answerCount: 1,
            createdAt: 1,
            updatedAt: 1,
            'authorId._id': 1,
            'authorId.name': 1,
            'authorId.email': 1,
          },
        },
      ]),
      Question.aggregate([
        {
          $lookup: {
            from: 'answers',
            let: { qId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$questionId', '$$qId'] }, isApproved: false, status: 'PENDING' } },
              { $limit: 1 },
            ],
            as: 'pendingAnswers',
          },
        },
        { $match: { pendingAnswers: { $ne: [] } } },
        ...(search ? [{ $match: { $or: [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }] } }] : []),
        { $count: 'total' },
      ]).then(r => r[0]?.total ?? 0),
    ]);

    res.json({ questions, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/questions]', err);
    res.status(500).json({ error: 'Failed to list questions' });
  }
});

// PATCH /admin/questions/:id/resolve
router.patch('/questions/:id/resolve', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const question = await Question.findByIdAndUpdate(id, { status: 'RESOLVED' }, { new: true })
      .populate('authorId', 'name email');
    if (!question) { res.status(404).json({ error: 'Question not found' }); return; }
    res.json(question);
  } catch (err) {
    console.error('[admin/questions/resolve]', err);
    res.status(500).json({ error: 'Failed to resolve question' });
  }
});

// PATCH /admin/questions/:id/close
router.patch('/questions/:id/close', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const question = await Question.findByIdAndUpdate(id, { status: 'CLOSED' }, { new: true })
      .populate('authorId', 'name email');
    if (!question) { res.status(404).json({ error: 'Question not found' }); return; }
    res.json(question);
  } catch (err) {
    console.error('[admin/questions/close]', err);
    res.status(500).json({ error: 'Failed to close question' });
  }
});

// DELETE /admin/questions/:id
router.delete('/questions/:id', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const question = await Question.findByIdAndDelete(id);
    if (!question) { res.status(404).json({ error: 'Question not found' }); return; }
    // Also delete associated answers
    await Answer.deleteMany({ questionId: id });
    res.status(204).send();
  } catch (err) {
    console.error('[admin/questions/delete]', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// GET /admin/activity — recent activity feed
router.get('/activity', async (_req: AuthRequest, res) => {
  try {
    const [recentQuestions, recentAnswers, newUsers] = await Promise.all([
      Question.find().select('title status createdAt').sort({ createdAt: -1 }).limit(5),
      Answer.find().select('body status createdAt').sort({ createdAt: -1 }).limit(5),
      User.find().select('name email createdAt').sort({ createdAt: -1 }).limit(3),
    ]);

    const feed = [
      ...recentQuestions.map(q => ({ type: 'question', text: `Question: "${q.title}"`, status: q.status, time: q.createdAt })),
      ...recentAnswers.map(a => ({ type: 'answer', text: `Answer (${a.status}): ${a.body.slice(0, 60)}...`, status: a.status, time: a.createdAt })),
      ...newUsers.map(u => ({ type: 'user', text: `New user: ${u.name} (${u.email})`, time: u.createdAt })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    res.json({ feed });
  } catch (err) {
    console.error('[admin/activity]', err);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// PATCH /admin/users/:id/role
router.patch('/users/:id/role', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { role } = req.body;
    if (!['STUDENT', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be STUDENT or ADMIN' });
      return;
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    console.error('[admin/users/role]', err);
    res.status(500).json({ error: 'Failed to update user role' });
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
// GET /admin/questions/:id/answers — all answers for a question (for admin review)
router.get('/questions/:id/answers', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const answers = await Answer.find({ questionId: id, isApproved: false })
      .populate('authorId', 'name email')
      .sort({ createdAt: 1 });
    const normalized = answers.map((a: any) => ({
      id: a._id.toString(),
      body: a.body,
      status: a.status,
      isApproved: a.isApproved,
      voteScore: a.voteScore ?? 0,
      createdAt: a.createdAt,
      authorId: a.authorId?._id?.toString(),
      author: a.authorId ? { id: a.authorId._id.toString(), name: a.authorId.name, email: a.authorId.email } : undefined,
    }));
    res.json({ answers: normalized });
  } catch (err) {
    console.error('[admin/questions/answers]', err);
    res.status(500).json({ error: 'Failed to get answers' });
  }
});
