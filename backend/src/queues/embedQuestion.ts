import { Queue, Worker } from 'bullmq';
import { env } from '../config.js';
import { vectorize } from '../ai/embeddings.js';
import { Question } from '../models/Question.js';

const connection = { url: env.REDIS_URL };

export const embedQueue = new Queue('embedQuestion', { connection });

export function addEmbedJob(data: { questionId: string; title: string; body: string }) {
  return embedQueue.add('embed', data);
}

new Worker('embedQuestion', async (job) => {
  const { questionId, title, body } = job.data;
  const embedding = await vectorize(`${title} ${body}`);
  await Question.findByIdAndUpdate(questionId, { $set: { embedding } } as any);
  console.log(`[embedQuestion] question=${questionId} dims=${embedding.length}`);
}, { connection });