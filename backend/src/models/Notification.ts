import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'ANSWER_RECEIVED' | 'ANSWER_APPROVED' | 'QUESTION_RESOLVED' | 'FAQ_PUBLISHED' | 'UPVOTE_RECEIVED' | 'MENTION';
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['ANSWER_RECEIVED', 'ANSWER_APPROVED', 'QUESTION_RESOLVED', 'FAQ_PUBLISHED', 'UPVOTE_RECEIVED', 'MENTION'],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);