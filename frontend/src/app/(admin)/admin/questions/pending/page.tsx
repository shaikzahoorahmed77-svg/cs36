"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Eye, Trash2, ArrowUp, Flag, Lightbulb } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { adminApi } from "@/lib/api";

interface Question {
  _id: string;
  title: string;
  body: string;
  status: string;
  tags: string[];
  upvotes: number;
  views: number;
  answerCount: number;
  createdAt: string;
  authorId?: { _id: string; name: string; email: string };
}

export default function AdminQuestionsPendingPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = () => {
    setLoading(true);
    adminApi.getPendingQuestions()
      .then(r => setQuestions(r.data.questions))
      .catch(err => { console.error("Failed to load pending questions", err); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.resolveQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      console.error("Failed to resolve question", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    setActionLoading(id);
    try {
      await adminApi.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      console.error("Failed to delete question", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.closeQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      console.error("Failed to close question", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Review</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "..." : `${questions.length} open question${questions.length !== 1 ? "s" : ""} need attention`}
          </p>
        </div>
        <Badge variant="warning">{questions.length} pending</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-accent mx-auto mb-3" />
            <p className="font-semibold text-lg">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No open questions need review right now.</p>
            <Link href="/admin/questions">
              <Button variant="outline" className="mt-4">View all questions</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <Card key={q._id}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">{q.upvotes ?? 0}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="warning" className="text-[10px]">OPEN</Badge>
                      {q.tags?.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                      {q.answerCount > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{q.answerCount} answers</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{q.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{q.body}</p>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">by {q.authorId?.name ?? "Unknown"}</Badge>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(q.createdAt)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{q.views ?? 0} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/questions/${q._id}`}>
                        <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                      </Link>
                      <Button
                        size="sm" variant="success" className="gap-1.5"
                        onClick={() => handleResolve(q._id)}
                        disabled={actionLoading === q._id}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Resolve
                      </Button>
                      <Button
                        size="sm" variant="destructive" className="gap-1.5"
                        onClick={() => handleClose(q._id)}
                        disabled={actionLoading === q._id}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Close
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => handleDelete(q._id)}
                        disabled={actionLoading === q._id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}