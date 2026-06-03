"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, ArrowUp, ArrowLeft, Search, ChevronDown, ChevronUp } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/toaster";

type QuestionStatus = "OPEN" | "ANSWERED" | "RESOLVED" | "CLOSED";

interface Answer {
  id: string;
  body: string;
  status: string;
  isApproved: boolean;
  voteScore: number;
  createdAt: string;
  author?: { id: string; name: string; email?: string };
}

interface Question {
  _id: string;
  title: string;
  body: string;
  status: QuestionStatus;
  tags: string[];
  upvotes: number;
  answerCount: number;
  createdAt: string;
  authorId?: { _id: string; name: string; email: string };
}

const STATUS_CONFIG: Record<QuestionStatus, { label: string; variant: "warning" | "secondary" | "success" | "destructive" }> = {
  OPEN:     { label: "Open",     variant: "warning" },
  ANSWERED: { label: "Answered", variant: "secondary" },
  RESOLVED: { label: "Resolved", variant: "success" },
  CLOSED:   { label: "Closed",   variant: "destructive" },
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Expanded question — shows its answers
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [answersLoading, setAnswersLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { addToast } = useToast();

  const fetchQuestions = (resetPage = false) => {
    setLoading(true);
    const targetPage = resetPage ? 1 : page;
    adminApi.getAllQuestions({
      page: targetPage,
      search: search || undefined,
    }).then(r => {
      setQuestions(r.data.questions);
      setTotal(r.data.total);
      setTotalPages(r.data.totalPages);
      if (resetPage) setPage(1);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, [page, search]);

  const loadAnswers = (qId: string) => {
    if (answers[qId]) { setExpandedQ(expandedQ === qId ? null : qId); return; }
    setAnswersLoading(qId);
    adminApi.getQuestionAnswers(qId).then(r => {
      setAnswers(prev => ({ ...prev, [qId]: r.data.answers }));
      setExpandedQ(qId);
    }).catch(() => {
      addToast({ title: "Failed to load answers", variant: "error" });
    }).finally(() => setAnswersLoading(null));
  };

  const handleApprove = async (qId: string, aId: string) => {
    setActionLoading(aId);
    try {
      const r = await adminApi.approveAnswer(aId);
      if (r.data.duplicate) {
        const sim = r.data.existingFAQ;
        addToast({
          title: "Similar FAQ already exists",
          description: `"${sim.question.slice(0, 55)}" (${Math.round(sim.similarity * 100)}% match) — answer kept in queue.`,
          variant: "warning",
        });
        // Answer stays PENDING in the queue — don't filter it out
      } else {
        const qTitle = questions.find(q => q._id === qId)?.title ?? "the question";
        addToast({ title: "Answer approved", description: `Added to FAQ: "${qTitle.slice(0, 50)}"`, variant: "success" });
      }
      setAnswers(prev => ({ ...prev, [qId]: prev[qId].filter(a => a.id !== aId) }));
      fetchQuestions();
    } catch (err: any) {
      const sim = err?.response?.data?.existingFAQ;
      const status = err?.response?.status;
      if (status === 409 && sim) {
        addToast({
          title: "Similar FAQ already exists",
          description: `"${sim.question.slice(0, 55)}" (${Math.round((sim.similarity ?? 0) * 100)}% match) — answer kept in queue.`,
          variant: "warning",
        });
        // Answer is still PENDING — don't remove it
      } else {
        addToast({ title: "Failed to approve", description: err?.response?.data?.error ?? "Something went wrong", variant: "error" });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (qId: string, aId: string) => {
    setActionLoading(aId);
    try {
      await adminApi.rejectAnswer(aId);
      addToast({ title: "Answer rejected and removed", variant: "default" });
      setAnswers(prev => ({ ...prev, [qId]: prev[qId].filter(a => a.id !== aId) }));
      fetchQuestions();
    } catch {
      addToast({ title: "Failed to reject", variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
        <p className="text-muted-foreground text-sm mt-1">Review questions and moderate their answers</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">No questions found</CardContent>
          </Card>
        ) : (
          questions.map(q => (
            <Card key={q._id} className="overflow-hidden">
              <CardContent className="p-5">
                {/* Question row — always visible */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">{q.upvotes}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge variant={STATUS_CONFIG[q.status].variant} className="text-[10px]">
                        {STATUS_CONFIG[q.status].label}
                      </Badge>
                      {q.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {q.answerCount} answer{q.answerCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 className="font-medium text-sm leading-snug mb-1">{q.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{q.body}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{q.authorId?.name ?? "Unknown"}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(q.createdAt)}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-7"
                        onClick={() => loadAnswers(q._id)}
                        disabled={answersLoading === q._id}
                      >
                        {answersLoading === q._id ? "Loading..." :
                         expandedQ === q._id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {expandedQ === q._id ? "Hide" : "Show"} Answers
                        {q.answerCount > 0 && ` (${q.answerCount})`}
                      </Button>
                    </div>

                    {/* Expanded answers */}
                    {expandedQ === q._id && (
                      <div className="mt-4 border-t pt-4 space-y-3">
                        {(answers[q._id] ?? []).length === 0 ? (
                          <div className="text-sm text-muted-foreground text-center py-6">No answers yet</div>
                        ) : (
                          (answers[q._id] ?? []).map(a => (
                            <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-muted/40 border">
                              {/* Vote count */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-bold">{a.voteScore}</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm leading-relaxed">{a.body}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {a.author?.name ?? "Unknown"} · {formatRelativeTime(a.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 shrink-0">
                                <Button
                                  size="sm"
                                  variant="success"
                                  className="gap-1.5 h-8 text-xs"
                                  onClick={() => handleApprove(q._id, a.id)}
                                  disabled={actionLoading === a.id}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1.5 h-8 text-xs"
                                  onClick={() => handleReject(q._id, a.id)}
                                  disabled={actionLoading === a.id}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
