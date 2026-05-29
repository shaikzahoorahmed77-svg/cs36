import { Question } from '../models/Question.js';
import { vectorize, cosineSimilarity } from './embeddings.js';

const DUPLICATE_THRESHOLD = 0.85;

export async function checkDuplicates(title: string, _body: string) {
  const existing = await Question.find({ status: { $ne: 'CLOSED' } }).select('_id title');
  const newVec = await vectorize(title);
  const results: Array<{ id: string; title: string; similarity: number }> = [];

  for (const q of existing) {
    const eVec = await vectorize(q.title);
    const sim = cosineSimilarity(newVec, eVec);
    if (sim > DUPLICATE_THRESHOLD) results.push({ id: q._id.toString(), title: q.title, similarity: sim });
  }
  return results;
}