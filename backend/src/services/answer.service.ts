import { Answer } from '../models/Answer.js';
import { Vote } from '../models/Vote.js';
import { Question } from '../models/Question.js';
import { Notification } from '../models/Notification.js';
import { FAQ } from '../models/FAQ.js';
import { addNotifyJob } from '../queues/notifyUser.js';
import { findSimilarFAQs } from '../ai/embeddings.js';
import { createFAQWithEmbedding } from './faq.service.js';

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeAnswer(a: any) {
  const authorId = a.authorId;
  const questionId = a.questionId;
  return {
    id: a._id.toString(),
    body: a.body,
    status: a.status,
    isApproved: a.isApproved,
    upvotes: a.upvotes ?? a.voteScore ?? 0,
    voteScore: a.voteScore ?? 0,
    moderationScore: a.moderationScore,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    authorId: typeof authorId === 'object' ? authorId._id.toString() : authorId?.toString(),
    author: typeof authorId === 'object' ? { id: authorId._id.toString(), name: authorId.name, email: authorId.email } : undefined,
    questionId: typeof questionId === 'object' ? questionId._id.toString() : questionId?.toString(),
    question: typeof questionId === 'object' ? { id: questionId._id.toString(), title: questionId.title } : undefined,
  };
}

// ── Core operations ────────────────────────────────────────────────────────

export async function getAnswerById(id: string) {
  const answer = await Answer.findById(id).populate('authorId', 'name email').populate('questionId', 'title');
  return answer ? normalizeAnswer(answer) : null;
}

export async function approveAnswer(id: string) {
  // Populate author and question info (needed for all branches)
  const populated = await Answer.findById(id)
    .populate<{ authorId: { _id: string; name: string }; questionId: { _id: string; title: string; tags: string[] } }>('authorId', 'name')
    .populate('questionId', 'title tags') as any;

  if (!populated) return null;

  const rawAnswer = await Answer.findById(id).select('questionId');
  const qId: string = rawAnswer?.questionId?.toString() ?? '';
  const qTitle: string = populated.questionId?.title ?? '';
  const qTags: string[] = populated.questionId?.tags ?? [];
  const authorId: string = populated.authorId?._id?.toString() ?? populated.authorId?.toString() ?? '';

  // ── Check semantic similarity BEFORE any DB changes ──────────────────────
  if (qId) {
    const similar = await findSimilarFAQs(qTitle, populated.body);
    if (similar) {
      // Do NOT create a duplicate FAQ — answer is blocked
      return {
        answer: null,
        questionStatus: null,
        duplicate: true,
        existingFAQ: similar,
      };
    }
  }

  // ── No duplicate — proceed with real approval ─────────────────────────────
  await Answer.findByIdAndUpdate(id, { isApproved: true, status: 'APPROVED' });

  if (qId) {
    await addNotifyJob({
      userId: authorId,
      type: 'ANSWER_APPROVED',
      message: 'Your answer on "' + qTitle + '" was approved!',
      link: '/questions/' + qId,
    });

    await createFAQWithEmbedding(qTitle, populated.body, qTags, authorId);

    const approvedCount = await Answer.countDocuments({ questionId: qId, isApproved: true });
    if (approvedCount === 1) {
      await Question.findByIdAndUpdate(qId, { status: 'ANSWERED' });

      const remaining = await Answer.find({ questionId: qId, isApproved: false, status: 'PENDING' })
        .select('authorId questionId');
      for (const a of remaining) {
        await addNotifyJob({
          userId: a.authorId.toString(),
          type: 'ANSWER_REJECTED',
          message: 'Your answer on "' + qTitle + '" was not selected. Another answer was chosen for the FAQ.',
          link: '/questions/' + qId,
        });
      }
      await Answer.deleteMany({ questionId: qId, isApproved: false, status: 'PENDING' });
    }
  }

  const normalized = await Answer.findById(id)
    .populate('authorId', 'name email')
    .populate('questionId', 'title');

  const normQId: string = normalized?.questionId
    ? (normalized.questionId as any)._id?.toString() ?? String(normalized.questionId)
    : '';

  const updatedQuestion = normQId ? await Question.findById(normQId).select('status') : null;

  return {
    answer: normalized ? normalizeAnswer(normalized) : null,
    questionStatus: updatedQuestion?.status ?? null,
  };
}

export async function rejectAnswer(id: string) {
  await Answer.findByIdAndDelete(id);
  return { deleted: true, id };
}

export async function voteAnswer(answerId: string, userId: string, type: 'UP' | 'DOWN') {
  const existing = await Vote.findOne({ userId, targetId: answerId });

  if (existing) {
    if (existing.type === type) {
      await existing.deleteOne();
      const delta = type === 'UP' ? -1 : 1;
      return Answer.findByIdAndUpdate(answerId, { $inc: { voteScore: delta } }, { new: true });
    } else {
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
    Answer.find({ status: 'PENDING' })
      .populate('authorId', 'name email')
      .populate('questionId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Answer.countDocuments({ status: 'PENDING' }),
  ]);
  return { answers: answers.map(normalizeAnswer), total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Add answer to FAQ without approving ───────────────────────────────────

export async function addAnswerToFAQ(id: string) {
  const answer = await Answer.findById(id)
    .populate('authorId', 'name')
    .populate('questionId', 'title tags') as any;

  if (!answer) return null;

  const qTitle = answer.questionId?.title ?? 'Untitled Question';
  const qTags = answer.questionId?.tags ?? [];

  // Semantic dedup before creating
  const similar = await findSimilarFAQs(qTitle, answer.body);
  if (similar) {
    return {
      id: similar.id,
      question: similar.question,
      answer: similar.answer,
      tags: [],
      searchCount: 0,
      authorId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      duplicate: true,
      existingSimilarity: similar.similarity,
    };
  }

  const faq = await FAQ.create({
    question: qTitle,
    answer: answer.body,
    tags: qTags,
    authorId: answer.authorId?._id ?? answer.authorId,
  });

  return {
    id: faq._id.toString(),
    question: faq.question,
    answer: faq.answer,
    tags: faq.tags ?? [],
    searchCount: faq.searchCount ?? 0,
    authorId: faq.authorId?.toString(),
    createdAt: faq.createdAt,
    updatedAt: faq.updatedAt,
  };
}