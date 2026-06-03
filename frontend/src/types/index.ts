// User roles match backend User model (no MODERATOR — STUDENT | ADMIN only)
export type UserRole = "STUDENT" | "ADMIN";

// Question status matches backend Question model
export type QuestionStatus = "OPEN" | "ANSWERED" | "RESOLVED" | "CLOSED";

// Answer status matches backend Answer model
export type AnswerStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  authorId: string;
  author: Pick<User, "id" | "name" | "avatarUrl">;
  status: QuestionStatus;
  tags: string[];
  upvotes: number;
  views: number;
  answerCount: number;
  hasAcceptedAnswer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  author: Pick<User, "id" | "name" | "avatarUrl">;
  body: string;
  isApproved?: boolean;
  status?: AnswerStatus;
  voteScore?: number;
  upvotes?: number;
  downvotes?: number;
  moderationScore?: number;
  createdAt: string;
  updatedAt: string;
}

// FAQ — backend stores as { question, answer }. id normalizes _id → id.
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  searchCount: number;
  authorId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "answer_received" | "answer_approved" | "faq_published" | "upvote_milestone" | "review_needed";
  referenceId: string;
  isRead: boolean;
  createdAt: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  body: string;
  tags: string[];
  similarity: number;
  answerCount: number;
  type: "faq" | "question";
}