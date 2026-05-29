import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  type: 'UP' | 'DOWN';
  createdAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ['UP', 'DOWN'], required: true },
  },
  { timestamps: true }
);

voteSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', voteSchema);