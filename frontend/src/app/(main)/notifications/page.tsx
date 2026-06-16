"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, MessageSquare, ArrowUp, Star, Eye, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/types";

const icons: Record<string, React.ComponentType<any>> = {
  ANSWER_RECEIVED: MessageSquare,
  ANSWER_APPROVED: CheckCircle,
  FAQ_PUBLISHED: Star,
  UPVOTE_RECEIVED: ArrowUp,
  QUESTION_RESOLVED: CheckCircle,
  NEW_QUESTION_ASKED: MessageSquare,
  NEW_ANSWER_PENDING: Eye,
  MENTION: User,
  // Fallbacks
  answer_received: MessageSquare,
  answer_approved: CheckCircle,
  faq_published: Star,
  upvote_milestone: ArrowUp,
  review_needed: Eye,
};

const colors: Record<string, string> = {
  ANSWER_RECEIVED: "text-secondary",
  ANSWER_APPROVED: "text-accent",
  FAQ_PUBLISHED: "text-primary",
  UPVOTE_RECEIVED: "text-amber-500",
  QUESTION_RESOLVED: "text-emerald-500",
  NEW_QUESTION_ASKED: "text-indigo-500",
  NEW_ANSWER_PENDING: "text-orange-500",
  MENTION: "text-blue-500",
  // Fallbacks
  answer_received: "text-secondary",
  answer_approved: "text-accent",
  faq_published: "text-primary",
  upvote_milestone: "text-amber-500",
  review_needed: "text-orange-500",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = (showSilent = false) => {
    if (!showSilent) setLoading(true);
    notificationsApi.list()
      .then(res => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load notifications", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time polling every 15 seconds
    const interval = setInterval(() => fetchNotifications(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try {
        await notificationsApi.markRead(notif.id);
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading..." : `${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchNotifications()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-3">
                <Skeleton className="h-4 w-4 rounded mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notif => {
            const Icon = icons[notif.type] || Bell;
            const colorClass = colors[notif.type] || "text-muted-foreground";
            return (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`transition-all hover:bg-muted/50 cursor-pointer ${
                  !notif.isRead ? "border-primary/20 bg-primary/[0.02] font-medium" : ""
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}