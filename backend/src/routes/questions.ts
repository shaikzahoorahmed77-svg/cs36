import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  createQuestion, getQuestionById, listQuestions,
  markQuestionResolved, deleteQuestion, submitAnswer,
} from '../services/question.service.js';
import { semanticSearch, checkDuplicates } from '../services/search.service.js';

const router = Router();

const paramsId = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

// GET /questions
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page, limit, status, tag, authorId } = req.query;
    const result = await listQuestions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      tag: typeof tag === 'string' ? tag : undefined,
      authorId: typeof authorId === 'string' ? authorId : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error('[questions/list]', err);
    res.status(500).json({ error: 'Failed to list questions' });
  }
});

// POST /questions
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, body, tags } = req.body as { title: string; body: string; tags?: string[] };
    if (!title || title.length < 10) return res.status(400).json({ error: 'Title must be at least 10 characters' });
    if (!body || body.length < 20) return res.status(400).json({ error: 'Body must be at least 20 characters' });

    const question = await createQuestion({
      title, body, tags: tags ?? [], authorId: req.user!.userId,
    });
    res.status(201).json(question);
  } catch (err) {
    console.error('[questions/create]', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// GET /questions/search
router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const q = req.query.q;
    if (typeof q !== 'string') return res.status(400).json({ error: 'Query parameter "q" is required' });
    const results = await semanticSearch(q);
    res.json({ results });
  } catch (err) {
    console.error('[questions/search]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// PATCH /questions/faqs/:id/click
router.patch('/faqs/:id/click', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = paramsId(req.params.id);
    const { incrementFAQSearchCount } = await import('../services/faq.service.js');
    const faq = await incrementFAQSearchCount(id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    console.error('[questions/faqs/click]', err);
    res.status(500).json({ error: 'Failed to record FAQ view' });
  }
});

// POST /questions/check-duplicates
router.post('/check-duplicates', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body as { title: string; body: string };
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
    const duplicates = await checkDuplicates(title, body);
    res.json({ duplicates });
  } catch (err) {
    console.error('[questions/check-duplicates]', err);
    res.status(500).json({ error: 'Duplicate check failed' });
  }
});

// GET /questions/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const question = await getQuestionById(paramsId(req.params.id));
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (err) {
    console.error('[questions/get]', err);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

// POST /questions/:id/answers
router.post('/:id/answers', authenticate, async (req: AuthRequest, res) => {
  try {
    const { body } = req.body as { body: string };
    if (!body || body.length < 10) return res.status(400).json({ error: 'Answer must be at least 10 characters' });

    // Reject new answers on questions that already have an approved answer
    const { Question } = await import('../models/Question.js');
    const question = await Question.findById(paramsId(req.params.id)).select('status');
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.status !== 'OPEN') {
      return res.status(403).json({
        error: `This question has already been ${question.status.toLowerCase()} and is no longer accepting new answers.`,
      });
    }

    const answer = await submitAnswer({
      body, questionId: paramsId(req.params.id), authorId: req.user!.userId,
    });
    res.status(201).json(answer);
  } catch (err) {
    console.error('[questions/answer]', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// PATCH /questions/:id/resolve
router.patch('/:id/resolve', authenticate, async (req: AuthRequest, res) => {
  try {
    const question = await markQuestionResolved(paramsId(req.params.id));
    res.json(question);
  } catch (err) {
    console.error('[questions/resolve]', err);
    res.status(500).json({ error: 'Failed to resolve question' });
  }
});

// DELETE /questions/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await deleteQuestion(paramsId(req.params.id), req.user!.userId);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Question not found' });
    if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });
    console.error('[questions/delete]', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;