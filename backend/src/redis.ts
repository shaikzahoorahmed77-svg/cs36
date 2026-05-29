import { Redis } from 'ioredis';
import { env } from './config.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    return Math.min(times * 200, 2000);
  },
});

redis.on('error', (err: Error) => console.error('[Redis]', err.message));
redis.on('connect', () => console.log('[Redis] connected'));