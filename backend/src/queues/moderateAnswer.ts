import { Queue, Worker } from 'bullmq';
import { env } from '../config.js';
import { moderate } from '../ai/moderation.js';
import { approveAnswer, rejectAnswer } from '../services/answer.service.js';
import { Answer } from '../models/Answer.js';

const connection = { url: env.REDIS_URL };

export const modQueue = new Queue('moderateAnswer', { connection });

export function addModerationJob(data: { answerId: string; body: string }) {
  return modQueue.add('moderate', data);
}

new Worker('moderateAnswer', async (job) => {
  const { answerId, body } = job.data;
  console.log(`[moderateAnswer] Processing job=${job.id} answerId=${answerId}`);
  try {
    const result = await moderate(body);
    console.log(`[moderateAnswer] Moderation result for answerId=${answerId}: action=${result.action}`);

    if (result.action === 'reject') {
      console.log(`[moderateAnswer] Rejecting answerId=${answerId}`);
      await rejectAnswer(answerId);
    } else if (result.action === 'approve') {
      const answerDoc = await Answer.findById(answerId).populate<{ authorId: { role: string } }>('authorId', 'role');
      const role = answerDoc?.authorId?.role;

      if (role === 'STUDENT') {
        console.log(`[moderateAnswer] AnswerId=${answerId} is from role=STUDENT. Keeping PENDING for manual admin approval.`);
      } else {
        console.log(`[moderateAnswer] Auto-approving non-student answerId=${answerId} (role=${role})`);
        const approveRes = await approveAnswer(answerId);
        console.log(`[moderateAnswer] Approved answerId=${answerId} res=${JSON.stringify(approveRes)}`);
      }
    }
    // 'flag' → stays PENDING for admin review

    if (result.hits.length) {
      console.log(`[moderateAnswer] answer=${answerId} action=${result.action} score=${result.score} hits=${result.hits.join(', ')}`);
    }
  } catch (error) {
    console.error(`[moderateAnswer] Error processing job=${job.id}:`, error);
    throw error;
  }
}, { connection });