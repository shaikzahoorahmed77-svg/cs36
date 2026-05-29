import { Question } from '../models/Question.js';
import { Answer } from '../models/Answer.js';
import { User } from '../models/User.js';
import { addModerationJob } from '../queues/moderateAnswer.js';
import { addNotifyJob } from '../queues/notifyUser.js';

export async function createQuestion({
  title, body, tags, authorId,
}: { title: string; body: string; tags: string[]; authorId: string }) {
  const question = await Question.create({ title, body, tags, authorId });
  const populated = await Question.findById(question._id).populate('author', 'name email');
  return populated;
}

export async function getQuestionById(id: string) {
  return Question.findById(id)
    .populate('author', 'name email')
    .populate({
      path: 'answers',
      match: { isApproved: true },
      options: { sort: { voteScore: -1 } },
      populate: { path: 'author', select: 'name' },
    });
}

export async function listQuestions({
  page = 1, limit = 20, status, tag, authorId,
}: {
  page?: number; limit?: number; status?: string; tag?: string; authorId?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (tag) filter.tags = tag;
  if (authorId) filter.authorId = authorId;

  const skip = (page - 1) * limit;
  const [questions, total] = await Promise.all([
    Question.find(filter).populate('author', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Question.countDocuments(filter),
  ]);

  return { questions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function markQuestionResolved(id: string) {
  return Question.findByIdAndUpdate(id, { status: 'RESOLVED', resolvedAt: new Date() }, { new: true });
}

export async function deleteQuestion(id: string, userId: string) {
  const question = await Question.findById(id);
  if (!question) throw new Error('NOT_FOUND');
  if (question.authorId.toString() !== userId) throw new Error('FORBIDDEN');
  await question.deleteOne();
}

export async function submitAnswer({ body, questionId, authorId }: { body: string; questionId: string; authorId: string }) {
  const answer = await Answer.create({ body, questionId, authorId });
  await addModerationJob({ answerId: answer._id.toString(), body });

  const question = await Question.findById(questionId).select('authorId title');
  if (question) {
    await addNotifyJob({
      userId: question.authorId.toString(),
      type: 'ANSWER_RECEIVED',
      message: `New answer on: "${question.title}"`,
      link: `/questions/${questionId}`,
    });
  }

  return Answer.findById(answer._id).populate('author', 'name');
}