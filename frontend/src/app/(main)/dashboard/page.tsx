"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, MessageSquare, ArrowUp, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/question-card";
import { questionsApi, getUser } from "@/lib/api";
import type { Question } from "@/types";

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    questionsApi
      .list({ limit: 10 })
      .then(res => setQuestions(res.data.questions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = questions.filter(q => q.status === "OPEN").length;
  const resolved = questions.filter(q => q.status === "RESOLVED").length;
  const totalAnswers = questions.reduce((sum, q) => sum + (q.answerCount ?? 0), 0);
  const totalViews = questions.reduce((sum, q) => sum + (q.views ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5">Here's what's happening</p>
        </div>
        <Link href="/questions/ask">
          <Button className="gap-2">
            <MessageSquare className="h-4 w-4" /> Ask Question
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Questions" value={loading ? "..." : questions.length} icon={BookOpen} color="text-primary" sub="in the community" />
        <StatCard label="Answers" value={loading ? "..." : totalAnswers} icon={MessageSquare} color="text-secondary" sub="given so far" />
        <StatCard label="Resolved" value={loading ? "..." : resolved} icon={CheckCircle} color="text-accent" sub={loading ? "" : `${questions.length > 0 ? Math.round((resolved / questions.length) * 100) : 0}% resolution`} />
        <StatCard label="Total Views" value={loading ? "..." : totalViews.toLocaleString()} icon={ArrowUp} color="text-primary" sub="across all questions" />
      </div>

      {/* Questions + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent questions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Recent Questions
            </h2>
            <Link href="/questions">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-5">
                  <Skeleton className="h-4 w-1/4 mb-3" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No questions yet</p>
              <Link href="/questions/ask">
                <Button variant="outline" size="sm" className="mt-3">Ask the first question</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.slice(0, 5).map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { href: "/questions/ask", label: "Ask a question", icon: MessageSquare },
                { href: "/search", label: "Search FAQs", icon: BookOpen },
                { href: "/profile", label: "My profile", icon: BookOpen },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Open questions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Open Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : questions.filter(q => q.status === "OPEN").length === 0 ? (
                <p className="text-xs text-muted-foreground">No open questions</p>
              ) : (
                questions
                  .filter(q => q.status === "OPEN")
                  .slice(0, 5)
                  .map(q => (
                    <Link key={q.id} href={`/questions/${q.id}`}>
                      <div className="text-sm hover:text-primary transition-colors line-clamp-2">
                        {q.title}
                      </div>
                    </Link>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}