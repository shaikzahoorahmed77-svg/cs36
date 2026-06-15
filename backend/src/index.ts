import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { redis } from './redis.js';
import { env } from './config.js';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

// Queue consumers (must import to register workers)
import './queues/embedQuestion.js';
import './queues/moderateAnswer.js';
import './queues/notifyUser.js';

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, env.FRONTEND_URL);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/answers', answerRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 404 & error handler ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── MongoDB connect ───────────────────────────────────────────────────────────
{
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(env.DATABASE_URL, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('[MongoDB] Connected successfully');
      break;
    } catch (error) {
      attempts++;
      const message = error instanceof Error ? error.message : String(error);
      if (attempts >= maxAttempts) {
        console.error(`[MongoDB] Connection failed after ${maxAttempts} attempts:`, message);
        process.exit(1);
      }
      console.warn(`[MongoDB] Connection attempt ${attempts} failed, retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

redis.on('connect', () => console.log('[Redis] connected'));

export default app;