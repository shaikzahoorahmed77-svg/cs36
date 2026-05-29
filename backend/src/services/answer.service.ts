import { Answer } from '../models/Answer.js';
import { Vote } from '../models/Vote.js';
import { Question } from '../models/Question.js';
import { Notification } from '../models/Notification.js';
import { FAQ } from '../models/FAQ.js';
import { addNotifyJob } from '../queues/notifyUser.js';

export async function getAnswerById(id: string) {
  return Answer.findById(id).populate('authorId', 'name email').populate('questionId', 'title') as any;
}

export async function approveAnswer(id: string) {
  const answer = await Answer.findByIdAndUpdate(id, { isApproved: true, status: 'APPROVED' }, { new: true });

  if (answer) {
    const populated = await Answer.findById(id)
      .populate('authorId', 'name')
      .populate('questionId', 'title tags') as any;

    if (populated) {
      const authorId = populated.authorId?._id?.toString() ?? answer.authorId.toString();
      const qTitle = populated.questionId?.title ?? '';
      const qId = populated.questionId?._id?.toString();
      const qTags = populated.questionId?.tags ?? [];

      await addNotifyJob({
        userId: authorId,
        type: 'ANSWER_APPROVED',
        message: `Your answer on "${qTitle}" was approved!`,
        link: qId ? `/questions/${qId}` : undefined,
      });

      await FAQ.create({ question: qTitle, answer: answer.body, tags: qTags, authorId: answer.authorId });
    }
  }

  return answer;
}

export async function rejectAnswer(id: string) {
  return Answer.findByIdAndUpdate(id, { status: 'REJECTED', isApproved: false }, { new: true });
}

export async function voteAnswer(answerId: string, userId: string, type: 'UP' | 'DOWN') {
  const existing = await Vote.findOne({ userId, targetId: answerId });

  if (existing) {
    if (existing.type === type) {
      // Undo vote
      await existing.deleteOne();
      const delta = type === 'UP' ? -1 : 1;
      return Answer.findByIdAndUpdate(answerId, { $inc: { voteScore: delta } }, { new: true });
    } else {
      // Change direction
      await Vote.updateOne({ _id: existing._id }, { type });
      const delta = type === 'UP' ? 2 : -2;
      return Answer.findByIdAndUpdate(answerId, { $inc: { voteScore: delta } }, { new: true });
    }
  }

  await Vote.create({ userId, targetId: answerId, type });
  const delta = type === 'UP' ? 1 : -1;
  return Answer.findByIdAndUpdate(answerId, { $inc: { voteScore: delta } }, { new: true });
}

export async function listPendingAnswers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [answers, total] = await Promise.all([
    Answer.find({ status: 'PENDING' }).populate('author', 'name email').populate('question', 'title')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Answer.countDocuments({ status: 'PENDING' }),
  ]);
  return { answers, total, page, limit, totalPages: Math.ceil(total / limit) };
}