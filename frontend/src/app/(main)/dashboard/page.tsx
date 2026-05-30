import Link from "next/link";
import { BookOpen, MessageSquare, ArrowUp, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/question-card";
import type { Question } from "@/types";
import { getUser } from "@/lib/api";

// Mock data — replace with real API calls
const mockQuestions: Question[] = [
  {
    id: "1",
    title: "How do I prepare for a technical interview at a startup?",
    body: "I have an interview coming up with a Series A startup. What should I focus on?",
    authorId: "u1",
    author: { id: "u1", name: "Jane Smith", avatarUrl: null },
    status: "resolved",
    tags: ["interview", "technical", "startup"],
    upvotes: 24,
    views: 312,
    answerCount: 5,
    hasAcceptedAnswer: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "2",
    title: "What's the best way to negotiate a return offer salary?",
    body: "Just finished my internship and they want to extend a return offer. How do I negotiate?",
    authorId: "u1",
    author: { id: "u1", name: "Jane Smith", avatarUrl: null },
    status: "unresolved",
    tags: ["salary", "negotiation", "return-offer"],
    upvotes: 18,
    views: 200,
    answerCount: 2,
    hasAcceptedAnswer: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "3",
    title: "Are remote internships worth it for CS students?",
    body: "I got two offers — one hybrid, one fully remote. Is remote going to hurt my career growth?",
    authorId: "u2",
    author: { id: "u2", name: "Alex Chen", avatarUrl: null },
    status: "resolved",
    tags: ["remote", "career", "cs"],
    upvotes: 42,
    views: 890,
    answerCount: 8,
    hasAcceptedAnswer: true,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const stats = [
  { label: "Questions Asked", value: "7", icon: BookOpen, change: "+2 this week", color: "text-primary" },
  { label: "Answers Given", value: "12", icon: MessageSquare, change: "+3 this week", color: "text-secondary" },
  { label: "Total Upvotes", value: "47", icon: ArrowUp, change: "+8 this week", color: "text-accent" },
  { label: "Resolved", value: "5", icon: CheckCircle, change: "71% resolution", color: "text-emerald-500" },
];

export default function DashboardPage() {
  const user = getUser();
  const trendingQuestions = mockQuestions;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-0.5">Here's your activity overview</p>
        </div>
        <Link href="/questions/ask">
          <Button className="gap-2">
            <MessageSquare className="h-4 w-4" /> Ask Question
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map(({ label, value, icon: Icon, change, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trending + My Questions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Trending Questions
            </h2>
            <Link href="/questions"><Button variant="ghost" size="sm">View all</Button></Link>
          </div>
          <div className="space-y-3 stagger-children">
            {trendingQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Unresolved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockQuestions.filter(q => q.status === "unresolved").map(q => (
                <Link key={q.id} href={`/questions/${q.id}`}>
                  <div className="text-sm hover:text-primary transition-colors line-clamp-2">
                    {q.title}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}