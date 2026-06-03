"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Eye, ArrowUp } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/toaster";

interface Answer {
  id: string;
  body: string;
  status: string;
  isApproved: boolean;
  voteScore?: number;
  moderationScore?: number;
  createdAt: string;
  author?: { id: string; name: string; email?: string };
  question?: { id: string; title: string };
}

export default function AdminAnswersPendingPage() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  const fetchPending = () => {
    setLoading(true);
    adminApi.getPendingAnswers(page)
      .then(r => {
        setAnswers(r.data.answers);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load pending answers", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchPending(); }, [page]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const r = await adminApi.approveAnswer(id);
      if (r.data.duplicate) {
        const sim = r.data.existingFAQ;
        addToast({
          title: "Similar FAQ already exists",
          description: `"${sim?.question?.slice(0, 55)}" (${Math.round((sim?.similarity ?? 0) * 100)}% match) — answer kept in queue.`,
          variant: "warning",
        });
        // Answer is still PENDING — don't remove from list
      } else {
        const qTitle = answers.find(a => a.id === id)?.question?.title ?? "the question";
        addToast({
          title: "Answer approved",
          description: `Approved and added to FAQ: "${qTitle.slice(0, 50)}${qTitle.length > 50 ? '…' : ''}"`,
          variant: "success",
        });
      }
      setAnswers(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      const sim = err?.response?.data?.existingFAQ;
      const status = err?.response?.status;
      if (status === 409 && sim) {
        addToast({
          title: "Similar FAQ already exists",
          description: `"${sim.question?.slice(0, 55)}" (${Math.round((sim.similarity ?? 0) * 100)}% match) — answer kept in queue.`,
          variant: "warning",
        });
      } else {
        addToast({ title: "Failed to approve", description: "Something went wrong.", variant: "error" });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.rejectAnswer(id);
      setAnswers(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error("Failed to reject answer", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Answer Review</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} answers awaiting moderation</p>
        </div>
        <Badge variant="warning">{total} pending</Badge>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : answers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="font-semibold text-lg">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No answers pending review</p>
            </CardContent>
          </Card>
        ) : (
          answers.map(a => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">{a.voteScore ?? 0}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {a.question?.title ?? "Unknown question"}
                      </span>
                      {a.moderationScore != null && (
                        <Badge
                          variant={a.moderationScore < 0.3 ? "success" : a.moderationScore < 0.6 ? "warning" : "destructive"}
                          className="text-[10px]"
                        >
                          mod score: {a.moderationScore.toFixed(2)}
                        </Badge>
                      )}
                    </div>

                    <p className={`text-sm leading-relaxed ${expanded === a.id ? "" : "line-clamp-2"}`}>{a.body}</p>

                    {expanded === a.id && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                        <p><strong>Author:</strong> {a.author?.name ?? "Unknown"} ({a.author?.email ?? "no email"})</p>
                        <p><strong>Submitted:</strong> {formatRelativeTime(a.createdAt)}</p>
                        <p><strong>Moderation score:</strong> {a.moderationScore?.toFixed(3) ?? "N/A"}</p>
                        <p><strong>Current votes:</strong> {a.voteScore ?? 0}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{a.author?.name ?? "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          {expanded === a.id ? "Collapse" : "Review"}
                        </Button>
                        <Button
                          size="sm" variant="success" className="gap-1.5"
                          onClick={() => handleApprove(a.id)}
                          disabled={actionLoading === a.id}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm" variant="destructive" className="gap-1.5"
                          onClick={() => handleReject(a.id)}
                          disabled={actionLoading === a.id}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
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
