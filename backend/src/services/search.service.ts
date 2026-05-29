import { Question } from '../models/Question.js';
import { FAQ } from '../models/FAQ.js';
import { cacheGet, cacheSet, CACHE_KEYS } from '../cache.js';

export async function semanticSearch(query: string) {
  const cacheKey = CACHE_KEYS.searchResults(query);
  const cached = await cacheGet<ReturnType<typeof _search>>(cacheKey);
  if (cached) return cached;

  const results = await _search(query);
  await cacheSet(cacheKey, results, 120);
  return results;
}

async function _search(query: string) {
  const [questions, faqs] = await Promise.all([
    Question.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .populate('author', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10),
    FAQ.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5),
  ]);

  return { questions, faqs };
}

export async function checkDuplicates(title: string, body: string) {
  const stopWords = new Set(['how', 'what', 'why', 'when', 'where', 'is', 'the', 'a', 'an', 'to', 'for', 'of']);
  const keywords = title.toLowerCase().match(/\b\w{4,}\b/g)?.filter(w => !stopWords.has(w)) ?? [];
  if (!keywords.length) return [];

  return Question.find({
    $or: keywords.map(kw => ({
      $or: [
        { title: { $regex: kw, $options: 'i' } },
        { body: { $regex: kw, $options: 'i' } },
      ],
    })),
  })
    .select('_id title')
    .limit(5);
}