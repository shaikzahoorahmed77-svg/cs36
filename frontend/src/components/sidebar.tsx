"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, MessageSquare, Search, Bell, User,
  Settings, CheckCircle, Shield, BarChart3, Users, Tags, FileText,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/questions", label: "Browse Questions", icon: BookOpen },
  { href: "/questions/ask", label: "Ask Question", icon: MessageSquare },
  { href: "/search", label: "Search FAQs", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/questions/pending", label: "Question Review", icon: CheckCircle },
  { href: "/admin/answers/pending", label: "Answer Review", icon: MessageSquare },
  { href: "/admin/faqs", label: "FAQ Management", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

interface SidebarProps {
  variant?: "student" | "admin";
  collapsed?: boolean;
}

export function Sidebar({ variant = "student", collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const links = variant === "admin" ? adminNav : studentNav;

  return (
    <aside className={cn(
      "flex flex-col h-full shrink-0 border-r bg-white transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      {!collapsed && (
        <div className="p-5 border-b">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">InternFAQ</span>
          </Link>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <link.icon className={cn("h-4 w-4 shrink-0", collapsed && "mx-auto")} />
                {!collapsed && link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {!collapsed && variant === "admin" && (
        <div className="p-3 border-t">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to Site
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}