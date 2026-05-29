import mongoose, { Schema, Document } from 'mongoose';
import { IAnswer } from './Answer.js';

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';
  authorId: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['OPEN', 'ANSWERED', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

questionSchema.index({ title: 'text', body: 'text', tags: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);