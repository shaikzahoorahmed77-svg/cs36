export type UserRole = "student" | "moderator" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type QuestionStatus = "unresolved" | "resolved" | "duplicate";
export type AnswerStatus = "pending" | "approved" | "rejected" | "flagged";

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
  hasAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  author: Pick<User, "id" | "name" | "avatarUrl">;
  body: string;
  status: AnswerStatus;
  upvotes: number;
  downvotes: number;
  moderationScore?: number;
  createdAt: string;
}

export interface FAQ {
  id: string;
  questionId: string;
  answerId: string;
  title: string;
  body: string;
  tags: string[];
  searchCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "answer_received" | "answer_approved" | "faq_published" | "upvote_milestone" | "review_needed";
  referenceId: string;
  read: boolean;
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