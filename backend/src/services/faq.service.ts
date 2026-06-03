import { FAQ } from '../models/FAQ.js';
import { computeFingerprint, storeFAQFingerprint } from '../ai/embeddings.js';

function normalizeFAQ(f: any) {
  return {
    id: f._id.toString(),
    question: f.question,
    answer: f.answer,
    tags: f.tags ?? [],
    searchCount: f.searchCount ?? 0,
    authorId: f.authorId?.toString(),
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

export async function createFAQFromAnswer(question: string, answer: string, tags: string[], authorId?: string) {
  const faq = await FAQ.create({ question, answer, tags, authorId });
  // Store TF-IDF fingerprint for future similarity dedup
  await storeFAQFingerprint(faq._id.toString(), question, answer);
  return normalizeFAQ(faq);
}

export async function listFAQs(page = 1, limit = 20, tag?: string) {
  const filter: Record<string, unknown> = {};
  if (tag) filter.tags = tag;
  const skip = (page - 1) * limit;
  const [faqs, total] = await Promise.all([
    FAQ.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    FAQ.countDocuments(filter),
  ]);
  return { faqs: faqs.map(normalizeFAQ), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPopularFAQs(limit = 10) {
  const faqs = await FAQ.find().sort({ searchCount: -1 }).limit(limit);
  return faqs.map(normalizeFAQ);
}

export async function deleteFAQ(id: string) {
  const deleted = await FAQ.findByIdAndDelete(id);
  return deleted ? normalizeFAQ(deleted) : null;
}

export async function incrementFAQSearchCount(id: string) {
  const updated = await FAQ.findByIdAndUpdate(id, { $inc: { searchCount: 1 } });
  return updated ? normalizeFAQ(updated) : null;
}

export async function createFAQWithEmbedding(
  questionText: string,
  answerText: string,
  tags: string[],
  authorId?: string
) {
  const faq = await FAQ.create({
    question: questionText,
    answer: answerText,
    tags,
    authorId: authorId ?? undefined,
  });
  await storeFAQFingerprint(faq._id.toString(), questionText, answerText);
  return normalizeFAQ(faq);
}

// findSimilarFAQs is now exported from embeddings.ts — re-export for convenience
export { findSimilarFAQs } from '../ai/embeddings.js';
