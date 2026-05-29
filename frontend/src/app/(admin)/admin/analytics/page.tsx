"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, BookOpen, MessageSquare, ArrowUp } from "lucide-react";

const chartData = [
  { month: "Jul", faqs: 820, questions: 234, users: 1200 },
  { month: "Aug", faqs: 940, questions: 289, users: 1450 },
  { month: "Sep", faqs: 1080, questions: 312, users: 2100 },
  { month: "Oct", faqs: 1150, questions: 298, users: 2800 },
  { month: "Nov", faqs: 1220, questions: 340, users: 3200 },
  { month: "Dec", faqs: 1284, questions: 356, users: 3891 },
];

export default function AdminAnalyticsPage() {
  const maxFaq = Math.max(...chartData.map(d => d.faqs));
  const maxUsers = Math.max(...chartData.map(d => d.users));

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform growth and engagement metrics</p>
      </div>

      {/* Top stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total Users", value: "3,891", change: "+21%", icon: Users, color: "text-secondary" },
          { label: "Total FAQs", value: "1,284", change: "+18%", icon: BookOpen, color: "text-accent" },
          { label: "Total Questions", value: "1,829", change: "+15%", icon: MessageSquare, color: "text-primary" },
          { label: "Resolution Rate", value: "94.2%", change: "+2.1%", icon: TrendingUp, color: "text-emerald-500" },
        ].map(({ label, value, change, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUp className="h-3 w-3 text-accent" />
                <span className="text-xs text-accent font-medium">{change}</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-48">
            {chartData.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: "160px" }}>
                  <div className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${(d.faqs / maxFaq) * 100}%`, minHeight: "4px" }} title={`FAQs: ${d.faqs}`} />
                  <div className="w-full bg-secondary/30 rounded-t-sm" style={{ height: `${(d.questions / maxFaq) * 80}%`, minHeight: "4px" }} title={`Questions: ${d.questions}`} />
                </div>
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-primary/20" /> FAQs</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-secondary/30" /> Questions</span>
          </div>
        </CardContent>
      </Card>

      {/* Top tags */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Searched Topics</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { tag: "technical interview", count: 1243 }, { tag: "salary negotiation", count: 892 },
              { tag: "system design", count: 756 }, { tag: "remote work", count: 534 },
              { tag: "return offer", count: 421 }, { tag: "FAANG", count: 398 },
            ].map(({ tag, count }, i) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / 1243) * 100}%` }} />
                </div>
                <span className="text-xs font-medium w-16 text-right">{count.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Resolution Rate by Tag</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { tag: "interview prep", rate: 97 }, { tag: "salary", rate: 94 },
              { tag: "career", rate: 91 }, { tag: "remote", rate: 88 },
              { tag: "startup", rate: 85 }, { tag: "networking", rate: 79 },
            ].map(({ tag, rate }) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20">{tag}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${rate >= 90 ? "bg-accent" : rate >= 80 ? "bg-primary" : "bg-warning"}`} style={{ width: `${rate}%` }} />
                </div>
                <span className="text-xs font-medium w-10 text-right">{rate}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}