"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { clearToken } from "@/lib/api";

interface NavbarProps {
  token: string | null;
  onTokenChange: (token: string | null) => void;
}

export function Navbar({ token, onTokenChange }: NavbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = "JS";
  const unreadNotifications = 2;

  const handleLogout = () => {
    clearToken();
    onTokenChange(null);
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 sm:px-6 gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
          <span className="text-primary">Intern</span>
          <span>FAQ</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </Link>

          {/* User menu */}
          {token ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-muted rounded-lg p-1.5 transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-background shadow-lg z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">Jane Smith</p>
                      <p className="text-xs text-muted-foreground">jane@university.edu</p>
                    </div>
                    <div className="py-1">
                      {[
                        { href: "/profile", label: "Profile", icon: User },
                        { href: "/settings", label: "Settings", icon: Bell },
                      ].map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} onClick={() => setDropdownOpen(false)}>
                          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                            <Icon className="h-4 w-4 text-muted-foreground" />{label}
                          </button>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-destructive text-left"
                      >
                        <LogOut className="h-4 w-4" />Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/register"><Button size="sm">Sign up</Button></Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}