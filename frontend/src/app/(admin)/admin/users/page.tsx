"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Shield, User, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";

const users = [
  { id: "u1", name: "Jane Smith", email: "jane@university.edu", role: "student", questions: 7, answers: 12, joined: "2024-09-01" },
  { id: "u2", name: "Alex Chen", email: "alex@uni.edu", role: "moderator", questions: 14, answers: 28, joined: "2024-08-15" },
  { id: "u3", name: "Sam Lee", email: "sam@university.edu", role: "student", questions: 3, answers: 19, joined: "2024-09-10" },
  { id: "u4", name: "Admin User", email: "admin@internfaq.ai", role: "admin", questions: 1, answers: 5, joined: "2024-07-01" },
  { id: "u5", name: "Taylor Wu", email: "taylor@college.edu", role: "student", questions: 9, answers: 22, joined: "2024-10-01" },
];

const roleBadge = { student: "secondary", moderator: "warning", admin: "default" as const };
const roleIcon = { student: User, moderator: Shield, admin: Shield };

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} total users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Activity</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Joined</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                const Icon = roleIcon[user.role as keyof typeof roleIcon];
                return (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={roleBadge[user.role as keyof typeof roleBadge]} className="gap-1 text-[10px]">
                        <Icon className="h-3 w-3" />{user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm">{user.questions} Q · {user.answers} A</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-muted-foreground">{formatDate(user.joined)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}