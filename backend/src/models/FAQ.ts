import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  tags: string[];
  authorId?: mongoose.Types.ObjectId;
  searchCount: number;
  embedding?: number[]; // deprecated — TF-IDF tokens used instead
  tfidfTokens?: string[]; // lightweight token set for TF-IDF similarity
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    tags: { type: [String], default: [] },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    searchCount: { type: Number, default: 0 },
    embedding: { type: [Number], default: undefined }, // kept for backwards compat
    tfidfTokens: { type: [String], default: [] }, // normalized token set for similarity
  },
  { timestamps: true }
);

// tags excluded from text index — MongoDB text indexes can't include array fields
// Only 'question' and 'answer' are indexed as text
faqSchema.index({ question: 'text', answer: 'text' }, { name: 'faq_text_search' });
// Regular index for tag filtering (tags is an array field)
faqSchema.index({ tags: 1 });

export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);