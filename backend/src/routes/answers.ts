import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { voteAnswer, getAnswerById } from '../services/answer.service.js';

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