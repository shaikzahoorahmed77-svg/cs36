"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { questionsApi } from "@/lib/api";
import type { SearchResult } from "@/types";

const mockResults: SearchResult[] = [
  { id: "1", title: "How do I prepare for a technical interview at a startup?", body: "Interview tips for Series A startups...", tags: ["interview", "technical"], similarity: 0.94, answerCount: 5, type: "faq" },
  { id: "3", title: "Are remote internships worth it for CS students?", body: "Hybrid vs fully remote decision guide...", tags: ["remote", "career"], similarity: 0.72, answerCount: 8, type: "question" },
  { id: "5", title: "What to expect in a system design interview?", body: "Common system design questions and frameworks...", tags: ["interview", "system-design"], similarity: 0.68, answerCount: 12, type: "faq" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    // Simulate search
    await new Promise(r => setTimeout(r, 600));
    const filtered = mockResults.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) || r.body.toLowerCase().includes(q.toLowerCase()));
    setResults(filtered.length ? filtered : mockResults.slice(0, 2));
    setLoading(false);
  };

  useEffect(() => {
    if (initialQ) handleSearch(initialQ);
  }, [initialQ]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Search FAQs</h1>
        <p className="text-muted-foreground text-sm">AI-powered semantic search — finds answers even when wording differs</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search questions, FAQs, topics..."
          className="pl-12 h-12 text-base rounded-xl border-2 focus:border-primary/50"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch(query)}
        />
        <Button className="absolute right-2 top-1/2 -translate-y-1/2 h-8" onClick={() => handleSearch(query)}>
          Search
        </Button>
      </div>

      {/* Results */}
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

      {!loading && searched && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">{results.length} results found</p>
          {results.map(result => (
            <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={result.type === "faq" ? "success" : "secondary"} className="text-[10px]">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {result.type === "faq" ? "FAQ" : "Question"}
                      </Badge>
                      {result.type === "faq" && (
                        <Badge variant="outline" className="text-[10px] text-accent border-accent">
                          {Math.round(result.similarity * 100)}% match
                        </Badge>
                      )}
                      {result.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{result.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">{result.answerCount} answers</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No results found</p>
          <p className="text-sm text-muted-foreground mt-1">Try different wording or ask a new question</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/questions/ask"}>
            <BookOpen className="h-4 w-4 mr-2" /> Ask a new question
          </Button>
        </div>
      )}

      {!searched && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <p className="font-medium">Start typing to search</p>
          <p className="text-sm text-muted-foreground mt-1">Search through thousands of internship FAQs</p>
        </div>
      )}
    </div>
  );
}