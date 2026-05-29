"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "@/components/question-card";
import type { Question } from "@/types";

const FILTERS = ["All", "Unresolved", "Resolved", "My Questions"];
const TAGS = ["interview", "salary", "remote", "career", "startup", "technical"];

const mockQuestions: Question[] = [
  { id: "1", title: "How do I prepare for a technical interview at a startup?", body: "Interview coming up with a Series A startup.", authorId: "u1", author: { id: "u1", name: "Jane Smith" }, status: "resolved", tags: ["interview", "technical"], upvotes: 24, views: 312, answerCount: 5, hasAcceptedAnswer: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", title: "Best way to negotiate a return offer salary?", body: "Got a return offer, how do I negotiate?", authorId: "u1", author: { id: "u1", name: "Jane Smith" }, status: "unresolved", tags: ["salary", "negotiation"], upvotes: 18, views: 200, answerCount: 2, hasAcceptedAnswer: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString() },
  { id: "3", title: "Are remote internships worth it for CS students?", body: "Got two offers — hybrid vs fully remote.", authorId: "u2", author: { id: "u2", name: "Alex Chen" }, status: "resolved", tags: ["remote", "career"], upvotes: 42, views: 890, answerCount: 8, hasAcceptedAnswer: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date().toISOString() },
  { id: "4", title: "Should I take a FAANG internship or a startup offer?", body: "Google vs YC startup — which looks better?", authorId: "u3", author: { id: "u3", name: "Sam Lee" }, status: "unresolved", tags: ["faang", "startup"], upvotes: 31, views: 450, answerCount: 6, hasAcceptedAnswer: false, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date().toISOString() },
];

export default function QuestionsPage() {
  const [filter, setFilter] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  let questions = mockQuestions;
  if (filter === "Unresolved") questions = questions.filter(q => q.status === "unresolved");
  if (filter === "Resolved") questions = questions.filter(q => q.status === "resolved");
  if (filter === "My Questions") questions = questions.filter(q => q.authorId === "u1");
  if (selectedTag) questions = questions.filter(q => q.tags.includes(selectedTag));
  if (search) questions = questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{questions.length} questions</p>
        </div>
        <Link href="/questions/ask"><Button className="gap-2"><Plus className="h-4 w-4" /> Ask Question</Button></Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0 space-y-4">
          <Input placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Filter</p>
            <div className="space-y-0.5">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filter === f ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(tag => (
                <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedTag === tag ? "bg-primary text-white border-primary" : "border-input hover:border-primary/50"}`}>{tag}</button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-3">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No questions found</p>
            </div>
          ) : questions.map(q => <QuestionCard key={q.id} question={q} />)}
        </div>
      </div>
    </div>
  );
}