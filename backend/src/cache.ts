import { redis } from './redis.js';

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-critical */ }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* non-critical */ }
}

export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  await cacheDel(`${prefix}:*`);
}

export const CACHE_KEYS = {
  faqPopular: 'faq:popular',
  searchResults: (query: string) => `search:${Buffer.from(query).toString('base64')}`,
  userNotifications: (userId: string) => `notifications:${userId}`,
} as const;