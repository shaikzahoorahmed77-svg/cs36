import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  _id: mongoose.Types.ObjectId;
  body: string;
  authorId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  isApproved: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    body: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    isApproved: { type: Boolean, default: false },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    voteScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

answerSchema.index({ questionId: 1, status: 1, voteScore: -1 });

export const Answer = mongoose.model<IAnswer>('Answer', answerSchema);