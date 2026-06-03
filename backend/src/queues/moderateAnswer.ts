import { Queue, Worker } from 'bullmq';
import { env } from '../config.js';
import { moderate } from '../ai/moderation.js';
import { approveAnswer, rejectAnswer } from '../services/answer.service.js';

const connection = { url: env.REDIS_URL };

export const modQueue = new Queue('moderateAnswer', { connection });

export function addModerationJob(data: { answerId: string; body: string }) {
  return modQueue.add('moderate', data);
}

new Worker('moderateAnswer', async (job) => {
  const { answerId, body } = job.data;
  const result = await moderate(body);

  if (result.action === 'approve') {
    // Use approveAnswer service so FAQ is created, question marked ANSWERED,
    // and user notification is sent — all in one place.
    await approveAnswer(answerId);
  } else if (result.action === 'reject') {
    await rejectAnswer(answerId);
  }
  // 'flag' → stays PENDING for admin review

  if (result.hits.length) {
    console.log(`[moderateAnswer] answer=${answerId} action=${result.action} score=${result.score} hits=${result.hits.join(', ')}`);
  }
}, { connection });