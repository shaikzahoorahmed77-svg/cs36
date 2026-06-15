/**
 * Seed VINS programme FAQs into MongoDB.
 *
 * Run AFTER seed.js:
 *   node --experimental-vm-modules scripts/seed-faqs.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/internship_platform';
const FAQ_FILE  = join(__dirname, '../../VINS_FAQ_QA.txt');

// ─── FAQ model (mirrors backend/src/models/FAQ.ts) ────────────────────────────
const faqSchema = new mongoose.Schema(
  {
    question:    { type: String, required: true },
    answer:      { type: String, required: true },
    tags:        { type: [String], default: [] },
    searchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
// No schema-level indexes here — we manage them manually below after connecting

const FAQ = mongoose.model('FAQ', faqSchema);

// ─── Section → tag mapping ────────────────────────────────────────────────────
const SECTION_TAGS = {
  '1. ABOUT THE INTERNSHIP':                                        ['about', 'internship', 'vins'],
  '2. TIMING AND DATES':                                             ['timing', 'dates', 'schedule'],
  '3. NOC (NO OBJECTION CERTIFICATE)':                               ['noc', 'eligibility', 'documentation'],
  '4. SELECTION, OFFER LETTER, AND CERTIFICATE':                     ['selection', 'offer-letter', 'certificate'],
  '5. WORK, MENTORSHIP, AND PROJECTS':                               ['work', 'mentorship', 'projects'],
  '6. CODE OF CONDUCT — COMMUNICATION CHANNELS':                     ['conduct', 'communication', 'channels'],
  '7. INTERVIEWS RELATED':                                           ['interviews'],
  '8. CERTIFICATE':                                                  ['certificate', 'completion'],
  '9. ROSETTA — YOUR INTERNSHIP JOURNAL':                            ['rosetta', 'journal', 'reflection'],
  '10. PHASE 1 — COURSEWORK, VIBE LMS, AND LIVE SESSIONS':           ['phase-1', 'coursework', 'vibe', 'lms'],
  '11. YAKSHA CHAT RELATED':                                         ['yaksha', 'chat', 'support'],
  '12. VIBE PLATFORM':                                               ['vibe', 'platform', 'lms', 'video', 'proctoring'],
  '13. TEAM FORMATION':                                              ['team', 'team-formation', 'projects'],
};

// ─── Parser ───────────────────────────────────────────────────────────────────
// Splits the raw file into { header → body } blocks.
function splitIntoSections(text) {
  const blocks = {};

  // Each section starts with "N. SECTION NAME\n======..."  (3 or more = chars)
  // Be tolerant of CRLF (Windows) line endings and allow a header at file start
  const sectionHeaderRegex = /(?:^|\r?\n)(\d+\.\s+[^\r\n]+)\r?\n={3,}\r?\n/g;

  const matches = [...text.matchAll(sectionHeaderRegex)];
  for (let i = 0; i < matches.length; i++) {
    const header = matches[i][1].trim();
    const start  = matches[i].index + matches[i][0].length;
    const end    = matches[i + 1]?.index ?? text.length;
    const body   = text.slice(start, end).trim();
    if (header && body) blocks[header] = body;
  }

  return blocks;
}

// Parses Q&A pairs from a section body.
function parseQAs(body) {
  const pairs = [];

  // Match "Q<num>.<num>: Question\nA: Answer" up until the next Q or end.
  // Allow CRLF windows line endings in the lookahead and A: separator.
  const qaRe = /(Q\d+\.\d+):\s+(.+?)\r?\nA:\s+([\s\S]*?)(?=\r?\nQ\d+\.\d+:|$)/g;

  let m;
  while ((m = qaRe.exec(body)) !== null) {
    const question = m[2].trim();
    const answer   = m[3].trim().replace(/\n+$/, '');
    if (question && answer) {
      pairs.push({ q: question, a: answer });
    }
  }

  return pairs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const rawText = readFileSync(FAQ_FILE, 'utf-8');

  const sections = splitIntoSections(rawText);
  const sectionNames = Object.keys(sections);
  console.log(`[seed-faqs] Found ${sectionNames.length} sections`);

  const faqDocs = [];

  for (const [section, body] of Object.entries(sections)) {
    const tags = SECTION_TAGS[section] ?? ['general'];
    const qas  = parseQAs(body);

    if (qas.length === 0) {
      console.warn(`[seed-faqs] ⚠ No Q&A pairs found in section: "${section}"`);
      continue;
    }

    console.log(`[seed-faqs] "${section}" → ${qas.length} Q&A pair(s)`);

    for (const { q, a } of qas) {
      faqDocs.push({ question: q, answer: a, tags });
    }
  }

  if (faqDocs.length === 0) {
    console.error('[seed-faqs] No FAQs parsed — check the file path and format');
    process.exit(1);
  }

  console.log(`\n[seed-faqs] Total FAQs to insert: ${faqDocs.length}`);

  // ── MongoDB ──────────────────────────────────────────────────────────────
  await mongoose.connect(MONGO_URI);
  console.log('[seed-faqs] Connected to MongoDB');

  // Drop and recreate the text index (old one incorrectly included 'tags' array)
  const db = mongoose.connection.db;
  try {
    // Drop whatever text index exists — might be named differently
    const indexes = await db.collection('faqs').indexes();
    for (const idx of indexes) {
      if (idx.key && typeof idx.key === 'object') {
        const keyStr = JSON.stringify(idx.key);
        if (keyStr.includes('"$**"') || Object.values(idx.key).includes('text')) {
          await db.collection('faqs').dropIndex(idx.name);
          console.log(`[seed-faqs] ✓ Dropped text index: ${idx.name}`);
        }
      }
    }
  } catch (err) {
    console.warn('[seed-faqs] ℹ Could not drop indexes:', err.message);
  }

  // Recreate clean text index (tags is an array — can't be in text index)
  await db.collection('faqs').createIndex(
    { question: 'text', answer: 'text' },
    { name: 'faq_text_search' }
  );
  console.log('[seed-faqs] ✓ Created clean faq_text_search index');

  // De-duplicate against existing questions
  const existing = await FAQ.find({}, { question: 1 }).lean();
  const existingSet = new Set(existing.map(e => e.question.trim()));
  const newDocs = faqDocs.filter(d => !existingSet.has(d.question.trim()));

  console.log(`[seed-faqs] ${existingSet.size} already in DB, ${newDocs.length} new`);

  if (newDocs.length > 0) {
    const result = await FAQ.insertMany(newDocs, { ordered: false });
    console.log(`[seed-faqs] ✓ Inserted ${result.length} FAQs`);
  } else {
    console.log('[seed-faqs] ℹ All FAQs already exist — nothing to insert');
  }

  const totalCount = await FAQ.countDocuments();
  console.log(`[seed-faqs] ✅ Total FAQs in DB: ${totalCount}`);

  await mongoose.disconnect();
  console.log('[seed-faqs] Done!');
}

main().catch(err => {
  console.error('[seed-faqs] Error:', err);
  process.exit(1);
});