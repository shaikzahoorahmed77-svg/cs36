import { FAQ } from '../models/FAQ.js';
import { cacheGet, cacheSet, cacheInvalidatePrefix, CACHE_KEYS } from '../cache.js';

export async function createFAQFromAnswer(question: string, answer: string, tags: string[], authorId?: string) {
  const faq = await FAQ.create({ question, answer, tags, authorId });
  await cacheInvalidatePrefix('faq');
  return faq;
}

export async function listFAQs(page = 1, limit = 20, tag?: string) {
  const filter: Record<string, unknown> = {};
  if (tag) filter.tags = tag;

  const skip = (page - 1) * limit;
  const [faqs, total] = await Promise.all([
    FAQ.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    FAQ.countDocuments(filter),
  ]);

  return { faqs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPopularFAQs(limit = 10) {
  const cached = await cacheGet<typeof faqs>(CACHE_KEYS.faqPopular);
  if (cached) return cached;

  const faqs = await FAQ.find().sort({ searchCount: -1 }).limit(limit);
  await cacheSet(CACHE_KEYS.faqPopular, faqs, 300);
  return faqs;
}

export async function deleteFAQ(id: string) {
  await cacheInvalidatePrefix('faq');
  return FAQ.findByIdAndDelete(id);
}

export async function incrementFAQSearchCount(id: string) {
  return FAQ.findByIdAndUpdate(id, { $inc: { searchCount: 1 } });
}