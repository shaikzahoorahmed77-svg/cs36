import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { voteAnswer, getAnswerById } from '../services/answer.service.js';
import { Question } from '../models/Question.js';
import { Answer } from '../models/Answer.js';

const router = Router();

const paramsId = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

// PATCH /answers/:id/upvote
router.patch('/:id/upvote', authenticate, async (req: AuthRequest, res) => {
  try {
    const type = (req.query.type as string) === 'down' ? 'DOWN' : 'UP';
    const answer = await voteAnswer(paramsId(req.params.id), req.user!.userId, type);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json(answer);
  } catch (err) {
    console.error('[answers/vote]', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// GET /answers/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const answer = await getAnswerById(paramsId(req.params.id));
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json(answer);
  } catch (err) {
    console.error('[answers/get]', err);
    res.status(500).json({ error: 'Failed to get answer' });
  }
});

export default router;
// GET /answers?authorId= — get all answers by a user (for profile page)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
    if (!authorId) { res.status(400).json({ error: 'authorId required' }); return; }

    const page = Number(req.query.page ?? 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { authorId, isApproved: true };
    const [rawAnswers, total] = await Promise.all([
      Answer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Answer.countDocuments(filter),
    ]);

    // Manually look up question titles to avoid populate issues with deleted questions
    const answers: any[] = rawAnswers;
    const qIds: string[] = [...new Set(answers
      .map((a: any) => a.questionId)
      .filter(Boolean)
      .map((q: any) => String(q)))];

    const questionsMap: Record<string, { title: string; status: string }> = {};
    if (qIds.length > 0) {
      const questions = await Question.find({ _id: { $in: qIds } }).select('_id title status');
      for (const q of questions) {
        questionsMap[q._id.toString()] = { title: q.title, status: q.status };
      }
    }

    const normalized = answers.map((a: any) => ({
      id: a._id.toString(),
      body: a.body,
      voteScore: a.voteScore ?? 0,
      createdAt: a.createdAt,
      question: a.questionId ? (() => {
        const qStr = a.questionId.toString();
        const qData = questionsMap[qStr];
        return qData
          ? { id: qStr, title: qData.title, status: qData.status }
          : { id: qStr, title: 'Unknown question', status: 'UNKNOWN' };
      })() : undefined,
    }));

    res.json({ answers: normalized, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[answers/list-by-author]', err);
    res.status(500).json({ error: 'Failed to get answers' });
  }
});
