import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

const router = Router();

// GET /notifications
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    console.error('[notifications/list]', err);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, userId: req.user!.userId }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    console.error('[notifications/read]', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PATCH /notifications/read-all
router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    console.error('[notifications/read-all]', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;