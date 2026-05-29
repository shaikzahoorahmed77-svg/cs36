"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, MessageSquare, Users, BookOpen, ArrowRight, TrendingUp, Flag, CheckCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const stats = [
  { label: "Total FAQs", value: "1,284", change: "+42 this week", icon: BookOpen, color: "text-accent" },
  { label: "Pending Answers", value: "23", change: "Needs review", icon: MessageSquare, color: "text-warning" },
  { label: "Total Users", value: "3,891", change: "+156 this week", icon: Users, color: "text-secondary" },
  { label: "Questions Resolved", value: "94.2%", change: "+2.1% vs last month", icon: CheckCircle, color: "text-primary" },
];

const pendingAnswers = [
  { id: "a1", question: "How do I handle a panel interview?", answer: "Panel interviews can be daunting. Here's my approach...", author: "Sam Lee", votes: 8, time: "2h ago" },
  { id: "a2", question: "Is it normal to not hear back after an interview?", answer: "Yes, it's very common. Most companies take 2-4 weeks to respond...", author: "Alex Chen", votes: 5, time: "5h ago" },
  { id: "a3", question: "Should I include GPA on my resume for internships?", answer: "For most tech internships, GPA matters less than projects...", author: "Jordan Kim", votes: 12, time: "1d ago" },
];

const recentActivity = [
  { type: "faq_published", text: '"How to prepare for system design interviews" published to FAQ', time: "3h ago" },
  { type: "user_joined", text: "New user Priya Sharma joined", time: "4h ago" },
  { type: "question_resolved", text: '"Best time to apply for summer internships" marked resolved', time: "6h ago" },
  { type: "answer_approved", text: "Answer approved for question about remote internships", time: "1d ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and moderation queue</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map(({ label, value, change, icon: Icon, color }) => (
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending review */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-warning" />
                <h2 className="font-semibold text-sm">Pending Answer Review</h2>
                <Badge variant="warning">{pendingAnswers.length} pending</Badge>
              </div>
              <Link href="/admin/answers/pending">
                <Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
            <div className="space-y-3">
              {pendingAnswers.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium">{a.question}</p>
                    <p className="text-sm mt-1 line-clamp-2">{a.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{a.author} · {a.votes} votes · {a.time}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="success" className="h-7 px-2 text-xs">Approve</Button>
                    <Button size="sm" variant="destructive" className="h-7 px-2 text-xs">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/answers/pending", label: "Review Answers", icon: MessageSquare, desc: "Moderate community answers" },
          { href: "/admin/faqs", label: "Manage FAQs", icon: BookOpen, desc: "Edit or remove FAQs" },
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