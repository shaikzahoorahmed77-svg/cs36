import { Queue, Worker } from 'bullmq';
import { env } from '../config.js';
import { moderate } from '../ai/moderation.js';
import { approveAnswer, rejectAnswer } from '../services/answer.service.js';
import { addNotifyJob } from './notifyUser.js';
import { Answer } from '../models/Answer.js';

const connection = { url: env.REDIS_URL };

export const modQueue = new Queue('moderateAnswer', { connection });

export function addModerationJob(data: { answerId: string; body: string }) {
  return modQueue.add('moderate', data);
}

new Worker('moderateAnswer', async (job) => {
  const { answerId, body } = job.data;
  const result = await moderate(body);

  if (result.action === 'approve') {
    await Answer.findByIdAndUpdate(answerId, { status: 'APPROVED', isApproved: true });
  } else if (result.action === 'reject') {
    await rejectAnswer(answerId);
  }
  // 'flag' → stays PENDING for admin review

  console.log(`[moderateAnswer] answer=${answerId} action=${result.action} score=${result.score}`);
}, { connection });