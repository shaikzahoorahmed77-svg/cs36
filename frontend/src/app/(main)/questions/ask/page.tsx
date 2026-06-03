"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lightbulb, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { questionsApi, getUser } from "@/lib/api";
import type { SearchResult } from "@/types";

const SUGGESTED_TAGS = [
  "interview", "salary", "remote", "career", "resume",
  "networking", "technical", "startup", "return-offer", "negotiation",
];

function normalizeScore(raw: number): number {
  if (raw <= 0) return 0;
  return Math.min(raw / (raw + 1.5), 1);
}

export default function AskQuestionPage() {
  const router = useRouter();
  const currentUser = getUser();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [duplicates, setDuplicates] = useState<SearchResult[]>([]);
  const [duplicateSearched, setDuplicateSearched] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for similar questions when user tabs out of title
  const checkDuplicates = async () => {
    if (!title.trim() || title.length < 10) return;
    setDuplicateLoading(true);
    setDuplicateSearched(true);
    try {
      const res = await questionsApi.checkDuplicates(title, body);
      const raw: any[] = res.data.duplicates ?? [];
      setDuplicates(
        raw.map(d => ({
          id: d._id,
          title: d.title,
          body: d.body ?? "",
          tags: d.tags ?? [],
          similarity: normalizeScore(d.score ?? 0),
          answerCount: d.answerCount ?? 0,
          type: "question" as const,
        }))
      );
    } catch {
      setDuplicates([]);
    } finally {
      setDuplicateLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) setTags([...tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim().toLowerCase().replace(/[^a-z0-9\-]/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await questionsApi.create({ title, body, tags });
      router.push(`/questions/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to post question. Please try again.");
      setSubmitting(false);
    }
  };

  const isValid = title.trim().length >= 10 && body.trim().length >= 20;
  const bodyWords = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ask a Question</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Get help from the Vicharanashala community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Title <span className="text-destructive text-xs">*</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="e.g. How do I prepare for a startup technical interview?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={checkDuplicates}
                  maxLength={255}
                />
                {duplicateLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Be specific — imagine you're asking a senior student
                </p>
                <p className={`text-xs ${title.length < 10 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {title.length}/255 {title.length < 10 && `(${10 - title.length} more chars needed)`}
                </p>
              </div>
            </div>

            {/* Duplicate detection results */}
            {duplicateSearched && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {duplicates.length > 0
                      ? `Found ${duplicates.length} similar question${duplicates.length !== 1 ? "s" : ""}`
                      : "No similar questions found — looks new!"}
                  </p>
                </div>
                {duplicates.length > 0 && (
                  <div className="space-y-2">
                    {duplicates.map(d => (
                      <div key={d.id} className="text-sm">
                        <a
                          href={`/questions/${d.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-amber-900 dark:text-amber-100 hover:underline"
                        >
                          {d.title}
                        </a>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          {d.answerCount > 0
                            ? `${d.answerCount} answer${d.answerCount !== 1 ? "s" : ""} · ${Math.round(d.similarity * 100)}% match`
                            : "No answers yet"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Body */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Details <span className="text-destructive text-xs">*</span>
              </label>
              <Textarea
                placeholder="Provide more context. What have you already tried? What's your specific situation?"
                className="min-h-[140px]"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Minimum 20 words — be descriptive
                </p>
                <p className={`text-xs ${bodyWords < 20 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {bodyWords} word{bodyWords !== 1 ? "s" : ""} {bodyWords < 20 && `(${20 - bodyWords} more needed)`}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Tags <span className="text-muted-foreground font-normal">(up to 5)</span>
              </label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1.5">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive leading-none"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={tags.length >= 5}
                    className="text-xs px-2 py-1 rounded-full border border-dashed border-input hover:border-primary/50 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
                <input
                  type="text"
                  placeholder="+ custom tag"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={tags.length >= 5}
                  className="text-xs px-2 py-1 rounded-full border border-dashed border-input bg-transparent hover:border-primary/50 focus:border-primary focus:outline-none disabled:opacity-40 w-28 placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Questions are usually answered within hours
          </p>
          <Button
            type="submit"
            disabled={submitting || !isValid}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting...</>
            ) : "Post Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}