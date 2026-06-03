"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/question-card";
import { questionsApi, getUser } from "@/lib/api";
import type { Question } from "@/types";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myQuestionsOnly, setMyQuestionsOnly] = useState(false);

  const currentUser = getUser();

  useEffect(() => {
    setLoading(true);
    questionsApi
      .list({ page, limit: 20, status: filter || undefined, tag: selectedTag ?? undefined, authorId: myQuestionsOnly && currentUser ? currentUser.id : undefined })
      .then(res => {
        setQuestions(res.data.questions ?? []);
        setTotalPages(res.data.totalPages ?? 1);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [page, filter, selectedTag, myQuestionsOnly]);

  // Client-side search filter
  const displayed = search
    ? questions.filter(q =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.body.toLowerCase().includes(search.toLowerCase())
      )
    : questions;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "..." : `${questions.length} question${questions.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/questions/ask">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Ask Question</Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0 space-y-4">
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Status
            </p>
            <div className="space-y-0.5">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => { setFilter(f.value); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filter === f.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              My Questions
            </p>
            <button
              onClick={() => { setMyQuestionsOnly(v => !v); setPage(1); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                myQuestionsOnly
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              My Questions
            </button>
          </div>
        </aside>

        <div className="flex-1 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <Skeleton className="h-4 w-1/4 mb-3" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No questions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try a different search term" : "Be the first to ask!"}
              </p>
              <Link href="/questions/ask">
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Ask a question
                </Button>
              </Link>
            </div>
          ) : (
            displayed.map(q => <QuestionCard key={q.id} question={q} />)
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}