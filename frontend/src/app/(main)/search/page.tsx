"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, BookOpen, ArrowRight, Sparkles, ExternalLink, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { questionsApi } from "@/lib/api";
import type { SearchResult } from "@/types";

function normalizeScore(raw: number): number {
  if (raw <= 0) return 0;
  return Math.min(raw / (raw + 1.5), 1);
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<SearchResult | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await questionsApi.search(q);
      const { questions = [], faqs = [] } = res.data.results ?? {};

      const mapped: SearchResult[] = [
        ...faqs.map((f: any) => ({
          id: f._id,
          title: f.question,
          body: f.answer,
          tags: f.tags ?? [],
          similarity: normalizeScore(f.score ?? 0),
          answerCount: f.searchCount ?? 0,
          type: "faq" as const,
        })),
        ...questions.map((q: any) => ({
          id: q._id,
          title: q.title,
          body: q.body,
          tags: q.tags ?? [],
          similarity: normalizeScore(q.score ?? 0),
          answerCount: q.answerCount ?? 0,
          type: "question" as const,
        })),
      ];

      setResults(mapped);
    } catch (err) {
      console.error("[search]", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.replace(`/search?${params.toString()}`, { scroll: false });
    doSearch(q);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Search FAQs</h1>
        <p className="text-muted-foreground text-sm">
          Searches through 132 internship FAQs and community questions
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Try: NOC format, ViBe camera issues, team formation, Rosetta journal..."
          className="pl-12 h-12 text-base rounded-xl border-2 focus:border-primary/50"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch(query)}
        />
        <Button
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8"
          onClick={() => handleSearch(query)}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border bg-card p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length === 0 ? "No" : results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          {results.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try different wording, or ask the community
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/questions/ask")}
              >
                <BookOpen className="h-4 w-4 mr-2" /> Ask a new question
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(result => (
                <Card
                  key={`${result.type}-${result.id}`}
                  className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={async () => {
                    if (result.type === "faq") {
                      setActiveFAQ(result);
                      try {
                        const updatedRes = await questionsApi.clickFaq(result.id);
                        const newCount = updatedRes.data.searchCount ?? (result.answerCount + 1);
                        setActiveFAQ(prev => prev && prev.id === result.id ? { ...prev, answerCount: newCount } : prev);
                        setResults(prev => prev.map(r => r.id === result.id ? { ...r, answerCount: newCount } : r));
                      } catch (err) {
                        console.error("[faq-click]", err);
                      }
                    } else {
                      router.push(`/questions/${result.id}`);
                    }
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge
                            variant={result.type === "faq" ? "success" : "secondary"}
                            className="text-[10px]"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {result.type === "faq" ? "FAQ" : "Question"}
                          </Badge>
                          {result.type === "faq" && result.similarity > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-accent border-accent"
                            >
                              {Math.round(result.similarity * 100)}% match
                            </Badge>
                          )}
                          {result.tags.slice(0, 3).map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>

                        <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                          {result.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.body}
                        </p>

                        <div className="flex items-center gap-4 mt-2.5">
                          {result.type === "faq" ? (
                            <span className="text-xs text-muted-foreground">
                              {result.answerCount > 0
                                ? `Searched ${result.answerCount.toLocaleString()} times`
                                : "Official FAQ"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {result.answerCount > 0
                                ? `${result.answerCount} answer${result.answerCount !== 1 ? "s" : ""}`
                                : "No answers yet"}
                            </span>
                          )}
                        </div>
                      </div>

                      {result.type === "faq" ? (
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty start state */}
      {!loading && !searched && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <p className="font-medium">Start typing to search</p>
          <p className="text-sm text-muted-foreground mt-1">
            Search through 132 internship FAQs and community questions
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {["NOC format", "ViBe camera issues", "Rosetta journal", "Team formation", "Zoom attendance", "Leave policy"].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
                className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-primary/5 hover:border-primary/30 transition-colors text-muted-foreground hover:text-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFAQ && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setActiveFAQ(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveFAQ(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success" className="gap-1">
                  <Sparkles className="h-3 w-3" /> FAQ
                </Badge>
                {activeFAQ.tags.map(t => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
              <h2 className="text-xl md:text-2xl font-bold leading-tight">
                {activeFAQ.title}
              </h2>
            </div>

            {/* Answer Body */}
            <div className="border-t pt-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Answer
              </h3>
              <div className="bg-muted/30 border rounded-xl p-5 md:p-6 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {activeFAQ.body}
              </div>
            </div>

            {/* Footer / Stats */}
            <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
              <div>
                {activeFAQ.answerCount > 0 ? (
                  <span>Helpful answer viewed {activeFAQ.answerCount.toLocaleString()} times</span>
                ) : (
                  <span>Verified Official FAQ</span>
                )}
              </div>
              <Button size="sm" onClick={() => setActiveFAQ(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-4 w-1/3 mb-3" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}