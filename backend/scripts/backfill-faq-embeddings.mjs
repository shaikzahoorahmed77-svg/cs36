// One-time migration: add embeddings to all existing FAQs (sequential, batched)
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { vectorize } from '../src/ai/embeddings.js';

const client = new MongoClient(process.env.DATABASE_URL);
await client.connect();
const db = client.db();

const faqs = await db.collection('faqs').find({ embedding: { $exists: false } }).toArray();
console.log(`Backfilling ${faqs.length} FAQs...`);

const BATCH = 20;
for (let i = 0; i < faqs.length; i += BATCH) {
  const batch = faqs.slice(i, i + BATCH);
  for (const faq of batch) {
    const text = `${faq.question} ${faq.answer}`;
    const embedding = await vectorize(text);
    await db.collection('faqs').updateOne(
      { _id: faq._id },
      { $set: { embedding } }
    );
  }
  console.log(`  ${Math.min(i + BATCH, faqs.length)}/${faqs.length} done`);
}

console.log(`✅ All ${faqs.length} FAQs backfilled`);
const sample = await db.collection('faqs').findOne({ embedding: { $exists: true, $ne: [] } });
if (sample) console.log(`Sample dims: ${sample.embedding.length} | vec[0]: ${sample.embedding[0]}`);
await client.close();
