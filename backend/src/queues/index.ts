import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config.js';

// Use URL string — BullMQ manages its own connection internally
const connectionConfig = { url: env.REDIS_URL };

export function createQueue(name: string) {
  return new Queue(name, { connection: connectionConfig });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWorker(name: string, processor: (job: Job<any, any, string>) => Promise<void>) {
  return new Worker(name, processor, { connection: connectionConfig });
}