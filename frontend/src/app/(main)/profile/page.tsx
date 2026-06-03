"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, MessageSquare, BookOpen } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { authApi, questionsApi, answersApi } from "@/lib/api";

interface ProfileUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  createdAt?: string;
}

interface Question {
  id: string;
  title: string;
  status: string;
  upvotes: number;
  answerCount: number;
  createdAt: string;
}

interface Answer {
  id: string;
  body: string;
  voteScore: number;
  createdAt: string;
  question?: { id: string; title: string; status: string };
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [stats, setStats] = useState({ questions: 0, answers: 0, upvotes: 0 });
  const [tab, setTab] = useState<"questions" | "answers">("questions");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await authApi.me();
        const u = me.data;
        setUser(u);
        setName(u.name ?? "");
        setBio(u.bio ?? "");

        const [qRes, aRes] = await Promise.all([
          questionsApi.list({ authorId: u._id, page: 1 }),
          answersApi.getByAuthor(u._id, 1),
        ]);

        const qs = qRes.data.questions ?? [];
        const as = aRes.data.answers ?? [];

        setQuestions(qs);
        setAnswers(as);
        setStats({
          questions: qRes.data.total ?? qs.length,
          answers: aRes.data.total ?? as.length,
          upvotes: [...qs, ...as].reduce((s: number, i: any) => s + (i.upvotes ?? i.voteScore ?? 0), 0),
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-3 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return <div className="p-8 text-center text-muted-foreground">Failed to load profile.</div>;

  const initials = (user.name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = user.createdAt ? formatDate(user.createdAt) : "Unknown";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarImage />
              <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <Input value={name} onChange={e => setName(e.target.value)} className="max-w-sm" placeholder="Your name" />
                  <Input value={bio} onChange={e => setBio(e.target.value)} className="max-w-sm" placeholder="Short bio..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setUser(u => u ? { ...u, name, bio } : u); setEditing(false); }}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setName(user.name ?? ""); setBio(user.bio ?? ""); setEditing(false); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold">{user.name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{user.bio || "No bio yet"}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{user.role}</span>
                    <span>{user.email}</span>
                    <span>Member since {memberSince}</span>
                  </div>
                </>
              )}
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.questions}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Questions Asked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.answers}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Answers Given</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <ArrowUp className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.upvotes}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total Upvotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity tabs */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setTab("questions")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === "questions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              My Questions ({stats.questions})
            </button>
            <button
              onClick={() => setTab("answers")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === "answers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              My Answers ({stats.answers})
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {tab === "questions" && (
            questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No questions yet. Ask your first question!</p>
            ) : (
              questions.map(q => (
                <div key={q.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium hover:text-primary cursor-pointer line-clamp-2">{q.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.answerCount} answer{q.answerCount !== 1 ? "s" : ""} · {q.upvotes} upvotes · {formatRelativeTime(q.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium
                    ${q.status === "OPEN" ? "bg-yellow-100 text-yellow-700" :
                      q.status === "ANSWERED" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"}`}>
                    {q.status}
                  </span>
                </div>
              ))
            )
          )}
          {tab === "answers" && (
            answers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No answers yet. Answer a question!</p>
            ) : (
              answers.map(a => (
                <div key={a.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-primary font-medium">{a.question?.title ?? "Unknown question"}</p>
                  <p className="text-sm mt-1 line-clamp-2">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <ArrowUp className="h-3 w-3 inline mr-0.5" />
                    {a.voteScore} upvotes · {formatRelativeTime(a.createdAt)}
                  </p>
                </div>
              ))
            )
          )}
        </CardContent>
      </Card>

    </div>
  );
}
