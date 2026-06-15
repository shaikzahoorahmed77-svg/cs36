import { Queue, Worker } from 'bullmq';
import { env } from '../config.js';
import { Notification } from '../models/Notification.js';

const connection = { url: env.REDIS_URL };

export const notifyQueue = new Queue('notifyUser', { connection });

export function addNotifyJob(data: { userId: string; type: string; message: string; link?: string }) {
  return notifyQueue.add('notify', data);
}

new Worker('notifyUser', async (job) => {
  const { userId, type, message, link } = job.data;
  console.log(`[notifyUser] Processing job=${job.id} type=${type} user=${userId}`);
  try {
    const notification = await Notification.create({ userId, type, message, link });
    console.log(`[notifyUser] Created notification=${notification._id} user=${userId} type=${type}`);
  } catch (error) {
    console.error(`[notifyUser] Error processing job=${job.id}:`, error);
    throw error;
  }
}, { connection });