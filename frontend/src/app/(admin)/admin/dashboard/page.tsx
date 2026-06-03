"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, MessageSquare, Users, BookOpen, ArrowRight, TrendingUp, Flag, CheckCircle, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { adminApi } from "@/lib/api";

interface Stats {
  userCount: number;
  questionCount: number;
  answerCount: number;
  faqCount: number;
  recentQuestions: { _id: string; title: string; status: string; createdAt: string }[];
}

interface PendingAnswer {
  id: string;
  body: string;
  status: string;
  authorId?: { _id: string; name: string };
  questionId?: { _id: string; title: string };
  createdAt: string;
}

interface ActivityItem {
  type: string;
  text: string;
  status?: string;
  time: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<PendingAnswer[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTotal, setPendingTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      adminApi.getAnalytics().then(r => r.data),
      adminApi.getPendingAnswers(1).then(r => ({ answers: r.data.answers, total: r.data.total })),
      adminApi.getActivity().then(r => r.data.feed),
    ]).then(([statsData, answersData, feedData]) => {
      setStats(statsData);
      setPendingAnswers(answersData.answers.slice(0, 4));
      setPendingTotal(answersData.total);
      setActivity(feedData);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load admin dashboard", err);
      setLoading(false);
    });
  }, []);

  const handleApproveAnswer = async (id: string) => {
    try {
      await adminApi.approveAnswer(id);
      setPendingAnswers(prev => prev.filter(a => a.id !== id));
      setPendingTotal(prev => prev - 1);
    } catch (err) {
      console.error("Failed to approve answer", err);
    }
  };

  const handleRejectAnswer = async (id: string) => {
    try {
      await adminApi.rejectAnswer(id);
      setPendingAnswers(prev => prev.filter(a => a.id !== id));
      setPendingTotal(prev => prev - 1);
    } catch (err) {
      console.error("Failed to reject answer", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total FAQs", value: stats?.faqCount ?? 0, icon: BookOpen, color: "text-accent", key: "faq" },
    { label: "Pending Answers", value: pendingTotal, icon: MessageSquare, color: "text-warning", key: "pending" },
    { label: "Total Users", value: stats?.userCount ?? 0, icon: Users, color: "text-secondary", key: "user" },
    { label: "Questions", value: stats?.questionCount ?? 0, icon: Flag, color: "text-primary", key: "question" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and moderation queue</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold">{loading ? "-" : value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending review */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-warning" />
                <h2 className="font-semibold text-sm">Pending Answer Review</h2>
                <Badge variant="warning">{pendingTotal} pending</Badge>
              </div>
              <Link href="/admin/answers/pending">
                <Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>

            {pendingAnswers.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up — no pending answers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAnswers.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium">
                        {a.questionId?.title ?? "Unknown question"}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2">{a.body}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {a.authorId?.name ?? "Unknown"} · {formatRelativeTime(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm" variant="success" className="h-7 px-2 text-xs"
                        onClick={() => handleApproveAnswer(a.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm" variant="destructive" className="h-7 px-2 text-xs"
                        onClick={() => handleRejectAnswer(a.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Recent Activity</h2>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="text-sm">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(item.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent questions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Recent Questions</h2>
            </div>
            <Link href="/admin/questions">
              <Button variant="ghost" size="sm" className="gap-1">Manage all <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentQuestions ?? []).slice(0, 5).map((q) => (
              <Link key={q._id} href={`/questions/${q._id}`} className="block">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm truncate flex-1 mr-4">{q.title}</span>
                  <Badge
                    variant={
                      q.status === "RESOLVED" ? "success" :
                      q.status === "CLOSED" ? "destructive" :
                      q.status === "ANSWERED" ? "secondary" : "warning"
                    }
                    className="text-[10px] shrink-0"
                  >
                    {q.status?.toLowerCase()}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/answers/pending", label: "Review Answers", icon: MessageSquare, desc: "Moderate community answers" },
          { href: "/admin/questions", label: "Manage Questions", icon: Flag, desc: "Resolve, close, or delete questions" },
          { href: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "Platform metrics" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}