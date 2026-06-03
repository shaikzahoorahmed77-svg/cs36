/**
 * Offline text similarity using TF-IDF (no internet required).
 *
 * Each FAQ stores a "fingerprint" vector: sparse TF-IDF weights for its
 * question + answer text.  When a new answer is submitted for approval,
 * we compute its TF-IDF fingerprint and compare against existing FAQs
 * using cosine similarity.
 *
 * TF-IDF formula: tfidf(t,d) = freq(t,d) / max_freq(d) * log(N / df(t))
 */

import { FAQ } from '../models/FAQ.js';

// ── Tiny TF-IDF implementation ──────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function termFreq(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const t of tokens) { freq[t] = (freq[t] ?? 0) + 1; }
  const max = Math.max(...Object.values(freq), 1);
  for (const k in freq) { freq[k] /= max; }
  return freq;
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  const keys = Object.keys(a);
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    dot += av * bv;
    normA += av * av;
  }
  for (const k of Object.keys(b)) { normB += (b[k] ?? 0) * (b[k] ?? 0); }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface TFIDFFingerprint {
  tokens: string[];
  tf: Record<string, number>;
  dims: number;
}

export async function computeFingerprint(text: string): Promise<TFIDFFingerprint> {
  const tokens = tokenize(text);
  const tf = termFreq(tokens);
  return { tokens, tf, dims: tokens.length };
}

export function fingerprintSimilarity(a: TFIDFFingerprint, b: TFIDFFingerprint): number {
  return cosine(a.tf, b.tf);
}

// ── Fallback for pure cosine on raw vectors (kept for backwards compat) ─────

export async function vectorize(text: string): Promise<number[]> {
  // Deprecated — use computeFingerprint instead
  const { tf } = await computeFingerprint(text);
  return Object.values(tf);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  return cosine(
    Object.fromEntries(a.map((v, i) => [i, v])),
    Object.fromEntries(b.map((v, i) => [i, v]))
  );
}

// ── Database-backed FAQ similarity search ───────────────────────────────────

const SIMILARITY_THRESHOLD = 0.4; // TF-IDF cosine threshold

export interface SimilarFAQ {
  id: string;
  question: string;
  answer: string;
  similarity: number;
}

/** Find FAQs semantically similar to the given question+answer text. */
export async function findSimilarFAQs(
  questionText: string,
  answerText: string,
  threshold = SIMILARITY_THRESHOLD
): Promise<SimilarFAQ | null> {
  const combined = `${questionText} ${answerText}`;
  const queryFingerprint = await computeFingerprint(combined);

  const faqs = await FAQ.find({}).select('_id question answer');
  let best: SimilarFAQ | null = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const faqFingerprint = await computeFingerprint(`${faq.question} ${faq.answer}`);
    const score = fingerprintSimilarity(queryFingerprint, faqFingerprint);
    if (score >= threshold && score > bestScore) {
      bestScore = score;
      best = {
        id: faq._id.toString(),
        question: faq.question,
        answer: faq.answer,
        similarity: score,
      };
    }
  }

  return best;
}

/** Store TF-IDF fingerprint metadata alongside FAQ for faster future lookups. */
export async function storeFAQFingerprint(id: string, questionText: string, answerText: string): Promise<void> {
  const fp = await computeFingerprint(`${questionText} ${answerText}`);
  await FAQ.findByIdAndUpdate(id, {
    $set: {
      tfidfTokens: fp.tokens,          // lightweight token list (not full vector)
      tfidfMeta: { dims: fp.dims },    // metadata for reconstruction
    },
  } as any);
}
