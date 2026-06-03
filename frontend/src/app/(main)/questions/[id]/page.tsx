"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUp, CheckCircle, Clock, Eye, MessageSquare, Share2, Flag, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, cn } from "@/lib/utils";
import { questionsApi, answersApi, getUser } from "@/lib/api";
import type { Question, Answer } from "@/types";

const statusConfig = {
  OPEN:     { label: "Open",     variant: "warning" as const },
  ANSWERED: { label: "Answered", variant: "secondary" as const },
  RESOLVED: { label: "Resolved", variant: "success" as const },
  CLOSED:   { label: "Closed",   variant: "outline" as const },
};

function QuestionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  const currentUser = getUser();

  useEffect(() => {
    if (!id) return;
    questionsApi
      .get(id)
      .then(res => {
        setQuestion(res.data);
        setAnswers(res.data.answers ?? []);
      })
      .catch(err => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (answerId: string) => {
    if (voted[answerId]) return;
    try {
      await answersApi.upvote(answerId);
      setAnswers(prev =>
        prev.map(a =>
          a.id === answerId
            ? { ...a, upvotes: (a.upvotes ?? a.voteScore ?? 0) + 1 }
            : a
        )
      );
      setVoted(prev => ({ ...prev, [answerId]: true }));
    } catch {
      // Revert optimistic state on failure
      setVoted(prev => { const n = { ...prev }; delete n[answerId]; return n; });
      alert("Failed to register vote. Please try again.");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerBody.trim() || !question) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await questionsApi.submitAnswer(question.id, answerBody);
      setAnswers(prev => [...prev, res.data]);
      setAnswerBody("");
      // Refresh question to pick up any status change
      const q = await questionsApi.get(question.id);
      setQuestion(q.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to submit answer. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (name?: string) =>
    (name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const questionStatus = question ? (statusConfig[question.status] ?? statusConfig.OPEN) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !question) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
        <p className="text-muted-foreground">Question not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/questions")}>
          Back to questions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Question */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {questionStatus && (
            <Badge variant={questionStatus.variant}>{questionStatus.label}</Badge>
          )}
          {question.tags.map((t: string) => (
            <Badge key={t} variant="outline">{t}</Badge>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
          {question.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Asked {formatRelativeTime(question.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {question.views.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5" />
            {question.upvotes} votes
          </span>
        </div>

        <div className="prose max-w-none text-sm leading-relaxed mb-4">
          {question.body}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials(question.author?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{question.author?.name ?? "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Flag className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4" />
          {answers.length} Answer{answers.length !== 1 ? "s" : ""}
        </h2>

        {answers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No answers yet — be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer, i) => {
              const upvotes = answer.upvotes ?? answer.voteScore ?? 0;
              const isAccepted = !!(answer.isApproved || answer.status === "APPROVED");

              return (
                <Card key={answer.id} className={cn(isAccepted && "border-accent/40")}>
                  {isAccepted && (
                    <div className="px-5 pt-3 pb-0">
                      <Badge variant="success" className="text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted Answer
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleVote(answer.id)}
                          disabled={!!voted[answer.id]}
                          className={cn(
                            "flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50",
                            voted[answer.id] ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          <ArrowUp className="h-5 w-5" />
                          <span className="text-sm font-bold">{upvotes}</span>
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-secondary/10 text-secondary">
                              {initials(answer.author?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{answer.author?.name ?? "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground">
                            answered {formatRelativeTime(answer.createdAt)}
                          </span>
                          {answer.moderationScore != null && answer.moderationScore > 0.5 && (
                            <Badge variant="warning" className="text-[10px]">Under Review</Badge>
                          )}
                        </div>
                        <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-line">
                          {answer.body}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit answer — hidden for ANSWERED/RESOLVED/CLOSED questions */}
      {question.status === 'OPEN' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Answer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive flex items-center justify-between gap-2">
                <span>{submitError}</span>
                <button onClick={() => setSubmitError(null)} className="text-xs font-bold hover:underline shrink-0">✕</button>
              </div>
            )}
            <Textarea
              placeholder="Share your experience or knowledge..."
              className="min-h-[120px]"
              value={answerBody}
              onChange={e => setAnswerBody(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Be helpful and respectful. AI moderation will review your answer.
              </p>
              <Button
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerBody.trim()}
                size="sm"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting...</>
                ) : "Post Answer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {question.status !== 'OPEN' && (
        <div className="text-center py-6 rounded-lg border border-muted bg-muted/20 text-sm text-muted-foreground">
          This question is <strong>{statusConfig[question.status]?.label ?? question.status}</strong> and no longer accepting new answers.
        </div>
      )}
    </div>
  );
}

export default function QuestionDetailPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    }>
      <QuestionDetailContent />
    </Suspense>
  );
}