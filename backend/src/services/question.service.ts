import { Question } from '../models/Question.js';
import { Answer } from '../models/Answer.js';
import { User } from '../models/User.js';
import { addModerationJob } from '../queues/moderateAnswer.js';
import { addNotifyJob } from '../queues/notifyUser.js';

// ── Normalizers ──────────────────────────────────────────
// Transform Mongoose docs to the shape the frontend expects.
//
// Frontend Question type:
//   { id, title, body, authorId, author: { id, name }, status,
//     tags, upvotes, views, answerCount, hasAcceptedAnswer, createdAt, updatedAt }
//
// Backend (Mongoose) returns:
//   { _id, title, body, authorId: { _id, name, email }, status,
//     tags, upvotes, views, answerCount, hasAcceptedAnswer, createdAt, updatedAt }

function normalizeQuestion(q: any) {
  const authorId = q.authorId;
  return {
    id: q._id.toString(),
    title: q.title,
    body: q.body,
    authorId: typeof authorId === 'object' ? authorId._id.toString() : authorId?.toString(),
    author: typeof authorId === 'object' ? { id: authorId._id.toString(), name: authorId.name } : undefined,
    status: q.status,
    tags: q.tags ?? [],
    upvotes: q.upvotes ?? 0,
    views: q.views ?? 0,
    answerCount: q.answerCount ?? 0,
    hasAcceptedAnswer: q.hasAcceptedAnswer ?? false,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

function normalizeAnswer(a: any) {
  const authorId = a.authorId;
  return {
    id: a._id.toString(),
    questionId: a.questionId?.toString(),
    authorId: typeof authorId === 'object' ? authorId._id.toString() : authorId?.toString(),
    author: typeof authorId === 'object' ? { id: authorId._id.toString(), name: authorId.name } : undefined,
    body: a.body,
    upvotes: a.upvotes ?? a.voteScore ?? 0,
    status: a.status,
    isApproved: a.isApproved,
    createdAt: a.createdAt,
    moderationScore: a.moderationScore,
  };
}

// ── Service functions ─────────────────────────────────────

export async function createQuestion({
  title, body, tags, authorId,
}: { title: string; body: string; tags: string[]; authorId: string }) {
  const question = await Question.create({ title, body, tags, authorId });

  // Notify all admins about the new question
  try {
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    for (const admin of admins) {
      await addNotifyJob({
        userId: admin._id.toString(),
        type: 'NEW_QUESTION_ASKED',
        message: `New question asked: "${title}"`,
        link: `/questions/${question._id.toString()}`,
      });
    }
  } catch (err) {
    console.error('[createQuestion/notifyAdmins]', err);
  }

  const populated = await Question.findById(question._id).populate('authorId', 'name email');
  return normalizeQuestion(populated);
}

export async function getQuestionById(id: string) {
  const question = await Question.findById(id).populate('authorId', 'name email');
  if (!question) return null;

  // Fetch answer count (all answers)
  const answerCount = await Answer.countDocuments({ questionId: id });

  // Fetch all answers (including pending)
  const answersRaw = await Answer.find({ questionId: id })
    .populate('authorId', 'name')
    .sort({ voteScore: -1 });

  const normalized = normalizeQuestion(question);
  return {
    ...normalized,
    answerCount,
    answers: answersRaw.map(normalizeAnswer),
  };
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
    Question.find(filter).populate('authorId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Question.countDocuments(filter),
  ]);

  const normalized = questions.map(q => {
    const n = normalizeQuestion(q);
    // Attach answerCount (approved answers only)
    return { ...n, answerCount: 0 }; // we don't await per-question counts for list — can be lazy-loaded
  });

  return { questions: normalized, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function markQuestionResolved(id: string) {
  const question = await Question.findByIdAndUpdate(id, { status: 'RESOLVED', resolvedAt: new Date() }, { new: true });
  return question ? normalizeQuestion(question) : null;
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
    // Notify the question author
    await addNotifyJob({
      userId: question.authorId.toString(),
      type: 'ANSWER_RECEIVED',
      message: `New answer on: "${question.title}"`,
      link: `/questions/${questionId}`,
    });

    // Notify all admins about the new answer pending review
    try {
      const admins = await User.find({ role: 'ADMIN' }).select('_id');
      for (const admin of admins) {
        await addNotifyJob({
          userId: admin._id.toString(),
          type: 'NEW_ANSWER_PENDING',
          message: `New answer submitted for review on: "${question.title}"`,
          link: `/admin/answers/pending`,
        });
      }
    } catch (err) {
      console.error('[submitAnswer/notifyAdmins]', err);
    }
  }

  const populated = await Answer.findById(answer._id).populate('authorId', 'name');
  return normalizeAnswer(populated);
}