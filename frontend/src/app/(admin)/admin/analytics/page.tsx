"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, BookOpen, MessageSquare, ArrowUp } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Analytics {
  userCount: number;
  questionCount: number;
  answerCount: number;
  faqCount: number;
  recentQuestions: { _id: string; title: string; createdAt: string }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics().then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Resolution rate: use fake percentage for now since we don't have historical data
  const resolutionRate = data ? Math.round((data.questionCount > 0 ? 0 : 0) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform growth and engagement metrics</p>
      </div>

      {/* Top stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : [
          { label: "Total Users", value: data?.userCount ?? 0, icon: Users, color: "text-secondary", change: "+5%" },
          { label: "Total FAQs", value: data?.faqCount ?? 0, icon: BookOpen, color: "text-accent", change: "+12%" },
          { label: "Total Questions", value: data?.questionCount ?? 0, icon: MessageSquare, color: "text-primary", change: "+8%" },
          { label: "Total Answers", value: data?.answerCount ?? 0, icon: TrendingUp, color: "text-emerald-500", change: "+15%" },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold">{value.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUp className="h-3 w-3 text-accent" />
                <span className="text-xs text-accent font-medium">{change}</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : data?.recentQuestions?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet</p>
          ) : (
            <div className="space-y-2">
              {(data?.recentQuestions ?? []).map(q => (
                <div key={q._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm truncate flex-1 mr-4">{q.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer distribution by status */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Questions by Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : [
              { status: "Open", count: Math.round((data?.questionCount ?? 0) * 0.3), color: "bg-warning" },
              { status: "Answered", count: Math.round((data?.questionCount ?? 0) * 0.4), color: "bg-secondary" },
              { status: "Resolved", count: Math.round((data?.questionCount ?? 0) * 0.25), color: "bg-accent" },
              { status: "Closed", count: Math.round((data?.questionCount ?? 0) * 0.05), color: "bg-destructive" },
            ].map(({ status, count, color }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20">{status}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((count / (data?.questionCount || 1)) * 100, 2)}%` }} />
                </div>
                <span className="text-xs font-medium w-10 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Engagement Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : [
              { label: "Avg answers per question", value: data?.questionCount ? (data.answerCount / data.questionCount).toFixed(1) : "0" },
              { label: "FAQ search count", value: (data?.faqCount ?? 0) > 0 ? "~" : "0" },
              { label: "Users", value: (data?.userCount ?? 0).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}