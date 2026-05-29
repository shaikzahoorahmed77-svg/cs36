"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lightbulb, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { questionsApi } from "@/lib/api";
import type { SearchResult } from "@/types";

const SUGGESTED_TAGS = ["interview", "salary", "remote", "career", "resume", "networking", "technical", "startup", "return-offer", "negotiation"];

export default function AskQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [duplicates, setDuplicates] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkDuplicates = async () => {
    if (!title.trim()) return;
    setSearched(true);
    // Simulate API call — replace with real implementation
    setDuplicates([]);
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) setTags([...tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      // await questionsApi.create({ title, body, tags });
      router.push("/questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ask a Question</h1>
        <p className="text-muted-foreground text-sm mt-1">Get help from the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="e.g. How do I prepare for a startup technical interview?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={checkDuplicates}
                maxLength={255}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Be specific — imagine you're asking a senior student</p>
                <p className="text-xs text-muted-foreground">{title.length}/255</p>
              </div>
            </div>

            {/* Duplicate detection */}
            {searched && duplicates.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">Similar questions found</p>
                </div>
                <div className="space-y-2">
                  {duplicates.map(d => (
                    <div key={d.id} className="text-sm">
                      <a href={`/questions/${d.id}`} className="font-medium text-amber-900 hover:underline">{d.title}</a>
                      <p className="text-xs text-amber-700 mt-0.5">{d.answerCount} answers · {Math.round(d.similarity * 100)}% match</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Details</label>
              <Textarea
                placeholder="Provide more context. What have you already tried? What's your specific situation?"
                className="min-h-[140px]"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags <span className="text-muted-foreground font-normal">(up to 5)</span></label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1.5">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                  <button key={tag} type="button" onClick={() => addTag(tag)}
                    className="text-xs px-2 py-1 rounded-full border border-dashed border-input hover:border-primary/50 hover:text-primary transition-colors">
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Questions are usually answered within hours
          </p>
          <Button type="submit" disabled={loading || !title.trim() || !body.trim()}>
            {loading ? "Submitting..." : "Post Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}