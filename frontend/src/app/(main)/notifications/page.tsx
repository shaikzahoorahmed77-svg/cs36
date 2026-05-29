"use client";

import { Bell, CheckCircle, MessageSquare, ArrowUp, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/types";

const mockNotifications: Notification[] = [
  { id: "n1", userId: "u1", type: "answer_received", referenceId: "a1", read: false, createdAt: new Date(Date.now() - 1800000).toISOString(), message: "Alex Chen answered your question about technical interview prep" },
  { id: "n2", userId: "u1", type: "answer_approved", referenceId: "a5", read: false, createdAt: new Date(Date.now() - 7200000).toISOString(), message: "Your answer was approved and published to the FAQ" },
  { id: "n3", userId: "u1", type: "upvote_milestone", referenceId: "a1", read: false, createdAt: new Date(Date.now() - 86400000).toISOString(), message: "Your answer reached 10 upvotes! 🎉" },
  { id: "n4", userId: "u1", type: "faq_published", referenceId: "q2", read: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), message: "Your question generated an approved answer — it's now in the FAQ" },
  { id: "n5", userId: "u1", type: "review_needed", referenceId: "q5", read: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), message: "Your question was flagged as potential duplicate" },
];

const icons = {
  answer_received: MessageSquare,
  answer_approved: CheckCircle,
  faq_published: Star,
  upvote_milestone: ArrowUp,
  review_needed: Eye,
};

const colors = {
  answer_received: "text-secondary",
  answer_approved: "text-accent",
  faq_published: "text-primary",
  upvote_milestone: "text-amber-500",
  review_needed: "text-orange-500",
};

export default function NotificationsPage() {
  const unread = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{unread} unread</p>
        </div>
        <Button variant="outline" size="sm">Mark all as read</Button>
      </div>

      <div className="space-y-2">
        {mockNotifications.map(notif => {
          const Icon = icons[notif.type];
          return (
            <Card key={notif.id} className={`transition-colors hover:bg-muted/50 ${!notif.read ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${colors[notif.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </div>
                {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}