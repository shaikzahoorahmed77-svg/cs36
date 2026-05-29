import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  tags: string[];
  authorId?: mongoose.Types.ObjectId;
  searchCount: number;
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
  },
  { timestamps: true }
);

faqSchema.index({ question: 'text', answer: 'text', tags: 1 });

export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);